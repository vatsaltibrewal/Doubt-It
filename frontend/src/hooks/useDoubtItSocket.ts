'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type WSMessage =
  | { type: 'ack'; routeKey?: string; received?: string }
  | { type: 'conversation.updated'; conversationId: string; payload: any }
  | { type: 'message.created'; conversationId: string; message: any }
  | { type: string; [k: string]: any }

type Handlers = {
  onMessage?: (msg: WSMessage) => void
  onOpen?: () => void
  onClose?: (ev: CloseEvent) => void
  onError?: (ev: Event) => void
}

const JITTER = (min = 0, max = 1) => min + Math.random() * (max - min)
const API = process.env.NEXT_PUBLIC_API_URL!

export function useDoubtItSocket(
  url: string,
  handlers: Handlers = {}
) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const pingTimer = useRef<number | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const started = useRef(false)          // prevents double connect in dev
  const everOpened = useRef(false)       // suppress noisy 1006 before OPEN

  // Keep latest handlers without forcing new connects on re-render
  const onMessageRef = useRef<Handlers['onMessage']>(undefined)
  const onOpenRef = useRef<Handlers['onOpen']>(undefined)
  const onCloseRef = useRef<Handlers['onClose']>(undefined)
  const onErrorRef = useRef<Handlers['onError']>(undefined)
  useEffect(() => {
    onMessageRef.current = handlers.onMessage
    onOpenRef.current = handlers.onOpen
    onCloseRef.current = handlers.onClose
    onErrorRef.current = handlers.onError
  }, [handlers.onMessage, handlers.onOpen, handlers.onClose, handlers.onError])

  const clearTimers = () => {
    if (pingTimer.current) { window.clearInterval(pingTimer.current); pingTimer.current = null }
    if (reconnectTimer.current) { window.clearTimeout(reconnectTimer.current); reconnectTimer.current = null }
  }

  const scheduleReconnect = useCallback(() => {
    if (document.hidden) return
    const base = 500, cap = 30000
    const exp = Math.min(cap, base * 2 ** attempt)
    const delay = Math.floor(JITTER(0, exp))
    reconnectTimer.current = window.setTimeout(() => setAttempt(a => a + 1), delay)
  }, [attempt])

  const connect = useCallback(async () => {
    try {
      // 1) fetch a short-lived WS URL (includes ?token=ACCESS_TOKEN)
      const r = await fetch(`${API}/auth/realtimetoken`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!r.ok) {
        const text = await r.text().catch(() => '')
        console.error('[ws] ticket-failed', r.status, text)
        throw new Error('ticket-failed')
      }
      const data = await r.json()
      const wsUrl = data?.websocketURL || url // fallback to passed url if you like
      if (!wsUrl) throw new Error('no-ws-url')

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      everOpened.current = false

      ws.onopen = () => {
        everOpened.current = true
        setConnected(true)
        setAttempt(0)
        onOpenRef.current?.()
        // heartbeat
        pingTimer.current = window.setInterval(() => {
          try { ws.send(JSON.stringify({ type: 'ping' })) } catch {}
        }, 25_000)
        console.log('[ws] open')
      }

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as WSMessage
          onMessageRef.current?.(msg)
        } catch { /* ignore malformed frames */ }
      }

      ws.onerror = (ev) => {
        // Chrome fires this if handshake was interrupted
        if (everOpened.current) console.warn('[ws] error', ev)
        onErrorRef.current?.(ev)
      }

      ws.onclose = (ev) => {
        // Don’t alarm on 1006 if we never reached OPEN (dev/refresh noise)
        if (everOpened.current || ev.code !== 1006) {
          console.warn('[ws] close', ev.code, ev.reason)
        }
        setConnected(false)
        clearTimers()
        onCloseRef.current?.(ev)
        scheduleReconnect()
      }
    } catch (e) {
      console.warn('[ws] connect-ex', (e as Error)?.message)
      scheduleReconnect()
    }
    // Only depends on URL; handler updates don’t reconnect
  }, [url, scheduleReconnect])

  useEffect(() => {
    if (started.current) return
    started.current = true
    connect()
    return () => {
      clearTimers()
      try { wsRef.current?.close() } catch {}
      wsRef.current = null
      started.current = false
    }
  }, [connect])

  useEffect(() => {
    const onVis = () => {
      if (!connected && document.visibilityState === 'visible') setAttempt(a => a + 1)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [connected])

  const send = useCallback((msg: any) => {
    if (wsRef.current && connected) wsRef.current.send(JSON.stringify(msg))
  }, [connected])

  return { connected, send }
}
