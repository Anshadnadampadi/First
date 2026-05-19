import Notification from '../../models/notification/Notification.js';
import SupportTicket from '../../models/support/SupportTicket.js';
import Order from '../../models/order/order.js';

/**
 * Fetch latest notifications and the unread count
 */
export const getAdminNotifications = async () => {
    const notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(10);
    
    const unreadCount = await Notification.countDocuments({ isRead: false });
    
    return { notifications, unreadCount };
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (id) => {
    return await Notification.findByIdAndUpdate(id, { isRead: true });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
    return await Notification.updateMany({ isRead: false }, { isRead: true });
};

/**
 * Clear all notifications
 */
export const clearAllNotificationsService = async () => {
    return await Notification.deleteMany({});
};

/**
 * Get count of orders, returns, and support tickets for sidebar
 */
export const getSidebarCountsData = async () => {
    const [orderCount, returnCount, supportCount] = await Promise.all([
        Order.countDocuments({ orderStatus: { $in: ['Pending', 'Confirmed'] } }),
        Order.countDocuments({ orderStatus: 'Return Requested' }),
        SupportTicket.countDocuments({ status: 'Open' })
    ]);

    return {
        orders: orderCount,
        returns: returnCount,
        support: supportCount
    };
};
