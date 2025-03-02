import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { rating, feedback, conversation_id } = await req.json();
    
    if (!rating || !conversation_id) {
      return NextResponse.json(
        { error: 'Rating and conversation_id are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('conversation_feedback')
      .insert({
        conversation_id,
        rating,
        feedback,
      });

    if (error) {
      console.error('Error saving feedback:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}