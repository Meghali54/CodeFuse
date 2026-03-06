import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        minlength: 6,
    },
    authProvider: {
        type: String,
        default: 'local'
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    githubId: {
        type: String,
        sparse: true,
        unique: true
    },
    resetPasswordOTP: {
        type: String,
    },
    resetPasswordOTPExpiry: {
        type: Date,
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
