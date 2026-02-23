import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

let client;
const getClient = () => {
    if (!client) {
        client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }
    return client;
};

export const googleAuth = (req, res) => {
    const url = getClient().generateAuthUrl({
        access_type: "offline",
        scope: ["profile", "email"],
    });
    res.redirect(url);
};

export const googleCallback = async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({ message: "Authorization code missing" });
    }

    try {
        const client = getClient();
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                await user.save();
            }
        } else {
            // Create user
            const baseUsername = email.split('@')[0];
            let uniqueUsername = baseUsername;
            let counter = 1;

            while (await User.findOne({ username: uniqueUsername })) {
                uniqueUsername = `${baseUsername}${counter}`;
                counter++;
            }

            user = new User({
                username: uniqueUsername,
                email: email,
                googleId: googleId,
                authProvider: 'google',
            });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
    } catch (error) {
        console.error("Google OAuth Error:", error);
        res.status(500).json({ message: "Internal Server Error during Google OAuth" });
    }
};
