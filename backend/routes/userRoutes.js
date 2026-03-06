import express from "express";
import { register, login, getUser, forgotPassword, resetPassword } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/register").post(register);
router.post("/login", login);
router.get("/me", authMiddleware, getUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
