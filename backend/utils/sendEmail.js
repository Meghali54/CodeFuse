import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

export const sendEmail = async (options) => {
    const mailOptions = {
        from: `CodeFuse <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};
