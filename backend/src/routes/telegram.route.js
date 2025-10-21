import { Router } from 'express';
import { 
    setupTelegramWebhook, 
    telegramWebhook, 
    claimConversation,
    sendAgentMessage,
    closeConversation 
} from '../controllers/telegram.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Used for setting up the webhook
router.post('/setup', setupTelegramWebhook);

// Public webhook endpoint for Telegram
router.post('/webhook', telegramWebhook);

// Endpoints for Human agents to manage conversations
router.post("/conversations/:id/claim", authMiddleware, claimConversation);
router.post("/conversations/:id/send", authMiddleware, sendAgentMessage);
router.post("/conversations/:id/close", authMiddleware, closeConversation);

export default router;