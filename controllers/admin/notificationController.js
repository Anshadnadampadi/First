import * as notificationService from '../../services/admin/notificationService.js';

export const getNotifications = async (req, res) => {
    try {
        const { notifications, unreadCount } = await notificationService.getAdminNotifications();
        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.markNotificationAsRead(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await notificationService.markAllNotificationsAsRead();
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const clearAllNotifications = async (req, res) => {
    try {
        await notificationService.clearAllNotificationsService();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getSidebarCounts = async (req, res) => {
    try {
        const counts = await notificationService.getSidebarCountsData();
        res.json({ 
            success: true, 
            counts
        });
    } catch (error) {
        console.error('Error fetching sidebar counts:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
