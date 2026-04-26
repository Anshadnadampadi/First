import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const supportTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Order Issue', 'Payment Problem', 'Account Access', 'Product Inquiry', 'Feedback', 'Other'],
        default: 'Other'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Open', 'In-Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    orderId: {
        type: String // Optional reference to an order ID
    },
    responses: [responseSchema]
}, { timestamps: true });

// Generate a readable ticket ID before saving
supportTicketSchema.pre('validate', async function(next) {
    if (this.isNew && !this.ticketId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('SupportTicket').countDocuments() + 1;
        this.ticketId = `TIC-${year}${month}-${count.toString().padStart(4, '0')}`;
    }
    next();
});

export default mongoose.model("SupportTicket", supportTicketSchema);
