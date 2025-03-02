'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase';

type Conversation = {
  id: string;
  telegram_chat_id: string;
  user_name: string;
  status: string;
  started_at: string;
};

export default function ConversationsList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchConversations = async () => {
      const { data, error } = await supabaseClient
        .from('conversations')
        .select('*')
        .order('started_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }
      
      setConversations(data || []);
      setLoading(false);
    };
    
    fetchConversations();
    
    // Subscribe to new conversations
    const channel = supabaseClient
      .channel('conversations_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'conversations' }, 
        payload => {
          setConversations(prev => [payload.new as Conversation, ...prev]);
        }
      )
      .subscribe();
      
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);
  
  if (loading) {
    return <div className="flex justify-center py-10">Loading conversations...</div>;
  }
  
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
        </header>
        
        {conversations.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">No conversations found.</p>
            <p className="mt-2 text-sm text-gray-400">
              Conversations will appear here when users interact with the Telegram bot.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <Link href={`/dashboard/conversations/${conversation.id}`}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-indigo-600">
                              {conversation.user_name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: {conversation.status}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {new Date(conversation.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}