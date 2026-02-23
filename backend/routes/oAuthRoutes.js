import express from "express";
import { googleAuth, googleCallback } from "../controllers/oAuthController.js";

const router = express.Router();

router.get("/google", googleAuth);
router.get("/callback/google", googleCallback);

export default router;