import { Router } from "express";
import { getConversations, getConversationDetail, getDashboardStats } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/conversations", authMiddleware, getConversations);
router.get("/conversations/:id", authMiddleware, getConversationDetail);
router.get("/stats", authMiddleware, getDashboardStats);

export default router;