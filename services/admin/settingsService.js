import User from '../../models/user/User.js';
import Settings from '../../models/admin/Settings.js';
import bcrypt from 'bcryptjs';

/**
 * Get Admin Profile details
 */
export const getAdminProfile = async (adminId) => {
    return await User.findById(adminId).select('-password').lean();
};

/**
 * Update Admin Profile details
 */
export const updateAdminProfile = async (adminId, { firstName, lastName, email, phone }) => {
    if (!firstName || !email) {
        throw new Error('First name and email are required.');
    }

    const emailExists = await User.findOne({ email, _id: { $ne: adminId } });
    if (emailExists) {
        throw new Error('Email is already in use by another account.');
    }

    return await User.findByIdAndUpdate(
        adminId, 
        {
            firstName: firstName.trim(),
            lastName: (lastName || '').trim(),
            email: email.trim().toLowerCase(),
            phone: (phone || '').trim()
        },
        { new: true }
    );
};

/**
 * Change Admin Password
 */
export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
        throw new Error('All password fields are required.');
    }

    if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters.');
    }

    const admin = await User.findById(adminId);
    if (!admin) {
        throw new Error('Admin account not found.');
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
        throw new Error('Current password is incorrect.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    return await admin.save();
};

/**
 * Fetch all hero video configurations
 */
export const getHeroVideos = async () => {
    const settings = await Settings.find({ key: { $regex: /^hero_video_/ } });
    return settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});
};

/**
 * Upload/save/update a hero video slot configuration
 */
export const saveHeroVideo = async (slot, videoUrl) => {
    const key = `hero_video_${slot}`;
    return await Settings.findOneAndUpdate(
        { key },
        { value: videoUrl, description: `Hero video for ${slot} slot` },
        { upsert: true, new: true }
    );
};

/**
 * Delete a hero video mapping configuration
 */
export const deleteHeroVideo = async (slot) => {
    const key = `hero_video_${slot}`;
    return await Settings.deleteOne({ key });
};
