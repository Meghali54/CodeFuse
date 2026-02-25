import express from "express";
import { googleAuth, googleCallback, githubAuth, githubCallback } from "../controllers/oAuthController.js";

const router = express.Router();

router.get("/google", googleAuth);
router.get("/callback/google", googleCallback);

router.get("/github", githubAuth);
router.get("/callback/github", githubCallback);

export default router;