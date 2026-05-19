import * as supportService from "../../services/user/supportService.js";

export const getSupportPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const tickets = await supportService.getUserTicketsService(userId);

        res.render("user/support", {
            title: "Customer Support",
            breadcrumbs: [
                { label: 'Home', url: '/' },
                { label: 'Support', url: '/support' }
            ],
            tickets
        });
    } catch (error) {
        console.error("Error loading support page:", error);
        res.status(500).render("errors/error", { message: "Failed to load support page" });
    }
};

export const createTicket = async (req, res) => {
    try {
        const userId = req.session.user;
        const { subject, category, priority, message, orderId } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ success: false, message: "Subject and Message are required." });
        }

        const newTicket = await supportService.createUserTicketService(userId, {
            subject,
            category,
            priority,
            message,
            orderId
        });

        res.status(200).json({ 
            success: true, 
            message: "Support ticket created successfully. Our team will get back to you shortly.",
            ticket: newTicket
        });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to submit support ticket." });
    }
};

export const getTicketDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const ticketId = req.params.id;

        const ticket = await supportService.getUserTicketDetailsService(ticketId, userId);

        if (!ticket) {
            return res.status(404).render("errors/error", { message: "Ticket not found" });
        }

        res.render("user/supportTicketDetails", {
            title: `Ticket ${ticket.ticketId}`,
            breadcrumbs: [
                { label: 'Home', url: '/' },
                { label: 'Support', url: '/support' },
                { label: ticket.ticketId, url: `/support/ticket/${ticket._id}` }
            ],
            ticket
        });
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        res.status(500).render("errors/error", { message: "Internal Server Error" });
    }
};

export const replyToTicket = async (req, res) => {
    try {
        const userId = req.session.user;
        const ticketId = req.params.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message cannot be empty." });
        }

        try {
            await supportService.replyToUserTicketService(ticketId, userId, message);
            res.status(200).json({ success: true, message: "Response sent." });
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    } catch (error) {
        console.error("Error replying to ticket:", error);
        res.status(500).json({ success: false, message: "Failed to send response." });
    }
};
