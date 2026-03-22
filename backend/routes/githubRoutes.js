import express from 'express';
import { importGithubRepo } from '../controllers/githubController.js';

const router = express.Router();

router.post('/import', importGithubRepo);

export default router;
