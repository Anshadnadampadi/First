import crypto from 'crypto';
import Order from '../../models/order/order.js';
import Product from '../../models/product/Product.js';
import User from '../../models/user/User.js';
import * as cartService from './cartService.js';
import { isSameVariant } from '../../utils/productHelpers.js';
import { createAdminNotification } from '../../utils/notificationHelper.js';

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

    let subtotal = cart.subtotal || 0;
    let tax = Math.floor(subtotal * 0.18); 
    let shippingFee = subtotal > 500 ? 0 : 50; 
    
    let discount = 0;
    if (couponCode && couponCode.trim().toUpperCase() === 'SYNC10') {
        discount = Math.floor((subtotal + tax) * 0.10);
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
        paymentStatus: paymentMethod === 'CASH ON DELIVERY' ? 'Pending' : 'Paid', 
        orderStatus: 'Processing'
    });

    await newOrder.save();

    // Admin Alert
    await createAdminNotification({
        type: 'order_placed',
        title: 'New Order Received',
        message: `Order #${newOrder.orderId} has been placed by ${user.name || user.email}. Total: ₹${newOrder.totalAmount.toLocaleString()}`,
        orderId: newOrder._id
    });

    await cartService.clearCart(userId);

    return { success: true, message: 'Order placed successfully', orderId: newOrder.orderId };
};
