
import Coupon from "../../models/coupon/coupon.js";

export const createCouponService = async (data) => {

    let {
        code,
        discountType,
        discountValue,
        minAmount,
        maxDiscount,
        expiryDate,
        usageLimit
    } = data;

    // 🧹 Normalize
    code = code?.trim().toUpperCase();

    // ✅ Code validation
    if (!code || !/^[A-Z0-9]{4,15}$/.test(code)) {
        throw new Error("Invalid coupon code (4–15 uppercase chars)");
    }

    // ✅ Type
    if (!["fixed", "percentage"].includes(discountType)) {
        throw new Error("Invalid discount type");
    }

    // ✅ Discount
    discountValue = Number(discountValue);
    if (!discountValue || discountValue <= 0) {
        throw new Error("Discount must be greater than 0");
    }

    if (discountType === "percentage" && discountValue > 100) {
        throw new Error("Percentage cannot exceed 100");
    }

    // ✅ Min amount
    minAmount = Number(minAmount || 0);
    if (minAmount < 0) {
        throw new Error("Minimum amount cannot be negative");
    }

    // ✅ Max discount
    if (maxDiscount !== undefined && maxDiscount !== "") {
        maxDiscount = Number(maxDiscount);
        if (maxDiscount < 0) {
            throw new Error("Max discount cannot be negative");
        }
    } else {
        maxDiscount = null;
    }

    if (discountType === "percentage" && !maxDiscount) {
        throw new Error("Max discount required for percentage coupons");
    }

    // ✅ Expiry
    const expiry = new Date(expiryDate);
    if (!expiryDate || isNaN(expiry.getTime()) || expiry <= new Date()) {
        throw new Error("Expiry must be a future date");
    }

    // ✅ Usage limit
    usageLimit = Number(usageLimit);
    if (!usageLimit || usageLimit < 1) {
        throw new Error("Usage limit must be at least 1");
    }

    // ✅ Unique
    const existing = await Coupon.findOne({ code });
    if (existing) {
        throw new Error("Coupon already exists");
    }

    // ✅ Create
    return await Coupon.create({
        code,
        discountType,
        discountValue,
        minAmount,
        maxDiscount,
        expiryDate: expiry,
        usageLimit
    });
};

export const getCouponService = async (query) => {

    const { search = "", page = 1, limit = 10 } = query;

    const filter = {
        code: { $regex: search, $options: "i" }
    };

    return await Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
};

export const updateCouponService = async (id, data) => {

    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error("Coupon not found");

    //  Prevent editing used coupons (important)
    if (coupon.usedBy?.length > 0) {
        throw new Error("Cannot edit a used coupon");
    }

    let {
        code,
        discountType,
        discountValue,
        minAmount,
        maxDiscount,
        expiryDate,
        usageLimit
    } = data;

    // 🧹 Normalize
    code = code?.trim().toUpperCase();

    // ✅ Code validation
    if (!code || !/^[A-Z0-9]{4,15}$/.test(code)) {
        throw new Error("Invalid coupon code (4–15 uppercase chars)");
    }

    // ✅ Type
    if (!["fixed", "percentage"].includes(discountType)) {
        throw new Error("Invalid discount type");
    }

    // ✅ Discount
    discountValue = Number(discountValue);
    if (!discountValue || discountValue <= 0) {
        throw new Error("Discount must be greater than 0");
    }

    if (discountType === "percentage" && discountValue > 100) {
        throw new Error("Percentage cannot exceed 100");
    }

    // ✅ Min amount
    minAmount = Number(minAmount || 0);
    if (minAmount < 0) {
        throw new Error("Minimum amount cannot be negative");
    }

    // ✅ Max discount
    if (maxDiscount !== undefined && maxDiscount !== "") {
        maxDiscount = Number(maxDiscount);
        if (maxDiscount < 0) {
            throw new Error("Max discount cannot be negative");
        }
    } else {
        maxDiscount = null;
    }

    if (discountType === "percentage" && !maxDiscount) {
        throw new Error("Max discount required for percentage coupons");
    }

    // ✅ Expiry
    const expiry = new Date(expiryDate);
    if (!expiryDate || isNaN(expiry.getTime()) || expiry <= new Date()) {
        throw new Error("Expiry must be a future date");
    }

    // ✅ Usage limit
    usageLimit = Number(usageLimit);
    if (!usageLimit || usageLimit < 1) {
        throw new Error("Usage limit must be at least 1");
    }

    // ✅ Unique
    const existing = await Coupon.findOne({ code, _id: { $ne: id } });
    if (existing) {
        throw new Error("Coupon already exists");
    }

    coupon.code = code;
    coupon.discountType = discountType;
    coupon.discountValue = discountValue;
    coupon.minAmount = minAmount;
    coupon.maxDiscount = maxDiscount;
    coupon.expiryDate = expiry;
    coupon.usageLimit = usageLimit;

    await coupon.save();
    return coupon;
};

//toggle the coupon active and inactive
export const toggleCouponStatusService = async (id) => {

    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error("Coupon not found");

    coupon.isActive = !coupon.isActive;

    await coupon.save();

    return coupon;
};

//delete the coupon
export const deleteCouponService = async (id) => {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error("Coupon not found");
    
    // Check if coupon is already used, maybe prevent deletion?
    if (coupon.usedBy && coupon.usedBy.length > 0) {
        throw new Error("Cannot delete a coupon that has already been used");
    }

    await Coupon.findByIdAndDelete(id);
    return true;
};