'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ToastKind = 'info' | 'warning' | 'error';

export default function AuthToast() {
  const search = useSearchParams();
  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);

  const authMessage = useMemo(() => {
    const v = search.get('auth');
    switch (v) {
      case 'required':
        return { kind: 'warning' as const, text: 'Please sign in to continue.' };
      case 'expired':
        return { kind: 'warning' as const, text: 'Your session expired. Please sign in again.' };
      case 'forbidden':
        return { kind: 'error' as const, text: "You don't have access to that page." };
      case 'signedout':
        return { kind: 'info' as const, text: 'You have been signed out.' };
      case 'error':
        return { kind: 'error' as const, text: 'Something went wrong. Please try signing in again.' };
      default:
        return null;
    }
  }, [search]);

  useEffect(() => {
    if (!authMessage) return;
    setToast(authMessage);
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [authMessage]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'fixed right-4 top-4 z-50 max-w-sm',
        'border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]',
        toast.kind === 'error'
          ? 'bg-red-400 text-black'
          : toast.kind === 'warning'
          ? 'bg-[#FDE047] text-black'
          : 'bg-[#22D3EE] text-black',
      ].join(' ')}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="font-black text-lg leading-none">!</span>
        <div className="text-sm font-semibold">{toast.text}</div>
        <button
          onClick={() => setToast(null)}
          className="ml-auto -mr-1 -mt-1 px-2 py-1 text-xs font-black border-2 border-black bg-white/70 hover:bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
