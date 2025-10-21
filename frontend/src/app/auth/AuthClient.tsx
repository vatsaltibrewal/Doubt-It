'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/components/authStore';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AuthClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      router.replace('/?auth=forbidden');
      return;
    }

    (async () => {
      try {
        const q = `code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        await axios.get(`${apiUrl}/auth/token?${q}`, { withCredentials: true });

        await useAuthStore.getState().fetchMe();

        router.replace('/dashboard');
        router.refresh();
      } catch {
        router.replace('/?auth=error');
      }
    })();
  }, [searchParams, router]);

  return <div className="p-6 text-white">Authenticating...</div>;
}
