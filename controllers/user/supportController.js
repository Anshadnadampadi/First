import SupportTicket from "../../models/support/SupportTicket.js";
import User from "../../models/user/User.js";

export const getSupportPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const tickets = await SupportTicket.find({ user: userId }).sort({ updatedAt: -1 });

        res.render("user/support", {
            title: "Customer Support",
            tickets,
            breadcrumbs: [
                { label: 'Home', url: '/' },
                { label: 'Support', url: '/support' }
            ]
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

        const newTicket = new SupportTicket({
            user: userId,
            subject,
            category,
            priority,
            message,
            orderId
        });

        await newTicket.save();

        res.status(200).json({ 
            success: true, 
            message: "Support ticket created successfully. Our team will get back to you shortly.",
            ticket: newTicket
        });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ success: false, message: "Failed to submit support ticket." });
    }
};

export const getTicketDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const ticketId = req.params.id;

        const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId }).populate('responses.sender', 'name profileImage');

        if (!ticket) {
            return res.status(404).render("errors/error", { message: "Ticket not found" });
        }

        res.render("user/supportTicketDetails", {
            title: `Ticket ${ticket.ticketId}`,
            ticket,
            breadcrumbs: [
                { label: 'Home', url: '/' },
                { label: 'Support', url: '/support' },
                { label: ticket.ticketId, url: `/support/ticket/${ticket._id}` }
            ]
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

        const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId });

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found." });
        }

        if (ticket.status === 'Closed') {
            return res.status(400).json({ success: false, message: "Cannot reply to a closed ticket." });
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

        await ticket.save();

        res.status(200).json({ success: true, message: "Response sent." });
    } catch (error) {
        console.error("Error replying to ticket:", error);
        res.status(500).json({ success: false, message: "Failed to send response." });
    }
};
