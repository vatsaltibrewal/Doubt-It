'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@/app/providers';
import ChatInterface from '@/components/ui/ChatInterface';
import { useParams } from 'next/navigation';

type Conversation = {
  id: string;
  telegram_chat_id: string;
  user_name: string;
  status: string;
  current_agent_id: string | null;
  started_at: string;
};

export default function ConversationDetail() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const params = useParams();
  const conversationId = params.id as string;
  
  useEffect(() => {
    const fetchConversation = async () => {
      const { data, error } = await supabaseClient
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (error) {
        console.error('Error fetching conversation:', error);
        return;
      }
      
      setConversation(data);
      setLoading(false);
    };
    
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);
  
  if (loading) {
    return <div className="flex justify-center py-10">Loading conversation...</div>;
  }
  
  if (!conversation) {
    return <div className="text-center py-10">Conversation not found</div>;
  }
  
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Conversation with {conversation.user_name || 'User'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Started at {new Date(conversation.started_at).toLocaleString()}
          </p>
        </header>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <ChatInterface 
            conversationId={conversation.id}
            telegramChatId={conversation.telegram_chat_id}
            currentAgentId={user?.id || null}
            initialStatus={conversation.status as 'ai_mode' | 'agent_mode' | 'closed'}
          />
        </div>
      </div>
    </main>
  );
}