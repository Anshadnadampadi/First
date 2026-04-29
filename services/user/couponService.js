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

    // ── Discount Calculation with Safety Limit ──
    const cartTotal = cart.subtotal || 0;
    const originalTotal = cart.originalSubtotal || cartTotal;
    const currentOfferDiscount = Math.max(0, originalTotal - cartTotal);
    
    // Safety limit: Total discount (Offer + Coupon) cannot exceed 50% of original price
    const MAX_TOTAL_DISCOUNT_PERCENT = 50; 
    const maxAllowedTotalDiscount = Math.floor(originalTotal * (MAX_TOTAL_DISCOUNT_PERCENT / 100));
    const remainingDiscountGap = Math.max(0, maxAllowedTotalDiscount - currentOfferDiscount);

    // Minimum amount check
    if (cartTotal < coupon.minAmount) {
        throw new Error(`Minimum purchase ₹${coupon.minAmount} required`);
    }

    let potentialDiscount = 0;
    if (coupon.discountType === "percentage") {
        potentialDiscount = Math.floor((cartTotal * coupon.discountValue) / 100);
    } else {
        potentialDiscount = coupon.discountValue;
    }

    // Max discount cap defined on the coupon itself
    if (coupon.maxDiscount && potentialDiscount > coupon.maxDiscount) {
        potentialDiscount = coupon.maxDiscount;
    }

    // ENFORCE GLOBAL OVER-DISCOUNTING LIMIT
    const finalDiscount = Math.min(potentialDiscount, remainingDiscountGap);

    if (finalDiscount < potentialDiscount && finalDiscount === remainingDiscountGap) {
        // Optional: We could inform the user that the discount was capped, 
        // but for now we just apply the maximum allowed.
    }

    const finalAmount = cartTotal - finalDiscount;

    // Save coupon in cart
    cart.coupon = coupon._id;
    cart.discount = finalDiscount;
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