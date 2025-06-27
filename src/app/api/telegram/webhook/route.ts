import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, Context } from 'telegraf';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateAIResponse } from '@/services/aiService';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Add maxDuration for Vercel hobby plan
export const maxDuration = 10;

function sanitizeForTelegram(text: string): string {
  return text
    .replace(/(?<!\*)\*(?!\*)/g, '\\*')
    .replace(/(?<!_)_(?!_)/g, '\\_')
    .replace(/(?<!`)(?:`{1}|`{3})(?!`)/g, '\\`')
    .replace(/\[(?![^\]]*\])/g, '\\[')
    .replace(/(?<!\[)\]/g, '\\]')
    .substring(0, 4000);
}

// Async function to handle AI processing
async function processAIResponse(conversationId: string, messageText: string, formattedHistory: any[], ctx: any) {
  try {
    const aiResponse = await generateAIResponse(conversationId, messageText, formattedHistory);
    
    if (aiResponse.content) {
      const sanitizedContent = sanitizeForTelegram(aiResponse.content);
      
      // Send via Telegram API directly
      const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ctx.chat.id,
          text: sanitizedContent,
          parse_mode: 'Markdown'
        })
      });
      
      const result = await response.json();
      
      // Store the response in database
      if (result.ok) {
        const supabase = createServerSupabaseClient();
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'bot',
          content: aiResponse.content,
          telegram_message_id: result.result.message_id
        });
      }
    }
  } catch (error) {
    console.error('Error in async AI processing:', error);
    // Send error message
    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ctx.chat.id,
        text: 'Sorry, I encountered an error. Please try again or type "agent" to speak with a human.'
      })
    });
  }
}

// Initialize bot with basic commands
bot.start((ctx) => ctx.reply('Welcome to DoubtIt Support! 🤖\n\nHow can I help you today?'));
bot.help((ctx) => ctx.reply('You can ask me any question, and I\'ll do my best to help! If you need a human agent, just type "agent" or "help"'));

bot.command('agent', async (ctx) => {
  const supabase = createServerSupabaseClient();
  const chatId = String(ctx.chat?.id);
  
  await supabase
    .from('conversations')
    .update({ status: 'agent_mode' })
    .eq('telegram_chat_id', chatId)
    .in('status', ['ai_mode']);
    
  ctx.reply('🔄 Connecting you with a support agent...');
});

// Handle text messages
bot.on('text', async (ctx) => {
  const supabase = createServerSupabaseClient();
  
  const getUserName = (ctx: Context) => {
    if (ctx.chat?.type === 'private') {
      return ctx.chat.username || ctx.chat.first_name || 'Unknown User';
    } else {
      return ctx.from?.username || ctx.from?.first_name || 'Unknown User';
    }
  };

  const userName = getUserName(ctx);
  const chatId = String(ctx.chat?.id);
  const messageText = ctx.message.text;
  
  const requestingAgent = messageText.toLowerCase().includes('agent') || 
                          messageText.toLowerCase().includes('human') ||
                          messageText.toLowerCase() === 'help';
  
  // Get or create conversation (same as your existing code)
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .in('status', ['ai_mode', 'agent_mode'])
    .maybeSingle();
    
  let conversationId: string;
  let isAgentMode = false;
  
  if (existingConversation) {
    conversationId = existingConversation.id;
    isAgentMode = existingConversation.status === 'agent_mode';
  } else {
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        telegram_chat_id: chatId,
        user_name: userName,
        status: 'ai_mode'
      })
      .select()
      .single();
      
    if (error || !newConversation) {
      console.error('Error creating conversation:', error);
      await ctx.reply('Sorry, there was an error processing your message. Please try again later.');
      return;
    }
    
    conversationId = newConversation.id;
  }
  
  // Store user message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'user',
    content: messageText,
    telegram_message_id: ctx.message.message_id
  });
  
  if (isAgentMode) {
    await ctx.reply('👨‍💼 An agent is reviewing your message and will respond shortly...');
    return;
  }
  
  if (requestingAgent) {
    await supabase.from('conversations').update({ status: 'agent_mode' }).eq('id', conversationId);
    await ctx.reply('🔄 Connecting you with a support agent...');
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'bot',
      content: '--- User requested agent assistance ---'
    });
    return;
  }
  
  // Send immediate acknowledgment
  await ctx.reply('🤖 Thinking... I\'ll respond in a moment!');
  
  // Get conversation history
  const { data: messageHistory } = await supabase
    .from('messages')
    .select('sender_type, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10);
    
  const formattedHistory = messageHistory?.map(msg => ({
    role: msg.sender_type as 'user' | 'bot' | 'agent',
    content: msg.content
  })) || [];
  
  // Process AI response asynchronously (don't await)
  processAIResponse(conversationId, messageText, formattedHistory, ctx);
});

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const update = await req.json();
    await bot.handleUpdate(update);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}