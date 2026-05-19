import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Order from "../models/order/order.js";

const run = async () => {
    await connectDB();
    const orderId = "6a0bf4d3d86118a0a9c7b69b";
    const order = await Order.findById(orderId);
    
    console.log("Order Financials:");
    console.log(`Subtotal: ${order.subtotal}`);
    console.log(`Tax: ${order.tax}`);
    console.log(`Discount: ${order.discount}`);
    console.log(`ShippingFee: ${order.shippingFee}`);
    console.log(`TotalAmount: ${order.totalAmount}`);
    console.log(`PaymentStatus: ${order.paymentStatus}`);
    
    console.log("Items details:");
    order.items.forEach(item => {
        console.log(`- ItemID: ${item._id}`);
        console.log(`  ProductName: ${item.productName}`);
        console.log(`  Price: ${item.price}, Qty: ${item.qty}`);
        console.log(`  Status: ${item.status}`);
        console.log(`  CouponDiscount: ${item.couponDiscount}`);
        console.log(`  FinalPaidAmount: ${item.finalPaidAmount}`);
    });

    await mongoose.connection.close();
};

run().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
