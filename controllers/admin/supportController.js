import SupportTicket from "../../models/support/SupportTicket.js";
import User from "../../models/user/User.js";

export const getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const { status, category, priority, search } = req.query;
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

        res.render("admin/support/index", {
            title: "Support Tickets",
            tickets,
            currentPage: page,
            totalPages,
            filters: { status, category, priority, search },
            breadcrumbs: [
                { label: 'Support', url: '/admin/support' }
            ]
        });
    } catch (error) {
        console.error("Error fetching admin tickets:", error);
        res.status(500).render("errors/error", { message: "Internal Server Error" });
    }
};

export const getTicketDetails = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await SupportTicket.findById(ticketId)
            .populate('user', 'name email profileImage')
            .populate('responses.sender', 'name profileImage');

        if (!ticket) {
            return res.status(404).render("errors/error", { message: "Ticket not found" });
        }

        res.render("admin/support/details", {
            title: `Ticket Details - ${ticket.ticketId}`,
            ticket,
            breadcrumbs: [
                { label: 'Support', url: '/admin/support' },
                { label: `Ticket #${ticket.ticketId}`, url: `/admin/support/ticket/${ticket._id}` }
            ]
        });
    } catch (error) {
        console.error("Error fetching admin ticket details:", error);
        res.status(500).render("errors/error", { message: "Internal Server Error" });
    }
};

export const respondToTicket = async (req, res) => {
    try {
        const adminId = req.session.admin; // Assuming admin session stores admin ID
        const ticketId = req.params.id;
        const { message, status } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Response message is required." });
        }

        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found." });
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

        await ticket.save();

        res.status(200).json({ success: true, message: "Response recorded." });
    } catch (error) {
        console.error("Error responding to ticket:", error);
        res.status(500).json({ success: false, message: "Failed to record response." });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;

        const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true });

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found." });
        }

        res.status(200).json({ success: true, message: `Ticket status updated to ${status}.` });
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
};
