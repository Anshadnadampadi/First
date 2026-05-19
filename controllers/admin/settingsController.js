import { getAdminProfile, updateAdminProfile, changeAdminPassword } from '../../services/admin/settingsService.js';

export const getSettings = async (req, res) => {
    try {
        const adminId = req.session.admin._id;
        const admin = await getAdminProfile(adminId);

        if (!admin) {
            return res.redirect('/admin/login');
        }

        res.render('admin/settings/general', {
            title: 'Settings',
            admin,
            breadcrumbs: [
                { label: 'Settings', url: '/admin/settings/general' }
            ]
        });
    } catch (error) {
        console.error('Error loading settings:', error);
        res.redirect('/admin/dashboard?msg=Failed to load settings&icon=error');
    }
};

export const updateProfile = async (req, res) => {
    try {
        const adminId = req.session.admin._id;
        const { firstName, lastName, email, phone } = req.body;

        if (!firstName || !email) {
            return res.status(400).json({ success: false, message: 'First name and email are required.' });
        }

        try {
            await updateAdminProfile(adminId, { firstName, lastName, email, phone });
            // Update session email
            req.session.admin.email = email.trim().toLowerCase();
            res.json({ success: true, message: 'Profile updated successfully.' });
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const adminId = req.session.admin._id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All password fields are required.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New passwords do not match.' });
        }

        try {
            await changeAdminPassword(adminId, currentPassword, newPassword);
            res.json({ success: true, message: 'Password changed successfully.' });
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    } catch (error) {
        console.error('Error changing admin password:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};
