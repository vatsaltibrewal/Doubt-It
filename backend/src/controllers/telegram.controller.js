import { Telegraf } from 'telegraf';
import { generateAIResponse } from '../lib/gemini.js';
import { 
  upsertConversationForTelegram,
  appendMessage,
  setStatus,
  getConversationById,
} from '../lib/dbHelper.js';

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_PATH = '/telegram/webhook';
const PUBLIC_DOMAIN = process.env.PUBLIC_DOMAIN;

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome to Doubt-It! How can I assist you today?'));
bot.help((ctx) => ctx.reply('You can ask me any question, and I\'ll do my best to help! If you need a human agent, just type "agent" or "help"'));

/**
 * POST /telegram/setup  (admin-only)
 * Sets the Telegram webhook with a secret token.
*/
export async function setupTelegramWebhook(req, res) {
    try{
        await bot.telegram.setWebhook(PUBLIC_DOMAIN + WEBHOOK_PATH, {
          secret_token: process.env.TG_SECRET_TOKEN
        });

        const webhookInfo = await bot.telegram.getWebhookInfo();

        res.status(200).send({ success: true, webhook: webhookInfo });
    } catch (error) {
        console.error('Error setting up webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * POST /telegram/webhook
 * Public endpoint called by Telegram. Verifies secret header, persists message,
 * AI replies unless the user requested a human.
*/
export async function telegramWebhook(req, res) {
    try {
        const secret = req.headers["x-telegram-bot-api-secret-token"];
        if (!secret || secret !== process.env.TG_SECRET_TOKEN) return res.status(403).end();

        const update = req.body;
        if (!update?.message) return res.status(200).end();

        const msg = update.message;
        const chatId = String(msg.chat.id);
        const text = (msg.text ?? "").trim();
        const userName = msg.from?.username || [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ");

        // Ensure conversation
        const conv = await upsertConversationForTelegram(chatId, userName);
        const convId = conv.pk.split("#")[1];

        // Persist USER message
        await appendMessage(convId, {
            sender_type: "USER",
            content: text,
            telegram_message_id: msg.message_id,
        });

        // Human request?
        if (/^\/?agent\b/i.test(text) || /^\/?help\b/i.test(text)) {
            await setStatus(convId, "WAITING", null);
            await bot.telegram.sendMessage(chatId, "Got it. Connecting you to a human agent…");
            return res.status(200).end();
        }

        // If currently assigned to HUMAN, do not auto-answer
        if (conv.status === "HUMAN" && conv.current_agent_id || conv.status === "WAITING") {
        // Optionally acknowledge
            return res.status(200).end();
        }

        // Otherwise AI answer
        const aiText = await generateAIResponse(text);
        await bot.telegram.sendMessage(chatId, aiText);
        await appendMessage(convId, { sender_type: "AI", content: aiText });

        res.status(200).end();
    } catch (e) {
        console.error("telegramWebhook error:", e);
        // Always 200 to avoid webhook retry storms
        res.status(200).end();
    }
}

/**
 * POST /telegram/conversations/:id/claim  (agent/admin)
 * Claim a conversation for human support (status -> HUMAN).
 * Body: optional { note?: string }
*/
export async function claimConversation(req, res) {
  try {
    const agentId = req.user?.sub; // from Cognito middleware
    const conversationId = req.params.id;

    const conv = await getConversationById(conversationId);
    if (!conv) return res.status(404).send({ message: "Conversation not found" });

    // Allow claim from AI or WAITING states
    if (!["AI", "WAITING"].includes(conv.status)) {
      return res.status(409).send({ message: `Cannot claim from status ${conv.status}` });
    }

    await setStatus(conversationId, "HUMAN", agentId);

    // System message
    await appendMessage(conversationId, {
      sender_type: "SYSTEM",
      content: `Agent ${agentId} took over the chat.`,
    });

    try {
      if (conv.telegram_chat_id) {
        await bot.telegram.sendMessage(
          conv.telegram_chat_id,
          "A human agent has joined. You’re now chatting with a human."
        );
      }
    } catch (err) {
      console.warn("Telegram notify (claim) failed:", err?.message);
    }

    res.status(200).send({ ok: true });
  } catch (e) {
    console.error("claimConversation error:", e);
    res.status(500).send({ ok: false, error: "Failed to claim conversation" });
  }
}

/**
 * POST /telegram/conversations/:id/send  (agent/admin)
 * Send a message as the human agent to the Telegram user.
 * Body: { text: string }
*/
export async function sendAgentMessage(req, res) {
  try {
    const agentId = req.user?.sub;
    const conversationId = req.params.id;
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).send({ message: "text is required" });
    }

    const conv = await getConversationById(conversationId);
    if (!conv) return res.status(404).send({ message: "Conversation not found" });
    if (conv.status !== "HUMAN" || conv.current_agent_id !== agentId) {
      return res.status(403).send({ message: "You don't own this conversation" });
    }

    const chatId = conv.telegram_chat_id;
    // Send message via bot
    await bot.telegram.sendMessage(chatId, text);
    await appendMessage(conversationId, { sender_type: "AGENT", content: text });

    res.status(200).send({ ok: true });
  } catch (e) {
    console.error("sendAgentMessage error:", e);
    res.status(500).send({ ok: false, error: "Failed to send message" });
  }
}

/**
 * POST /telegram/conversations/:id/close  (agent/admin)
 * Close the conversation (status -> CLOSED) and record in DB.
*/
export async function closeConversation(req, res) {
  try {
    const agentId = req.user?.sub;
    const conversationId = req.params.id;

    const conv = await getConversationById(conversationId);
    if (!conv) return res.status(404).send({ message: "Conversation not found" });

    // Allow close by the owner (if HUMAN) or any admin as per your policy.
    if (conv.status === "HUMAN" && conv.current_agent_id && conv.current_agent_id !== agentId) {
      return res.status(403).send({ message: "Only the assigned agent can close this chat" });
    }

    await setStatus(conversationId, "CLOSED", null);
    await appendMessage(conversationId, {
      sender_type: "SYSTEM",
      content: `Conversation closed by ${agentId || "system"}.`,
    });

    try {
      if (conv.telegram_chat_id) {
        await bot.telegram.sendMessage(
          conv.telegram_chat_id,
          "This conversation is now closed. If you need anything else, just message again!"
        );
      }
    } catch (err) {
      console.warn("Telegram notify (close) failed:", err?.message);
    }

    res.status(200).send({ ok: true });
  } catch (e) {
    console.error("closeConversation error:", e);
    res.status(500).send({ ok: false, error: "Failed to close conversation" });
  }
}