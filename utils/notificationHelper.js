import Notification from '../models/notification/Notification.js';

export const createAdminNotification = async ({ type, title, message, orderId }) => {
    try {
        await Notification.create({
            type,
            title,
            message,
            orderId
        });
    } catch (error) {
        console.error('Error creating admin notification:', error);
    }
};
