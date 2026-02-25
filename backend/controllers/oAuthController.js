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

export const githubAuth = (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=user:email`;
    res.redirect(url);
};

export const githubCallback = async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({ message: "Authorization code missing" });
    }

    try {
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: process.env.GITHUB_REDIRECT_URI,
            }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return res.status(400).json({ message: "Failed to obtain access token" });
        }

        const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = await userResponse.json();

        const emailsResponse = await fetch("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const emailsData = await emailsResponse.json();

        const primaryEmailObj = emailsData.find((email) => email.primary) || emailsData[0];
        const email = primaryEmailObj ? primaryEmailObj.email : null;

        if (!email) {
            return res.status(400).json({ message: "No email associated with Github account" });
        }

        const githubId = userData.id.toString();

        let user = await User.findOne({ email });

        if (user) {
            if (!user.githubId) {
                user.githubId = githubId;
                if (!user.authProvider || user.authProvider === 'local') {
                    user.authProvider = 'github';
                }
                await user.save();
            }
        } else {
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
                githubId: githubId,
                authProvider: 'github',
            });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
    } catch (error) {
        console.error("Github OAuth Error:", error);
        res.status(500).json({ message: "Internal Server Error during Github OAuth" });
    }
};
