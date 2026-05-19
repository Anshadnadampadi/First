import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/order/order.js";

const run = async () => {
    await connectDB();
    const orderId = "6a0bf4d3d86118a0a9c7b69b";
    const order = await Order.findById(orderId);
    
    console.log("Order details:");
    console.log(`OrderId: ${order.orderId}`);
    console.log(`OrderStatus: ${order.orderStatus}`);
    order.items.forEach(item => {
        console.log(`- ItemID: ${item._id}`);
        console.log(`  ProductName: ${item.productName}`);
        console.log(`  Status: ${item.status}`);
    });

    await mongoose.connection.close();
};

run().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
