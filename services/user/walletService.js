import Wallet from "../../models/user/Wallet.js";
import User from "../../models/user/User.js";
import crypto from "crypto";

/**
 * Get user wallet with paginated transactions
 */
export const getWalletService = async (userId, page = 1, limit = 5) => {
    const skip = (page - 1) * limit;
    const user = await User.findById(userId).lean();

    let wallet = await Wallet.findOne({ user: userId }).lean();
    let totalTransactions = 0;
    let totalPages = 0;

    if (!wallet) {
        wallet = { balance: 0, transactions: [] };
    } else {
        // Sort transactions by date descending
        wallet.transactions.sort((a, b) => b.timestamp - a.timestamp);
        
        totalTransactions = wallet.transactions.length;
        totalPages = Math.ceil(totalTransactions / limit);
        
        // Slice for pagination
        wallet.transactions = wallet.transactions.slice(skip, skip + limit);
    }

    return { user, wallet, totalTransactions, totalPages };
};

/**
 * Verify and ingest Razorpay top-up transaction
 */
export const verifyTopupPaymentService = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }) => {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature !== expectedSign) {
        return { success: false, message: "Payment verification failed" };
    }

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
    }

    // Check if this payment has already been processed (idempotency)
    const alreadyProcessed = wallet.transactions.some(tx => tx.txnId === razorpay_payment_id);
    if (alreadyProcessed) {
        return { success: true, message: "Payment already processed" };
    }

    const topupAmount = parseFloat(amount);
    wallet.balance += topupAmount;
    wallet.transactions.push({
        amount: topupAmount,
        type: 'credit',
        description: "Wallet Top-up via Razorpay",
        txnId: razorpay_payment_id,
        status: 'Success',
        timestamp: new Date()
    });

    await wallet.save();
    return { success: true, message: "Wallet topped up successfully" };
};
