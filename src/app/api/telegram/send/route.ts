import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { createServerSupabaseClient } from '@/lib/supabase';

// Initialize Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export async function POST(req: NextRequest) {
  try {
    const { chat_id, text, message_id } = await req.json();
    
    if (!chat_id || !text) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    // Send message to Telegram
    const result = await bot.telegram.sendMessage(chat_id, text);
    
    // If we have a message_id, update it with the Telegram message ID
    if (message_id) {
      const supabase = createServerSupabaseClient();
      await supabase
        .from('messages')
        .update({ telegram_message_id: result.message_id })
        .eq('id', message_id);
    }
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error sending Telegram message:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' }, 
      { status: 500 }
    );
  }
}