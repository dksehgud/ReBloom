import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AppRole } from '../../../shared/types/appRole'

const SESSION_STORAGE_KEY = 'rebloom-app-session'

type SessionTokenState = {
  accessToken: string | null
  refreshToken: string | null
}

type AppSessionState = SessionTokenState & {
  activeRole: AppRole
  setActiveRole: (role: AppRole) => void
  setSessionTokens: (tokens: Partial<SessionTokenState>) => void
  clearSession: () => void
}

export const useAppSessionStore = create<AppSessionState>()(
  persist(
    (set) => ({
      activeRole: null,
      accessToken: null,
      refreshToken: null,
      setActiveRole: (activeRole) => set({ activeRole }),
      setSessionTokens: ({ accessToken, refreshToken }) =>
        set((state) => ({
          accessToken: accessToken === undefined ? state.accessToken : accessToken,
          refreshToken: refreshToken === undefined ? state.refreshToken : refreshToken,
        })),
      clearSession: () =>
        set({
          activeRole: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
