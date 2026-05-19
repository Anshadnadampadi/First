import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/order/order.js";

const run = async () => {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
    
    console.log("Recent Orders:");
    orders.forEach(o => {
        console.log(`- OrderId: ${o.orderId}`);
        console.log(`  User: ${o.user}`);
        console.log(`  Status: ${o.orderStatus}`);
        console.log(`  PaymentStatus: ${o.paymentStatus}`);
        console.log(`  PaymentMethod: ${o.paymentMethod}`);
        console.log(`  TotalAmount: ${o.totalAmount}`);
        console.log(`  Date: ${o.createdAt}`);
        console.log("  Items:");
        o.items.forEach(i => {
            console.log(`    * ${i.productName || 'No Name'} (${i.status}), Price: ${i.price}, Paid: ${i.finalPaidAmount}`);
        });
    });

    await mongoose.connection.close();
};

run().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
