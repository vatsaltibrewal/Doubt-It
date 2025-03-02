import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, Context } from 'telegraf';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateAIResponse } from '@/services/aiService';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Initialize bot with basic commands
bot.start((ctx) => ctx.reply('Welcome to DoubtIt Support! How can I help you today?'));
bot.help((ctx) => ctx.reply('You can ask me any question, and I\'ll do my best to help! If you need a human agent, just type "agent" or "help"'));

bot.command('agent', async (ctx) => {
  ctx.reply('We\'re connecting you with a support agent. Please wait a moment...');
  // Logic to flag this conversation for agent attention
});

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
  
  // Check if user wants to speak with agent
  const requestingAgent = messageText.toLowerCase().includes('agent') || 
                          messageText.toLowerCase().includes('human') ||
                          messageText.toLowerCase() === 'help';
  
  // Check if conversation exists or create new one
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
  const { data: userMessage } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'user',
    content: messageText,
    telegram_message_id: ctx.message.message_id
  }).select().single();
  
  // If already in agent mode or user requested an agent, notify admins
  if (isAgentMode) {
    // Let the human agent handle it
    await ctx.reply('An agent is reviewing your message and will respond shortly.');
    return;
  }
  
  if (requestingAgent) {
    await supabase
      .from('conversations')
      .update({
        status: 'agent_mode'
      })
      .eq('id', conversationId);
      
    await ctx.reply('We\'re connecting you with a support agent. Please wait a moment while an agent reviews your conversation.');
    
    // Add a system message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'bot',
      content: '--- User requested agent assistance ---'
    });
    
    return;
  }
  
  try {
    // Get conversation history
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('sender_type, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10); // Last 10 messages
    
    const formattedHistory = messageHistory?.map(msg => ({
      role: msg.sender_type as 'user' | 'bot' | 'agent',
      content: msg.content
    })) || [];
    
    // Generate AI response
    const aiResponse = await generateAIResponse(
      conversationId,
      messageText,
      formattedHistory
    );
    
    let responseContent = aiResponse.content;
    
    // Send the AI response
    const reply = await ctx.reply(responseContent, { 
      parse_mode: 'Markdown' 
    });
    
    // Store bot response
    if (reply) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'bot',
        content: responseContent,
        telegram_message_id: reply.message_id
      });
    }
  } catch (error) {
    console.error('Error generating response:', error);
    await ctx.reply('Sorry, I encountered an error. Please try again or type "agent" to speak with a human.');
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