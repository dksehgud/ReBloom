import { create } from 'zustand'

import type { AppRole } from '../../../shared/types/appRole'
import type { UserInfoResponse } from '../api/authApi'
import {
  clearStoredRoleSession,
  createEmptyRoleSession,
  createEmptyRoleSessions,
  getUserSessionRole,
  readInitialRoleSessions,
  readStoredActiveRole,
  type RoleSessionState,
  type SessionRole,
  writeStoredActiveRole,
  writeStoredRoleSession,
} from '../session/appSessionStorage'

type SessionTokenState = {
  accessToken: string | null
  refreshToken: string | null
}

type RoleSessionPatch = Partial<RoleSessionState>

type AppSessionState = SessionTokenState & {
  activeRole: AppRole
  currentUser: UserInfoResponse | null
  sessions: Record<SessionRole, RoleSessionState>
  clearAllSessions: () => void
  clearSession: (role?: SessionRole) => void
  setActiveRole: (role: AppRole) => void
  setCurrentUser: (user: UserInfoResponse | null, role?: SessionRole) => void
  setRoleSession: (role: SessionRole, session: RoleSessionPatch) => void
  setSessionTokens: (
    tokens: Partial<SessionTokenState>,
    role?: SessionRole,
  ) => void
}

function getActiveSessionState(
  role: AppRole,
  sessions: Record<SessionRole, RoleSessionState>,
) {
  if (!role) {
    return createEmptyRoleSession()
  }

  return sessions[role]
}

const initialSessions = readInitialRoleSessions()
const initialActiveRole = readStoredActiveRole()
const initialActiveSession = getActiveSessionState(
  initialActiveRole,
  initialSessions,
)

export const useAppSessionStore = create<AppSessionState>()((set, get) => ({
  activeRole: initialActiveRole,
  accessToken: initialActiveSession.accessToken,
  currentUser: initialActiveSession.currentUser,
  refreshToken: initialActiveSession.refreshToken,
  sessions: initialSessions,
  clearAllSessions: () => {
    const emptySessions = createEmptyRoleSessions()

    Object.keys(emptySessions).forEach((role) => {
      clearStoredRoleSession(role as SessionRole)
    })
    writeStoredActiveRole(null)
    set({
      activeRole: null,
      accessToken: null,
      currentUser: null,
      refreshToken: null,
      sessions: emptySessions,
    })
  },
  clearSession: (role) => {
    const state = get()
    const targetRole = role ?? state.activeRole

    if (!targetRole) {
      state.clearAllSessions()
      return
    }

    const nextSessions = {
      ...state.sessions,
      [targetRole]: createEmptyRoleSession(),
    }

    clearStoredRoleSession(targetRole)

    if (state.activeRole !== targetRole) {
      set({ sessions: nextSessions })
      return
    }

    writeStoredActiveRole(null)
    set({
      activeRole: null,
      accessToken: null,
      currentUser: null,
      refreshToken: null,
      sessions: nextSessions,
    })
  },
  setActiveRole: (activeRole) => {
    const activeSession = getActiveSessionState(activeRole, get().sessions)

    writeStoredActiveRole(activeRole)
    set({
      activeRole,
      accessToken: activeSession.accessToken,
      currentUser: activeSession.currentUser,
      refreshToken: activeSession.refreshToken,
    })
  },
  setCurrentUser: (currentUser, role) => {
    const state = get()
    const targetRole = role ?? getUserSessionRole(currentUser) ?? state.activeRole

    if (!targetRole) {
      set({ currentUser })
      return
    }

    state.setRoleSession(targetRole, { currentUser })
  },
  setRoleSession: (role, session) => {
    const state = get()
    const nextRoleSession = {
      ...state.sessions[role],
      ...session,
    }
    const nextSessions = {
      ...state.sessions,
      [role]: nextRoleSession,
    }

    writeStoredRoleSession(role, nextRoleSession)

    if (state.activeRole !== role) {
      set({ sessions: nextSessions })
      return
    }

    set({
      accessToken: nextRoleSession.accessToken,
      currentUser: nextRoleSession.currentUser,
      refreshToken: nextRoleSession.refreshToken,
      sessions: nextSessions,
    })
  },
  setSessionTokens: ({ accessToken, refreshToken }, role) => {
    const state = get()
    const targetRole = role ?? state.activeRole

    if (!targetRole) {
      set((currentState) => ({
        accessToken:
          accessToken === undefined ? currentState.accessToken : accessToken,
        refreshToken:
          refreshToken === undefined ? currentState.refreshToken : refreshToken,
      }))
      return
    }

    state.setRoleSession(targetRole, {
      accessToken:
        accessToken === undefined
          ? state.sessions[targetRole].accessToken
          : accessToken,
      refreshToken:
        refreshToken === undefined
          ? state.sessions[targetRole].refreshToken
          : refreshToken,
    })
  },
}))
