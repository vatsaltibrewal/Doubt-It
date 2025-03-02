'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeChats: 0,
    resolvedToday: 0,
    waitingForAgent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Get active chats
      const { data: activeChats, error: activeError } = await supabaseClient
        .from('conversations')
        .select('*', { count: 'exact' })
        .in('status', ['ai_mode', 'agent_mode']);
      
      // Get resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: resolvedToday, error: resolvedError } = await supabaseClient
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('status', 'closed')
        .gte('ended_at', today.toISOString());
      
      // Get waiting for agent
      const { data: waitingForAgent, error: waitingError } = await supabaseClient
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('status', 'ai_mode');
      
      if (activeError || resolvedError || waitingError) {
        console.error("Error fetching stats");
        return;
      }
      
      setStats({
        activeChats: activeChats?.length || 0,
        resolvedToday: resolvedToday?.length || 0,
        waitingForAgent: waitingForAgent?.length || 0
      });
      
      setLoading(false);
    };
    
    fetchStats();
  }, []);

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </header>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <p>Welcome to DoubtIt Support Dashboard</p>
          <p className="mt-4">Here you can monitor and manage support conversations.</p>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-indigo-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Chats
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                  {loading ? '...' : stats.activeChats}
                </dd>
              </div>
            </div>
            
            <div className="bg-green-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Resolved Today
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {loading ? '...' : stats.resolvedToday}
                </dd>
              </div>
            </div>
            
            <div className="bg-yellow-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Waiting for Agent
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                  {loading ? '...' : stats.waitingForAgent}
                </dd>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <Link 
              href="/dashboard/conversations" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View All Conversations
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}