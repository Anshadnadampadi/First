import SupportTicket from "../../models/support/SupportTicket.js";

/**
 * Fetch and filter support tickets for the admin portal
 */
export const getAdminTicketsService = async ({ status, category, priority, search, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
        query.$or = [
            { ticketId: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } }
        ];
    }

    const tickets = await SupportTicket.find(query)
        .populate('user', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalTickets = await SupportTicket.countDocuments(query);
    const totalPages = Math.ceil(totalTickets / limit);

    return { tickets, totalTickets, totalPages };
};

/**
 * Get ticket by ID with full populate detail
 */
export const getTicketDetailsService = async (ticketId) => {
    return await SupportTicket.findById(ticketId)
        .populate('user', 'name email profileImage')
        .populate('responses.sender', 'name profileImage');
};

/**
 * Add an admin response to a ticket
 */
export const respondToTicketService = async (ticketId, adminId, message, status) => {
    if (!message) {
        throw new Error("Response message is required.");
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
        throw new Error("Ticket not found.");
    }

    ticket.responses.push({
        sender: adminId,
        message,
        isAdmin: true
    });

    if (status) {
        ticket.status = status;
    } else if (ticket.status === 'Open') {
        ticket.status = 'In-Progress';
    }

    return await ticket.save();
};

/**
 * Update the global ticket status
 */
export const updateTicketStatusService = async (ticketId, status) => {
    const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true });
    if (!ticket) {
        throw new Error("Ticket not found.");
    }
    return ticket;
};
