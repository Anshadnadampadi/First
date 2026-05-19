import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Wallet from "../models/user/Wallet.js";

const run = async () => {
    await connectDB();
    const userId = "6a06b3cbbc5daabc5a041e93";
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
        console.log("No wallet found for user.");
    } else {
        console.log("Wallet details:");
        console.log(`Balance: ${wallet.balance}`);
        console.log("Transactions:");
        wallet.transactions.forEach(t => {
            console.log(`- Amount: ${t.amount}, Type: ${t.type}, Description: ${t.description}, Date: ${t.createdAt}`);
        });
    }

    await mongoose.connection.close();
};

run().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
