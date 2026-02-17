import express from 'express';
import { registerUser, loginUser, logoutUser, updateUser, getMe } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.put('/:id', updateUser);
router.get('/me', getMe);

export default router;
