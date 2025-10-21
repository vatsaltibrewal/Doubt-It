import { Router } from 'express';
import { login, token, logout, verifyLogin, me, realtimeToken } from '../controllers/auth.controller.js';

const router = Router();

router.get('/login', login);
router.get('/token', token);
router.get('/verify', verifyLogin);
router.get('/me', me);
router.get('/logout', logout);
router.get('/realtimetoken', realtimeToken);

export default router;