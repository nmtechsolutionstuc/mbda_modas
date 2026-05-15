import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      accessToken: null,
      isLoading: true,
      setAuth: (user, accessToken) => set({ user, accessToken, isLoading: false }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, accessToken: null, isLoading: false }),
      setLoading: loading => set({ isLoading: loading }),
    }),
    {
      // Solo persistir user + token. isLoading siempre arranca en true.
      name: 'mbda-rev-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
)
