// services/user/couponService.js

import Coupon from "../../models/coupon/coupon.js";
import Cart from "../../models/cart/cart.js";




export const applyCouponService = async (userId, code) => {
    const normalizedCode = code ? code.trim().toUpperCase() : '';
    const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });

    if (!coupon) throw new Error("Invalid or inactive coupon");

    // Expiry check
    if (new Date(coupon.expiryDate) < new Date()) {
        throw new Error("Coupon expired");
    }

    // Check usage limit
    if (coupon.usageLimit <= coupon.usedBy.length) {
        throw new Error("Coupon usage limit reached");
    }

    // Check if user already used
    if (coupon.usedBy.some(id => id.toString() === userId.toString())) {
        throw new Error("You already used this coupon");
    }

    // Get cart
    const cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    // Calculate cart total
    let cartTotal = 0;

    cart.items.forEach(item => {
        cartTotal += item.qty * item.price;
    });

    // Minimum amount check
    if (cartTotal < coupon.minAmount) {
        throw new Error(`Minimum purchase ₹${coupon.minAmount} required`);
    }

    // Calculate discount
    let discount = 0;

    if (coupon.discountType === "percentage") {
        discount = (cartTotal * coupon.discountValue) / 100;
    } else {
        discount = coupon.discountValue;
    }

    // Max discount cap
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
    }

    const finalAmount = cartTotal - discount;

    // Save coupon in cart (IMPORTANT 🔥)
    cart.coupon = coupon._id;
    cart.discount = discount;
    cart.finalAmount = finalAmount;

    await cart.save();

    return {
        cartTotal,
        discount,
        finalAmount
    };
};


export const removeCouponService = async (userId) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) throw new Error("Cart not found");

    cart.coupon = null;
    cart.discount = 0;
    cart.finalAmount = cart.subtotal;

    await cart.save();

    return {
        finalAmount: cart.subtotal
    };
};

export const getAvailableCouponsService = async (userId) => {
    const coupons = await Coupon.find({
        isActive: true,
        expiryDate: { $gt: new Date() },
        usedBy: { $ne: userId }
    }).sort({ createdAt: -1 }).lean();
    
    // Filter out coupons that have reached their usage limit
    return coupons.filter(c => (c.usedBy ? c.usedBy.length : 0) < (c.usageLimit || 1));
};