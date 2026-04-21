import Notification from '../models/notification/Notification.js';
import { getIO } from '../config/socket.js';

/**
 * Send notification to Admin and save to DB
 * @param {Object} data - Notification data { type, title, message, orderId }
 */
export const createAdminNotification = async (data) => {
    try {
        const notification = new Notification({
            type: data.type,
            title: data.title,
            message: data.message,
            orderId: data.orderId,
            isRead: false
        });

        await notification.save();

        const io = getIO();
        if (io) {
            io.to('admin_room').emit('notification', notification);
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating admin notification:', error);
    }
};

/**
 * Backward compatibility alias
 */
export const sendAdminNotification = (app, data) => createAdminNotification(data);

/**
 * Send notification to a specific User
 * @param {String} userId - User ID to notify
 * @param {Object} data - Notification data
 */
export const sendUserNotification = async (userId, data) => {
    try {
        const io = getIO();
        if (io) {
            io.to(userId.toString()).emit('notification', data);
            
            if (data.type === 'order_status') {
                io.to(userId.toString()).emit('order_status_update', data);
            }
        }
    } catch (error) {
        console.error('Error sending user notification:', error);
    }
};
