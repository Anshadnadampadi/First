import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/order/order.js";
import { cancelOrderItemService } from "../services/user/orderService.js";

const run = async () => {
    await connectDB();
    console.log("Database connected.");

    const orderId = "6a0bf4d3d86118a0a9c7b69b";
    const order = await Order.findById(orderId);
    
    if (!order) {
        console.error(`Order ${orderId} not found in database!`);
        await mongoose.connection.close();
        return;
    }

    console.log("Order found:");
    console.log(`OrderId: ${order.orderId}`);
    console.log(`UserId: ${order.user}`);
    console.log(`OrderStatus: ${order.orderStatus}`);
    console.log(`PaymentStatus: ${order.paymentStatus}`);
    console.log(`PaymentMethod: ${order.paymentMethod}`);
    console.log(`TotalAmount: ${order.totalAmount}`);
    console.log("Items:");
    order.items.forEach(item => {
        console.log(`- ItemID: ${item._id}`);
        console.log(`  ProductName: ${item.productName}`);
        console.log(`  Price: ${item.price}, Qty: ${item.qty}`);
        console.log(`  Status: ${item.status}`);
        console.log(`  Variant:`, JSON.stringify(item.variant));
    });

    console.log("\nAttempting to call cancelOrderItemService for the first item...");
    try {
        const firstItem = order.items[0];
        const result = await cancelOrderItemService(order.user, orderId, firstItem._id.toString());
        console.log("Result of cancelOrderItemService:", result);
    } catch (err) {
        console.error("Error thrown by cancelOrderItemService:", err);
    }

    await mongoose.connection.close();
};

run().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
