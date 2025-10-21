'use client'

import Link from 'next/link'
import { useAuthStore } from '@/components/authStore'
import AuthWidget from '@/components/login/authComponent'

export default function Header() {
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-50">
      <nav
        className={[
          // Dark (but not pitch-black) base + subtle texture feel
          'bg-[#101218] text-white',
          // Thick neo-brutalist stroke + offset shadow block
          'border-b-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]',
        ].join(' ')}
        aria-label="Primary"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={[
                  'h-9 w-9 text-black',
                  'grid place-items-center font-extrabold',
                  'border-2 border-black',
                  'shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
                ].join(' ')}
                aria-hidden
              >
                <img src="/doubtItSmallLogo.png" alt="D" />
              </div>
              <Link
                href="/"
                className="text-xl font-black tracking-tight hover:opacity-90"
              >
                DoubtIt
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {user && (
                <ul className="hidden md:flex items-center gap-4">
                  <li>
                    <Link
                      href="/dashboard"
                      className={[
                        'px-3 py-2 text-sm font-semibold',
                        'bg-[#1B1F2A] border-2 border-black',
                        'shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
                        'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)]',
                        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]',
                        'transition-transform',
                      ].join(' ')}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/conversations"
                      className={[
                        'px-3 py-2 text-sm font-semibold',
                        'bg-[#1B1F2A] border-2 border-black',
                        'shadow-[4px_4px_0_0_rgba(0,0,0,1)]',
                        'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)]',
                        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]',
                        'transition-transform',
                      ].join(' ')}
                    >
                      Conversations
                    </Link>
                  </li>
                </ul>
              )}
              <AuthWidget />
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
