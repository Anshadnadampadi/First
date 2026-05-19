import SupportTicket from "../../models/support/SupportTicket.js";

/**
 * Fetch all tickets created by a specific user
 */
export const getUserTicketsService = async (userId) => {
    return await SupportTicket.find({ user: userId }).sort({ updatedAt: -1 });
};

/**
 * Create a new support ticket
 */
export const createUserTicketService = async (userId, { subject, category, priority, message, orderId }) => {
    if (!subject || !message) {
        throw new Error("Subject and Message are required.");
    }

    const newTicket = new SupportTicket({
        user: userId,
        subject,
        category,
        priority,
        message,
        orderId
    });

    return await newTicket.save();
};

/**
 * Get ticket details for a specific user
 */
export const getUserTicketDetailsService = async (ticketId, userId) => {
    return await SupportTicket.findOne({ _id: ticketId, user: userId })
        .populate('responses.sender', 'name profileImage');
};

/**
 * Send a user reply to a support ticket
 */
export const replyToUserTicketService = async (ticketId, userId, message) => {
    if (!message) {
        throw new Error("Message cannot be empty.");
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {
        throw new Error("Ticket not found.");
    }

    if (ticket.status === 'Closed') {
        throw new Error("Cannot reply to a closed ticket.");
    }

    ticket.responses.push({
        sender: userId,
        message,
        isAdmin: false
    });

    // Re-open if it was resolved
    if (ticket.status === 'Resolved') {
        ticket.status = 'In-Progress';
    }

    return await ticket.save();
};
