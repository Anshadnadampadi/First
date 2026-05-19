import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/order/order.js";

const run = async () => {
    await connectDB();
    const order = await Order.findOne({ orderId: "ORD-F67F57AE" });
    console.log(JSON.stringify(order, null, 2));
    await mongoose.connection.close();
};

run().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
