'use client';

import { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase';

type Message = {
  id: string;
  sender_type: 'user' | 'bot' | 'agent';
  content: string;
  created_at: string;
};

type ChatInterfaceProps = {
  conversationId: string;
  telegramChatId: string;
  currentAgentId: string | null;
  initialStatus: 'ai_mode' | 'agent_mode' | 'closed';
};

export default function ChatInterface({
  conversationId,
  telegramChatId,
  currentAgentId,
  initialStatus
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState<'ai_mode' | 'agent_mode' | 'closed'>(initialStatus);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch real messages from database
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Set up realtime subscription
    const channel = supabaseClient
      .channel('public:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        const newMessage = payload.new as Message;
        setMessages(current => [...current, newMessage]);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
      
    return () => {
      console.log('Cleaning up subscription');
      channel.unsubscribe();
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      // First add message to database
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          content: newMessage
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Then send message to Telegram API
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: newMessage,
          message_id: data.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert('Failed to send message: ' + err.message);
    }
  };

  const handleTakeOver = async () => {
    if (status === 'agent_mode') return;
    
    try {
      // Update conversation status in database
      const { error } = await supabaseClient
        .from('conversations')
        .update({
          status: 'agent_mode',
          current_agent_id: currentAgentId
        })
        .eq('id', conversationId);
      
      if (error) throw error;
      
      // Insert system message
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          content: '--- Agent has taken over the conversation ---'
        });
      
      setStatus('agent_mode');
      
      // Notify the user via Telegram
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: 'A support agent has joined the conversation and will assist you.'
        }),
      });
      
    } catch (err: any) {
      console.error('Error taking over conversation:', err);
      alert('Failed to take over: ' + err.message);
    }
  };

  const handleCloseConversation = async () => {
    try {
      // Update conversation status in database
      const { error } = await supabaseClient
        .from('conversations')
        .update({
          status: 'closed',
          ended_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (error) throw error;
      
      // Insert system message
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          content: '--- Conversation closed ---'
        });
      
      setStatus('closed');
      
      // Notify the user via Telegram
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: 'This support conversation has been closed. Feel free to message again if you need further assistance.'
        }),
      });
    } catch (err: any) {
      console.error('Error closing conversation:', err);
      alert('Failed to close conversation: ' + err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10">Loading conversation...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <h3 className="font-medium">Chat #{conversationId.slice(0, 8)}</h3>
          <p className="text-sm text-gray-500">Status: {status}</p>
        </div>
        <div className="space-x-2">
          {status === 'ai_mode' && (
            <button
              onClick={handleTakeOver}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Take Over
            </button>
          )}
          {status !== 'closed' && (
            <button
              onClick={handleCloseConversation}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close Chat
            </button>
          )}
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages in this conversation yet.</p>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  message.sender_type === 'user' 
                    ? 'bg-gray-300 text-black' 
                    : message.sender_type === 'bot'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-500 text-white'
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      {status !== 'closed' && (
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}