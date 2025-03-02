import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

export async function GET() {
  try {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    
    // Set webhook URL (use a service like ngrok for local development)
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram/webhook`;
    
    await bot.telegram.setWebhook(webhookUrl, {
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET
    });
    
    const webhookInfo = await bot.telegram.getWebhookInfo();
    
    return NextResponse.json({ 
      success: true,
      webhook: webhookInfo
    });
  } catch (error: any) {
    console.error('Failed to set webhook:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}