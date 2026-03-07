import express from 'express';
import { askAi } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai
// Expects body: { prompt: String, code: String (optional) }
router.post('/', askAi);

export default router;
