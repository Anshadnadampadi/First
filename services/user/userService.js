import User from "../../models/user/User.js";
import Address from "../../models/user/Address.js";
import Order from "../../models/order/order.js";
import Wallet from "../../models/user/Wallet.js";
import Settings from "../../models/admin/Settings.js";
import { generateReferralCode } from "./authServices.js";

/**
 * Fetch and construct home screen settings (e.g. hero videos)
 */
export const getHomeSettingsService = async () => {
    const videoSettings = await Settings.find({ key: { $regex: /^hero_video_/ } }).lean();
    return videoSettings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});
};

/**
 * Find user by email for authorization processes
 */
export const getUserByEmailService = async (email) => {
    return await User.findOne({ email: String(email || '').trim().toLowerCase() });
};

/**
 * Update password for forgot-password reset
 */
export const resetUserPasswordService = async (email, hashedPassword) => {
    const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
    if (!user) throw new Error("User not found");

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    return await user.save();
};

/**
 * Fetch full profile details including order stats and referral code initialization
 */
export const getUserProfileDetailService = async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    // Ensure user has a referral code (lazy sync if needed)
    let finalReferralCode = user.referralCode;
    if (!finalReferralCode) {
        const updatedUser = await User.findById(userId);
        if (updatedUser) {
            updatedUser.referralCode = await generateReferralCode();
            await updatedUser.save();
            finalReferralCode = updatedUser.referralCode;
        }
    }

    const [ordersCount, totalSpendResult] = await Promise.all([
        Order.countDocuments({ user: userId }),
        Order.aggregate([
            { $match: { user: userId, orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ])
    ]);

    const totalSpend = totalSpendResult.length > 0 ? totalSpendResult[0].total : 0;

    return {
        ...user,
        referralCode: finalReferralCode,
        totalOrders: ordersCount,
        totalSpend
    };
};

/**
 * Fetch full user account dashboard statistics
 */
export const getUserDashboardService = async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    const [ordersCount, totalSpendResult, recentOrders, wallet] = await Promise.all([
        Order.countDocuments({ user: userId }),
        Order.aggregate([
            { $match: { user: userId, orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        Order.find({ user: userId }).sort({ createdAt: -1 }).limit(3).lean(),
        Wallet.findOne({ user: userId }).lean()
    ]);

    const totalSpend = totalSpendResult.length > 0 ? totalSpendResult[0].total : 0;

    return {
        user: {
            ...user,
            totalOrders: ordersCount,
            totalSpend
        },
        recentOrders,
        wallet: wallet || { balance: 0, transactions: [] }
    };
};

/**
 * Fetch user details with populated address relationships
 */
export const getUserWithAddressesService = async (userId) => {
    return await User.findById(userId).populate('addresses').lean();
};

/**
 * Update user avatar or profile picture path
 */
export const updateUserProfileImageService = async (userId, imagePath) => {
    return await User.findByIdAndUpdate(userId, {
        profileImage: imagePath,
        avatar: imagePath
    }, { new: true });
};

/**
 * Clear user avatar image path
 */
export const removeUserProfileImageService = async (userId) => {
    return await User.findByIdAndUpdate(userId, {
        profileImage: "",
        avatar: ""
    }, { new: true });
};

/**
 * Update general profile fields for a user
 */
export const updateProfileDataService = async (userId, updateData) => {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
};
