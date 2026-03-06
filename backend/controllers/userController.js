import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from 'crypto';
export const register = async (req, res) => {
    try {
        console.log(req.body);
        const { username, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        // Generate token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist." });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Here is your OTP for resetting the password: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset OTP",
                html: message,
            });
            res.status(200).json({ success: true, message: "OTP sent to email" });
        } catch (error) {
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpiry = undefined;
            await user.save();
            console.error("Email error:", error);
            res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear OTP fields
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpiry = undefined;

        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
}
