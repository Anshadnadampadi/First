// services/user/couponService.js

import Coupon from "../../models/coupon/coupon.js";
import Cart from "../../models/cart/cart.js";




export const applyCouponService = async (userId, code) => {

    const coupon = await Coupon.findOne({ code });

    if (!coupon) throw new Error("Invalid coupon");

    // Expiry check
    if (coupon.expiryDate < new Date()) {
        throw new Error("Coupon expired");
    }

    // Check usage limit
    if (coupon.usageLimit <= coupon.usedBy.length) {
        throw new Error("Coupon usage limit reached");
    }

    // Check if user already used
    if (coupon.usedBy.includes(userId)) {
        throw new Error("You already used this coupon");
    }

    // Get cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    // Calculate cart total
    let cartTotal = 0;

    cart.items.forEach(item => {
        cartTotal += item.quantity * item.productId.price;
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
    cart.finalAmount = cart.totalAmount;

    await cart.save();

    return {
        finalAmount: cart.totalAmount
    };
};