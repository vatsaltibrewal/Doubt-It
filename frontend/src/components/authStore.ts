import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

type User = { id: string; email: string }

type AuthState = {
  user: User | null
  loading: boolean
  hydrated: boolean
  setHydrated: () => void
  fetchMe: () => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        loading: false,
        hydrated: false,
        setHydrated: () => set({ hydrated: true }),
        fetchMe: async () => {
          set({ loading: true })
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
              { credentials: 'include', cache: 'no-store' }
            )
            if (res.ok) {
              const data = (await res.json()) as { id: string; email: string }
              set({ user: { id: data.id, email: data.email } })
            } else {
              set({ user: null })
            }
          } catch {
            set({ user: null })
          } finally {
            set({ loading: false })
          }
        },
        login: async () => {
          // gets PKCE cookies + login URL, then redirect
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            { credentials: 'include' }
          )
          if (!res.ok) throw new Error('Login init failed')
          const data = await res.json()
          if (data?.cognitoLoginURL) {
            window.location.assign(data.cognitoLoginURL)
          }
        },
        logout: async () => {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
            { credentials: 'include' }
          )
          // Backend should already clear cookies with Set-Cookie Max-Age=0
          if (res.ok) {
            const data = await res.json()
            // Redirect user to Cognito /logout
            if (data?.cognitoLogoutURL) {
              window.location.assign(data.cognitoLogoutURL)
              return
            }
          }
          // Fallback: just clear UI state
          set({ user: null })
        },
      }),
      {
        name: 'auth-ui', // UI-only; do NOT persist tokens here
        storage: createJSONStorage(() => sessionStorage),
        partialize: (s) => ({ user: s.user }),
        onRehydrateStorage: () => (state) => state?.setHydrated(),
      }
    )
  )
)
