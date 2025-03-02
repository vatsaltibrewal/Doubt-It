import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, Context } from 'telegraf';
//import { Message } from 'telegraf/typings/core/types/typegram';
import { createServerSupabaseClient } from '@/lib/supabase';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Initialize bot with basic commands
bot.start((ctx) => ctx.reply('Welcome to DoubtIt Support! How can I help you today?'));
bot.help((ctx) => ctx.reply('You can ask me any question, and I\'ll do my best to help!'));

// Handle text messages
bot.on('text', async (ctx) => {
  const supabase = createServerSupabaseClient();
  
  // Get user name safely with type checking
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
  
  // Check if conversation exists or create new one
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .in('status', ['ai_mode', 'agent_mode'])
    .maybeSingle();
    
  let conversationId: string;
  
  if (existingConversation) {
    conversationId = existingConversation.id;
  } else {
    // Create new conversation
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
  
  // In Phase 1, just echo the message
  // Will integrate with AI in Phase 2
  const reply = await ctx.reply(`You said: ${messageText}\n\nI'm still learning how to respond effectively.`);
  
  // Store bot response
  if (reply) {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'bot',
      content: reply.text,
      telegram_message_id: reply.message_id
    });
  }
});

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret to ensure it's a valid Telegram request
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const update = await req.json();
    
    // Process the update with Telegraf
    await bot.handleUpdate(update);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}