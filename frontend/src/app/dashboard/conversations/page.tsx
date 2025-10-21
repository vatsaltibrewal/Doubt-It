'use client'

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useDoubtItSocket } from '@/hooks/useDoubtItSocket' 
import { useAuthStore } from '@/components/authStore'

type ServerStatus = 'AI' | 'WAITING' | 'HUMAN' | 'CLOSED'
type UIStatus = 'WAITING' | 'OPEN' | 'CLOSED'

const uiToServer: Record<UIStatus, ServerStatus> = {
  WAITING: 'WAITING',
  OPEN: 'HUMAN',
  CLOSED: 'CLOSED',
}
const serverToUi: Record<ServerStatus, UIStatus> = {
  AI: 'WAITING',
  WAITING: 'WAITING',
  HUMAN: 'OPEN',
  CLOSED: 'CLOSED',
}

type ConversationRaw = {
  id?: string
  conversationId?: string
  pk?: string
  status: ServerStatus
  subject?: string
  last_active?: string
  telegram_chat_id?: string
  user_name?: string
  current_agent_id?: string | null
  ended_at?: string
}
type Conversation = ConversationRaw & { id: string }

type Message = {
  id?: string
  clientId?: string
  role: 'USER' | 'AGENT' | 'AI' | 'SYSTEM'
  text: string
  createdAt: string // ISO or epoch string
}

type State = {
  list: Conversation[]
  selectedId: string | null
  messages: Record<string, Message[]>
  convById: Record<string, Conversation | undefined>
  nextKeyByConv: Record<string, any>
  nextListKey?: any
  loadingList: boolean
  loadingDetail: boolean
}
type Action =
  | { type: 'SET_LIST'; list: Conversation[]; nextKey?: any }
  | { type: 'APPEND_LIST'; list: Conversation[]; nextKey?: any }
  | { type: 'SELECT'; id: string }
  | { type: 'SET_MESSAGES'; id: string; msgs: Message[]; nextKey?: any }
  | { type: 'UPSERT_MESSAGE'; id: string; msg: Message }
  | { type: 'UPSERT_CONV'; conv: Conversation }
  | { type: 'LOADING_LIST'; on: boolean }
  | { type: 'LOADING_DETAIL'; on: boolean }

const initialState: State = {
  list: [],
  selectedId: null,
  messages: {},
  convById: {},
  nextKeyByConv: {},
  loadingList: true,
  loadingDetail: false,
}

