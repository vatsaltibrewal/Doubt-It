'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/components/authStore'

export default function AuthWidget() {
  const { user, loading, hydrated, fetchMe, login, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (hydrated) fetchMe()
  }, [hydrated, fetchMe])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      const t = e.target as Node
      if (
        btnRef.current &&
        t &&
        !btnRef.current.contains(t) &&
        !(document.getElementById('auth-menu')?.contains(t))
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  // Loading state
  if (loading && !user) {
    return (
      <button
        className={[
          'px-5 py-2 font-bold',
          'bg-[#2A2F3A] text-white',
          'border-2 border-black',
          'shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
          'cursor-wait opacity-80',
        ].join(' ')}
        disabled
      >
        Loading…
      </button>
    )
  }

  // Logged-out button (poppy color block)
  if (!user) {
    return (
      <button
        ref={btnRef}
        onClick={() => login().catch(console.error)}
        className={[
          'px-5 py-2 font-extrabold',
          // “poppy” saturated accent; tweak to your palette
          'bg-[#8B5CF6] text-black',
          'border-2 border-black',
          'shadow-[6px_6px_0_0_rgba(0,0,0,1)]',
          'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)]',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
          'transition-transform',
        ].join(' ')}
        aria-label="Login"
      >
        Admin Login
      </button>
    )
  }

  // Logged-in: button shows email; dropdown card with details + logout
  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={[
          'px-4 py-2 font-extrabold truncate max-w-[14rem]',
          'bg-[#22D3EE] text-black',
          'border-2 border-black',
          'shadow-[6px_6px_0_0_rgba(0,0,0,1)]',
          'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)]',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
          'transition-transform',
        ].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.email}
      >
        {user.email}
      </button>

      {open && (
        <div
          id="auth-menu"
          role="menu"
          className={[
            'absolute right-0 mt-2 w-72 p-4 z-50',
            'bg-white text-black',
            'border-2 border-black',
            'shadow-[8px_8px_0_0_rgba(0,0,0,1)]',
          ].join(' ')}
        >
          <div className="text-xs text-gray-600">Signed in as</div>
          <div className="font-bold truncate">{user.email}</div>
          <div className="mt-0.5 text-xs text-gray-500 truncate">id: {user.id}</div>

          <div className="my-3 h-0.5 bg-black/10" />

          <button
            onClick={() => logout().catch(console.error)}
            className={[
              'w-full text-left font-bold',
              'bg-[#FDE047] text-black',
              'border-2 border-black',
              'px-3 py-2',
              'shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
              'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)]',
              'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]',
              'transition-transform',
            ].join(' ')}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
