'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

type Stats = {
  waitingNow: number
  openNow: number
  aiNow: number
  closed24h: number
  topAgents: { agent: string; count: number }[]
  recentWaiting: { id: string; user_name: string; last_active: string }[]
  generatedAt: string
}

const API = process.env.NEXT_PUBLIC_API_URL!

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let canceled = false
    const http = axios.create({ baseURL: API, withCredentials: true })
    http.get('/dashboard/stats')
      .then(({ data }) => { if (!canceled) setStats(data) })
      .catch((e) => { if (!canceled) setError(e?.response?.data?.message || 'Failed to load stats') })
      .finally(() => { if (!canceled) setLoading(false) })
    return () => { canceled = true }
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#101218] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <Link
            href="/dashboard/conversations"
            className="bg-[#22D3EE] text-black font-extrabold border-2 border-black px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            Go to Conversations →
          </Link>
        </div>

        {loading && <div className="text-gray-300">Loading metrics…</div>}
        {error && <div className="text-red-400">{error}</div>}

        {stats && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPI title="Waiting Now" value={stats.waitingNow} accent="bg-[#FDE047]" />
              <KPI title="Open (Human)" value={stats.openNow} accent="bg-[#8B5CF6]" />
              <KPI title="AI Active" value={stats.aiNow} accent="bg-[#22D3EE]" />
              <KPI title="Closed (24h)" value={stats.closed24h} accent="bg-[#34D399]" />
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card title="Top Agents (by open chats)">
                <ul>
                  {stats.topAgents.length === 0 && <li className="text-sm text-gray-400">No open chats.</li>}
                  {stats.topAgents.map((a) => (
                    <li key={a.agent} className="flex items-center justify-between py-2 border-b border-black/40">
                      <span className="font-bold">{a.agent}</span>
                      <span className="text-sm bg-[#8B5CF6] text-black px-2 py-0.5 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">{a.count}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Recently Waiting">
                <ul>
                  {stats.recentWaiting.length === 0 && <li className="text-sm text-gray-400">No recent waiting chats.</li>}
                  {stats.recentWaiting.map((w) => (
                    <li key={w.id} className="flex items-center justify-between py-2 border-b border-black/40">
                      <div className="truncate">
                        <div className="font-bold truncate">{w.user_name || w.id}</div>
                        <div className="text-xs text-gray-400">{new Date(w.last_active).toLocaleString()}</div>
                      </div>
                      <Link
                        href={`/dashboard/conversations?focus=${w.id}`}
                        className="text-xs bg-[#FDE047] text-black font-bold border-2 border-black px-2 py-1 shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="text-xs text-gray-500 mt-4">Updated at {new Date(stats.generatedAt).toLocaleString()}</div>
          </>
        )}
      </div>
    </div>
  )
}

function KPI({ title, value, accent }: { title: string; value: number | string; accent: string }) {
  return (
    <div className={`border-2 border-black ${accent} text-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]`}>
      <div className="px-4 py-3">
        <div className="text-xs font-bold uppercase">{title}</div>
        <div className="text-4xl font-black mt-1">{value}</div>
      </div>
    </div>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-black bg-[#0F1116] text-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
      <div className="px-4 py-3 border-b-2 border-black bg-[#161A22]">
        <div className="font-black">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
