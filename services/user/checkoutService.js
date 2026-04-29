import crypto from 'crypto';
import Order from '../../models/order/order.js';
import Product from '../../models/product/Product.js';
import User from '../../models/user/User.js';
import Wallet from '../../models/user/Wallet.js';
import * as cartService from './cartService.js';
import { isSameVariant } from '../../utils/productHelpers.js';
import { createAdminNotification } from '../../utils/notificationHelper.js';
import Coupon from '../../models/coupon/coupon.js';
import razorpay from '../../config/razorpay.js';

export const placeOrderService = async (userId, orderData) => {
    const { addressId, paymentMethod, couponCode } = orderData;
    
    const cart = await cartService.getCartData(userId);
    if (!cart || cart.items.length === 0) {
        return { success: false, message: 'Cart is empty.', status: 400 };
    }

    if (cart.items.some(i => i.isUnavailable || i.isOutOfStock || i.insufficientStock)) {
        return { 
            success: false, 
            message: 'Some items in your cart are no longer available or out of stock.', 
            status: 400 
        };
    }

    const user = await User.findById(userId).populate("addresses");
    if (!user || user.isBlocked) {
        return { success: false, message: 'User unauthorized or blocked.', status: 403, terminate: true };
    }

    const address = user.addresses.find(a => a._id.toString() === addressId);
    if (!address) {
        return { success: false, message: 'Address not found or unauthorized.', status: 404 };
    }

    const originalSubtotal = cart.originalSubtotal || cart.subtotal || 0;
    let subtotal = cart.subtotal || 0;
    let tax = Math.floor(subtotal * 0.18); 
    let shippingFee = subtotal > 500 ? 0 : 50; 
    
    let discount = 0;
    let appliedCoupon = null;

    // Safety limit: Total discount (Offer + Coupon) cannot exceed 50% of original price
    const MAX_TOTAL_DISCOUNT_PERCENT = 50; 
    const currentOfferDiscount = Math.max(0, originalSubtotal - subtotal);

    if (couponCode) {
        const coupon = await Coupon.findOne({ 
            code: couponCode.trim().toUpperCase(),
            isActive: true
        });

        if (coupon && new Date(coupon.expiryDate) > new Date()) {
            const hasUsed = coupon.usedBy.some(id => id.toString() === userId.toString());
            if (subtotal >= coupon.minAmount && !hasUsed && coupon.usedBy.length < coupon.usageLimit) {
                let potentialCouponDiscount = 0;
                if (coupon.discountType === 'percentage') {
                    potentialCouponDiscount = Math.floor((subtotal) * (coupon.discountValue / 100));
                    if (coupon.maxDiscount && potentialCouponDiscount > coupon.maxDiscount) {
                        potentialCouponDiscount = coupon.maxDiscount;
                    }
                } else {
                    potentialCouponDiscount = coupon.discountValue;
                }

                // Check against safety limit
                const maxAllowedTotalDiscount = Math.floor(originalSubtotal * (MAX_TOTAL_DISCOUNT_PERCENT / 100));
                const remainingDiscountGap = Math.max(0, maxAllowedTotalDiscount - currentOfferDiscount);

                // Cap the coupon discount if it exceeds the remaining gap
                discount = Math.min(potentialCouponDiscount, remainingDiscountGap);
                appliedCoupon = coupon;
            }
        }
    }
    
    let totalAmount = Math.max(0, subtotal + tax + shippingFee - discount);
    const orderId = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Reduce stock
    for (const item of cart.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
            if (item.variant && product.variants.length > 0) {
                const variantIndex = product.variants.findIndex(v => isSameVariant(v, item.variant));
                if (variantIndex > -1) {
                    if (product.variants[variantIndex].stock >= item.qty) {
                        product.variants[variantIndex].stock -= item.qty;
                    } else {
                        throw new Error(`Insufficient stock for ${product.name}`);
                    }
                }
            } else {
                if (product.stock >= item.qty) {
                    product.stock -= item.qty;
                } else {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }
            }
            await product.save();
        }
    }

    const newOrder = new Order({
        orderId,
        user: userId,
        items: cart.items.map(item => ({
            product: item.product._id,
            variant: item.variant,
            qty: item.qty,
            price: item.price
        })),
        shippingAddress: {
            fullName: address.name,
            phone: address.phone,
            streetAddress: `${address.addr1} ${address.addr2 || ''}`.trim(),
            city: address.city,
            state: address.state,
            pinCode: address.zip,
            country: address.country
        },
        subtotal, tax, shippingFee, discount, totalAmount, couponCode, paymentMethod,
        paymentStatus: paymentMethod === 'WALLET' ? 'Paid' : 'Pending', 
        orderStatus: paymentMethod === 'ONLINE PAYMENT' ? 'Pending' : 'Confirmed'
    });

    // If Wallet payment, deduct balance
    if (paymentMethod === 'WALLET') {
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet || wallet.balance < totalAmount) {
            return { success: false, message: 'Insufficient wallet balance.', status: 400 };
        }

        wallet.balance -= totalAmount;
        wallet.transactions.push({
            amount: totalAmount,
            type: 'debit',
            description: `Payment for Order #${orderId}`,
            txnId: `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            orderId: orderId,
            status: 'Success',
            timestamp: new Date()
        });
        await wallet.save();
    }

    // If Razorpay, create razorpay order
    let razorpayOrder = null;
    if (paymentMethod === 'ONLINE PAYMENT') {
        const options = {
            amount: Math.round(totalAmount * 100), // in paise
            currency: "INR",
            receipt: orderId,
        };
        try {
            razorpayOrder = await razorpay.orders.create(options);
            newOrder.razorpayOrderId = razorpayOrder.id;
        } catch (err) {
            console.error("Razorpay Order Creation Error:", err);
            return { success: false, message: 'Failed to initiate online payment.', status: 500 };
        }
    }

    await newOrder.save();

    // If coupon used, update coupon stats
    if (appliedCoupon) {
        appliedCoupon.usedBy.push(userId);
        await appliedCoupon.save();
    }

    // If not Online Payment, we can finalize notifications and clear cart
    if (paymentMethod !== 'ONLINE PAYMENT') {
        // Clear Cart
        await cartService.clearCart(userId);

        // Admin Alert
        await createAdminNotification({
            type: 'order_placed',
            title: 'New Order Received',
            message: `Order #${newOrder.orderId} has been placed by ${user.name || user.email}. Total: ₹${newOrder.totalAmount.toLocaleString()}`,
            orderId: newOrder._id
        });
    }

    return { 
        success: true, 
        message: 'Order placed successfully', 
        orderId: newOrder.orderId,
        dbOrderId: newOrder._id,
        razorpayOrder: razorpayOrder,
        paymentMethod
    };
};