function extractIdFromPk(pk?: string) {
  if (!pk) return null
  const i = pk.indexOf('#')
  return i >= 0 ? pk.slice(i + 1) : null
}
function normalizeConversation(raw: ConversationRaw): Conversation {
  const id = raw.id || raw.conversationId || extractIdFromPk(raw.pk) || crypto.randomUUID()
  return { ...raw, id }
}
function parseTs(ts: any): number {
  if (typeof ts === 'number') return ts * (ts < 2e10 ? 1000 : 1) // handle telegram seconds
  if (typeof ts === 'string') {
    const n = Number(ts)
    if (!Number.isNaN(n) && ts.trim() !== '') return parseTs(n)
    const d = Date.parse(ts)
    if (!Number.isNaN(d)) return d
  }
  return Date.now()
}
function sortAsc(a: Message, b: Message) {
  const da = parseTs(a.createdAt)
  const db = parseTs(b.createdAt)
  if (da !== db) return da - db
  // tie-breaker for stability
  return (a.id || a.clientId || '') < (b.id || b.clientId || '') ? -1 : 1
}
function uniqSorted(msgs: Message[]) {
  const seen = new Set<string>()
  const out: Message[] = []
  for (const m of msgs) {
    const key = `${m.id || m.clientId || ''}|${m.role}|${m.createdAt}|${m.text.slice(0, 32)}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(m)
    }
  }
  return out.sort(sortAsc)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LIST': {
      const convById = { ...state.convById }
      for (const c of action.list) convById[c.id] = c
      return { ...state, list: action.list, convById, nextListKey: action.nextKey, loadingList: false }
    }
    case 'APPEND_LIST': {
      const convById = { ...state.convById }
      for (const c of action.list) convById[c.id] = c
      return { ...state, list: [...state.list, ...action.list], convById, nextListKey: action.nextKey }
    }
    case 'SELECT':
      return { ...state, selectedId: action.id }
    case 'SET_MESSAGES': {
      return {
        ...state,
        messages: { ...state.messages, [action.id]: uniqSorted(action.msgs) },
        nextKeyByConv: { ...state.nextKeyByConv, [action.id]: action.nextKey },
        loadingDetail: false,
      }
    }
    case 'UPSERT_MESSAGE': {
      const cur = state.messages[action.id] || []
      const next = uniqSorted([...cur, action.msg])
      return { ...state, messages: { ...state.messages, [action.id]: next } }
    }
    case 'UPSERT_CONV': {
      const convById = {
        ...state.convById,
        [action.conv.id]: { ...(state.convById[action.conv.id] || {}), ...action.conv },
      }
      const exists = state.list.some((c) => c.id === action.conv.id)
      const list = exists ? state.list.map((c) => (c.id === action.conv.id ? convById[action.conv.id]! : c)) : [action.conv, ...state.list]
      return { ...state, convById, list }
    }
    case 'LOADING_LIST':
      return { ...state, loadingList: action.on }
    case 'LOADING_DETAIL':
      return { ...state, loadingDetail: action.on }
    default:
      return state
  }
}

const API = process.env.NEXT_PUBLIC_API_URL!
const WSS = process.env.NEXT_PUBLIC_WS_URL!

export default function ConversationsPage() {
  const [tab, setTab] = useState<UIStatus>('WAITING')
  const serverStatus = useMemo(() => uiToServer[tab], [tab])
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user } = useAuthStore()
  const http = useMemo(() => axios.create({ baseURL: API, withCredentials: true }), [])
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  // Load list for the selected tab (UI -> server mapping)
  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'LOADING_LIST', on: true })
    http.get('/dashboard/conversations', { params: { status: serverStatus, limit: 20 } })
      .then(({ data }) => {
        if (cancelled) return
        const itemsRaw: ConversationRaw[] = Array.isArray(data) ? data : data.items ?? []
        const items = itemsRaw.map(normalizeConversation)
        dispatch({ type: 'SET_LIST', list: items, nextKey: data.nextKey })
      })
      .catch(() => !cancelled && dispatch({ type: 'SET_LIST', list: [], nextKey: undefined }))
    return () => { cancelled = true }
  }, [http, serverStatus])

  // Load messages for a selected conversation
  useEffect(() => {
    const cid = state.selectedId
    if (!cid) return
    let cancelled = false
    dispatch({ type: 'LOADING_DETAIL', on: true })
    http.get(`/dashboard/conversations/${cid}`, { params: { limit: 50 } })
      .then(({ data }) => {
        if (cancelled) return
        const msgs: Message[] = (data.messages || []).map((m: any) => ({
          id: m.id ?? m.message_id ?? m.telegram_message_id,
          role: (m.role || m.sender_type || 'USER') as Message['role'],
          text: m.text ?? m.content ?? '',
          createdAt: m.created_at ?? m.createdAt ?? m.timestamp ?? new Date().toISOString(),
        }))
        dispatch({ type: 'SET_MESSAGES', id: cid, msgs, nextKey: data.nextKey })
        if (data.header) {
          const conv = normalizeConversation(data.header as ConversationRaw)
          dispatch({ type: 'UPSERT_CONV', conv })
        }
      })
      .catch(() => !cancelled && dispatch({ type: 'SET_MESSAGES', id: cid, msgs: [] }))
    return () => { cancelled = true }
  }, [http, state.selectedId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !state.selectedId) return
    el.scrollTop = el.scrollHeight
  }, [state.selectedId, state.messages[state.selectedId || '']])

  // Live updates (keep your WS hook)
  useDoubtItSocket(WSS, {
    onMessage: (evt: any) => {
      if (evt?.type === 'message.created' && evt.conversationId && evt.message) {
        const m = {
          id: evt.message.id,
          role: (evt.message.role || 'USER') as 'USER' | 'AGENT' | 'AI' | 'SYSTEM',
          text: evt.message.text || '',
          createdAt: evt.message.created_at || new Date().toISOString(),
        }
        dispatch({ type: 'UPSERT_MESSAGE', id: evt.conversationId, msg: m })

        // bump last_active on the list item if we have it cached
        const c = state.convById[evt.conversationId]
        if (c) {
          dispatch({
            type: 'UPSERT_CONV',
            conv: { ...c, last_active: evt.message.created_at || new Date().toISOString() },
          })
        }
        return
      }

      if (evt?.type === 'conversation.updated' && evt.conversationId) {
        const c = state.convById[evt.conversationId]
        dispatch({
          type: 'UPSERT_CONV',
          conv: {
            ...(c || { id: evt.conversationId }),
            status: evt.payload?.status ?? c?.status,
            current_agent_id: evt.payload?.current_agent_id ?? c?.current_agent_id ?? null,
            last_active: evt.payload?.last_active ?? c?.last_active,
            ended_at: evt.payload?.ended_at ?? c?.ended_at,
          } as any,
        })
        return
      }

      // backwards-compat if older events appear (optional)
      if (evt?.type === 'waiting' && evt.conversationId) {
        // A new waiting chat — insert a stub if we don’t have it yet
        if (!state.convById[evt.conversationId]) {
          dispatch({
            type: 'UPSERT_CONV',
            conv: { id: evt.conversationId, status: 'WAITING', current_agent_id: null } as any,
          })
        }
      }
    },
  })

  const selected = state.selectedId ? state.convById[state.selectedId] : undefined
  const selectedUi = selected ? serverToUi[selected.status] : undefined
  const isOpen = selectedUi === 'OPEN'
  const isOwner = isOpen && !!selected?.current_agent_id && !!user?.id && selected.current_agent_id === user.id

  async function handleClaim() {
    if (!state.selectedId) return
    try {
      const { status } = await http.post(`/telegram/conversations/${state.selectedId}/claim`)
      if (status === 200) {
        // optimistic (WS update will confirm)
        dispatch({
          type: 'UPSERT_CONV',
          conv: { ...(state.convById[state.selectedId] as Conversation), id: state.selectedId, status: 'HUMAN', current_agent_id: user?.id || null },
        })
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to claim')
    }
  }

  const [draft, setDraft] = useState('')
  async function handleSend() {
    if (!state.selectedId || !draft.trim()) return
    try {
      const { status } = await http.post(`/telegram/conversations/${state.selectedId}/send`, { text: draft.trim() })
      if (status === 200) setDraft('')
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to send')
    }
  }
  async function handleClose() {
    if (!state.selectedId) return
    try {
      const { status } = await http.post(`/telegram/conversations/${state.selectedId}/close`)
      if (status === 200) {
        dispatch({
          type: 'UPSERT_CONV',
          conv: { ...(state.convById[state.selectedId] as Conversation), id: state.selectedId, status: 'CLOSED', current_agent_id: null },
        })
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to close')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#101218] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">Conversations</h1>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {(['WAITING', 'OPEN', 'CLOSED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={[
                'px-3 py-2 text-sm font-bold border-2 border-black',
                'shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform',
                s === tab ? 'bg-[#8B5CF6] text-black' : 'bg-[#1B1F2A] text-white hover:translate-x-[1px] hover:translate-y-[1px]',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* List */}
          <aside className="md:col-span-5">
            <div className="border-2 border-black bg-[#0F1116] shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              {state.loadingList && <div className="p-4 text-sm text-gray-300">Loading conversations…</div>}
              {!state.loadingList && state.list.length === 0 && <div className="p-4 text-sm text-gray-300">No conversations.</div>}

              <ul>
                {state.list.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => dispatch({ type: 'SELECT', id: c.id })}
                      className={[
                        'w-full text-left px-4 py-3 border-b-2 border-black',
                        'hover:bg-[#161A22]',
                        state.selectedId === c.id ? 'bg-[#161A22]' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold truncate">{c.user_name || c.telegram_chat_id || c.id}</div>
                        <span className="text-xs text-gray-400">{serverToUi[c.status]}</span>
                      </div>
                      {c.last_active && <div className="text-xs text-gray-500 mt-0.5">{new Date(c.last_active).toLocaleString()}</div>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Detail */}
          <section className="md:col-span-7">
            <div className="border-2 border-black bg-white text-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] min-h-[420px]">
              {!state.selectedId && <div className="p-8 text-gray-700">Select a conversation from the left.</div>}

              {state.selectedId && (
                <div className="flex flex-col h-[70vh]">
                  <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-[#F8FAFC]">
                    <div className="font-bold">
                      {selected?.user_name || selected?.telegram_chat_id || selected?.id}
                      <span className="ml-2 text-xs text-gray-500">({selected && serverToUi[selected.status]})</span>
                    </div>
                    <div className="flex gap-2">
                      {serverToUi[selected!.status] === 'WAITING' && (
                        <button
                          onClick={handleClaim}
                          className="px-3 py-2 text-sm font-bold bg-[#8B5CF6] text-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                        >
                          Claim
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={handleClose}
                          className="px-3 py-2 text-sm font-bold bg-[#FDE047] text-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(state.messages[state.selectedId] || []).map((m, i) => (
                      <div
                        key={m.id || m.clientId || `${m.role}-${m.createdAt}-${i}`}
                        className={[
                          'max-w-[85%] px-3 py-2 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
                          m.role === 'USER' ? 'bg-[#FDE047] ml-0' : m.role === 'AGENT' ? 'bg-[#8B5CF6] ml-auto' : m.role === 'SYSTEM' ? 'bg-[#E5E7EB] ml-auto' : 'bg-[#22D3EE] ml-auto',
                        ].join(' ')}
                      >
                        <div className="text-xs font-bold mb-1">{m.role}</div>
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        <div className="text-[10px] text-black/60 mt-1">{new Date(parseTs(m.createdAt)).toLocaleString()}</div>
                      </div>
                    ))}
                    {state.loadingDetail && <div className="text-sm text-gray-600">Loading messages…</div>}
                  </div>

                  {/* Composer */}
                  {isOwner ? (
                    <div className="border-t-2 border-black p-3 bg-[#F3F4F6] flex gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Type a reply…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        className="flex-1 px-3 py-2 border-2 border-black outline-none"
                      />
                      <button
                        onClick={handleSend}
                        className="px-3 py-2 font-bold bg-[#22D3EE] text-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                      >
                        Send
                      </button>
                    </div>
                  ) : (
                    <div className="border-t-2 border-black p-3 bg-[#F3F4F6] text-xs text-gray-600">
                      {isOpen ? 'This chat is assigned to another agent.' : 'Claim the chat to start replying.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-block bg-[#1B1F2A] text-white px-4 py-2 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
