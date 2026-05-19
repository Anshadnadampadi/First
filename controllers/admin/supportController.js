import * as supportService from "../../services/admin/supportService.js";

export const getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const { status, category, priority, search } = req.query;
        const { tickets, totalPages } = await supportService.getAdminTicketsService({
            status,
            category,
            priority,
            search,
            page,
            limit
        });

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
        const ticket = await supportService.getTicketDetailsService(ticketId);

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
        const adminId = req.session.admin._id || req.session.admin; // Assuming admin session stores admin ID or object
        const ticketId = req.params.id;
        const { message, status } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Response message is required." });
        }

        try {
            await supportService.respondToTicketService(ticketId, adminId, message, status);
            res.status(200).json({ success: true, message: "Response recorded." });
        } catch (err) {
            return res.status(404).json({ success: false, message: err.message });
        }
    } catch (error) {
        console.error("Error responding to ticket:", error);
        res.status(500).json({ success: false, message: "Failed to record response." });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;

        try {
            await supportService.updateTicketStatusService(ticketId, status);
            res.status(200).json({ success: true, message: `Ticket status updated to ${status}.` });
        } catch (err) {
            return res.status(404).json({ success: false, message: err.message });
        }
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
};