export const verifyPaymentService = async (paymentData) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = paymentData;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        const order = await Order.findOne({ orderId: orderId });
        if (order) {
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Confirmed';
            order.razorpayPaymentId = razorpay_payment_id;
            order.razorpaySignature = razorpay_signature;
            await order.save();

            // Clear Cart
            await cartService.clearCart(order.user);

            // Admin Alert
            const user = await User.findById(order.user);
            await createAdminNotification({
                type: 'order_placed',
                title: 'New Online Order',
                message: `Order #${order.orderId} (Online) confirmed. Total: ₹${order.totalAmount.toLocaleString()}`,
                orderId: order._id
            });

            return { success: true, message: 'Payment verified successfully.' };
        }
    }

    return { success: false, message: 'Payment verification failed.' };
};

export const retryPaymentService = async (orderId, userId) => {
    const order = await Order.findOne({ orderId: orderId, user: userId });
    
    if (!order) {
        throw new Error("Order not found");
    }

    if (order.orderStatus !== 'Pending') {
        throw new Error(`Order cannot be paid. Status: ${order.orderStatus}`);
    }

    if (order.paymentMethod !== 'ONLINE PAYMENT') {
        throw new Error("Only online payments can be retried");
    }

    // Create a NEW Razorpay order for the retry
    const options = {
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        receipt: order.orderId,
    };

    try {
        const razorpayOrder = await razorpay.orders.create(options);
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return {
            success: true,
            orderId: order.orderId,
            razorpayOrder: razorpayOrder
        };
    } catch (err) {
        console.error("Retry Payment Error:", err);
        throw new Error("Failed to initiate payment retry");
    }
};
