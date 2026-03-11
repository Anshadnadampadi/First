import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// optional: verify connection configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Mailer verification failed:', error);
    } else {
        console.log('Mailer is ready to send messages');
    }
});