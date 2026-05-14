import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AppRole } from '../../../shared/types/appRole'
import type { UserInfoResponse } from '../api/authApi'

const SESSION_STORAGE_KEY = 'rebloom-app-session'

type SessionTokenState = {
  accessToken: string | null
  refreshToken: string | null
}

type AppSessionState = SessionTokenState & {
  activeRole: AppRole
  currentUser: UserInfoResponse | null
  setActiveRole: (role: AppRole) => void
  setCurrentUser: (user: UserInfoResponse | null) => void
  setSessionTokens: (tokens: Partial<SessionTokenState>) => void
  clearSession: () => void
}

export const useAppSessionStore = create<AppSessionState>()(
  persist(
    (set) => ({
      activeRole: null,
      accessToken: null,
      currentUser: null,
      refreshToken: null,
      setActiveRole: (activeRole) => set({ activeRole }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      setSessionTokens: ({ accessToken, refreshToken }) =>
        set((state) => ({
          accessToken: accessToken === undefined ? state.accessToken : accessToken,
          refreshToken: refreshToken === undefined ? state.refreshToken : refreshToken,
        })),
      clearSession: () =>
        set({
          activeRole: null,
          accessToken: null,
          currentUser: null,
          refreshToken: null,
        }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
