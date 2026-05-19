import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/order/order.js";
import Wallet from "../models/user/Wallet.js";

const run = async () => {
    await connectDB();
    console.log("Database connected successfully.");

    // Find all orders where paymentStatus is Paid or Refunded and containing at least one item with status 'Returned'
    const orders = await Order.find({
        paymentStatus: { $in: ["Paid", "Refunded"] },
        "items.status": "Returned"
    });

    console.log(`Found ${orders.length} orders with returned items.`);

    let creditCount = 0;

    for (const order of orders) {
        console.log(`Processing Order #${order.orderId} (User: ${order.user})`);

        // Get user's wallet
        let wallet = await Wallet.findOne({ user: order.user });
        if (!wallet) {
            wallet = new Wallet({ user: order.user, balance: 0, transactions: [] });
        }

        // Calculate order items total at purchase for proportional discount
        const orderSubtotalAtPurchase = order.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const totalDiscountAtPurchase = order.discount || 0;

        // Check each returned item
        for (const item of order.items) {
            if (item.status !== "Returned") continue;

            // Check if there is an existing transaction matching this refund
            const refundDescPattern = new RegExp(`Refund for (Returned Item|.*item.*) in Order #${order.orderId}`, "i");
            const hasRefundTransaction = wallet.transactions.some(tx => refundDescPattern.test(tx.description));

            if (hasRefundTransaction) {
                console.log(`- Item ${item._id} already refunded in transaction log.`);
                continue;
            }

            // Missing refund! Compute correct refund amount
            const itemSubtotal = item.price * item.qty;
            const itemTax = Math.floor(itemSubtotal * 0.18);
            const itemDiscount = Math.floor((itemSubtotal / orderSubtotalAtPurchase) * totalDiscountAtPurchase);
            const itemRefund = (itemSubtotal + itemTax) - itemDiscount;

            console.log(`  -> MISSING REFUND DETECTED for item ${item._id}!`);
            console.log(`     Subtotal: ₹${itemSubtotal}, Tax (18%): ₹${itemTax}, Proportional Discount: -₹${itemDiscount}`);
            console.log(`     Net Refund Amount: ₹${itemRefund}`);

            // Credit the wallet
            wallet.balance += itemRefund;
            wallet.transactions.push({
                amount: itemRefund,
                type: "credit",
                description: `Refund for Returned Item in Order #${order.orderId}`
            });

            creditCount++;
        }

        if (wallet.isModified()) {
            await wallet.save();
            console.log(`  -> Wallet saved successfully. New Balance: ₹${wallet.balance}`);
        }
    }

    console.log(`\nScan complete! Retroactively credited ${creditCount} missing refunds to user wallets.`);
    await mongoose.connection.close();
    console.log("Database connection closed.");
};

run().catch(err => {
    console.error("Execution failed:", err);
    mongoose.connection.close();
});
