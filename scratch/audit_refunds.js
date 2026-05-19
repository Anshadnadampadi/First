import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/order/order.js";
import Wallet from "../models/user/Wallet.js";

const audit = async () => {
    await connectDB();
    console.log("Database connected successfully.");

    // Retrieve all orders
    const orders = await Order.find({
        paymentStatus: { $in: ["Paid", "Refunded"] }
    });

    console.log(`Found ${orders.length} paid/refunded orders. Scanning for items...`);

    let totalMismatches = 0;
    let totalMissing = 0;

    for (const order of orders) {
        let wallet = await Wallet.findOne({ user: order.user });
        if (!wallet) {
            wallet = { balance: 0, transactions: [] };
        }

        // Calculate original total items sum for proportional math if needed
        const orderSubtotalAtPurchase = order.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const totalDiscountAtPurchase = order.discount || 0;

        for (const item of order.items) {
            if (!["Cancelled", "Returned"].includes(item.status)) continue;

            // Search for a matching refund transaction
            const regex = new RegExp(`Refund for (Cancelled|Returned|.*) Item.*in Order #${order.orderId}`, "i");
            const globalRegex = new RegExp(`Refund for .* item\\(s\\) in Order #${order.orderId}`, "i");
            const matchingTx = wallet.transactions.find(tx => regex.test(tx.description) || globalRegex.test(tx.description));

            // Math 1: Expected refund based on item.finalPaidAmount + 18% tax
            const expectedRefundFromItemPaid = Math.floor(item.finalPaidAmount * 1.18);

            // Math 2: Expected refund based on proportional discount from purchase
            const itemSubtotal = item.price * item.qty;
            const itemTax = Math.floor(itemSubtotal * 0.18);
            const itemDiscount = Math.floor((itemSubtotal / orderSubtotalAtPurchase) * totalDiscountAtPurchase);
            const expectedRefundProportional = (itemSubtotal + itemTax) - itemDiscount;

            if (!matchingTx) {
                console.log(`\n[MISSING REFUND] Order #${order.orderId}, Item: ${item.productName} (${item.status})`);
                console.log(`  - Expected (Item Paid + Tax): ₹${expectedRefundFromItemPaid}`);
                console.log(`  - Expected (Proportional Math): ₹${expectedRefundProportional}`);
                totalMissing++;
            } else {
                const actualRefund = matchingTx.amount;
                if (actualRefund !== expectedRefundFromItemPaid && actualRefund !== expectedRefundProportional) {
                    console.log(`\n[MISMATCH] Order #${order.orderId}, Item: ${item.productName} (${item.status})`);
                    console.log(`  - Actual Wallet Credit: ₹${actualRefund}`);
                    console.log(`  - Expected (Item Paid + Tax): ₹${expectedRefundFromItemPaid}`);
                    console.log(`  - Expected (Proportional Math): ₹${expectedRefundProportional}`);
                    totalMismatches++;
                }
            }
        }
    }

    console.log(`\nAudit complete!`);
    console.log(`Missing Refunds: ${totalMissing}`);
    console.log(`Mismatched Refunds: ${totalMismatches}`);

    await mongoose.connection.close();
    console.log("Database connection closed.");
};

audit().catch(err => {
    console.error("Audit failed:", err);
    mongoose.connection.close();
});
