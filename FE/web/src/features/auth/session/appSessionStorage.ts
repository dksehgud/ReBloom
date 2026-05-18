import type { AppRole } from '../../../shared/types/appRole'
import type { UserInfoResponse } from '../api/authApi'

type SessionRole = Exclude<AppRole, null>

type RoleSessionState = {
  accessToken: string | null
  currentUser: UserInfoResponse | null
  refreshToken: string | null
}

const EMPTY_ROLE_SESSION: RoleSessionState = {
  accessToken: null,
  currentUser: null,
  refreshToken: null,
}

const ACTIVE_ROLE_STORAGE_KEY = 'rebloom-active-session-role'
const LEGACY_SESSION_STORAGE_KEY = 'rebloom-app-session'

const roleSessionStorageKeys: Record<SessionRole, string> = {
  child: 'rebloom-child-session',
  counselor: 'rebloom-counselor-session',
  parent: 'rebloom-parent-session',
}

const sessionRoles: SessionRole[] = ['child', 'parent', 'counselor']

function createEmptyRoleSession(): RoleSessionState {
  return { ...EMPTY_ROLE_SESSION }
}

function createEmptyRoleSessions(): Record<SessionRole, RoleSessionState> {
  return {
    child: createEmptyRoleSession(),
    counselor: createEmptyRoleSession(),
    parent: createEmptyRoleSession(),
  }
}

function getBrowserStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage as Storage
  }

  return null
}

function isSessionRole(value: unknown): value is SessionRole {
  return value === 'child' || value === 'parent' || value === 'counselor'
}

function toSessionRole(value: unknown): SessionRole | null {
  if (isSessionRole(value)) {
    return value
  }

  if (value === 'CHILDREN') {
    return 'child'
  }

  if (value === 'PARENT') {
    return 'parent'
  }

  if (value === 'COUNSELOR') {
    return 'counselor'
  }

  return null
}

function getUserSessionRole(user: UserInfoResponse | null | undefined) {
  return toSessionRole(user?.role)
}

function parseJson(value: string | null): unknown {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function getPersistedState(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null
  }

  if ('state' in value && value.state && typeof value.state === 'object') {
    return value.state as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

function normalizeRoleSession(value: unknown): RoleSessionState {
  const state = getPersistedState(value)

  if (!state) {
    return createEmptyRoleSession()
  }

  return {
    accessToken:
      typeof state.accessToken === 'string' ? state.accessToken : null,
    currentUser:
      state.currentUser && typeof state.currentUser === 'object'
        ? (state.currentUser as UserInfoResponse)
        : null,
    refreshToken:
      typeof state.refreshToken === 'string' ? state.refreshToken : null,
  }
}

function readStoredRoleSession(role: SessionRole): RoleSessionState {
  const storage = getBrowserStorage()

  if (!storage) {
    return createEmptyRoleSession()
  }

  return normalizeRoleSession(parseJson(storage.getItem(roleSessionStorageKeys[role])))
}

function writeStoredRoleSession(role: SessionRole, session: RoleSessionState) {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.setItem(roleSessionStorageKeys[role], JSON.stringify({ state: session }))
}

function clearStoredRoleSession(role: SessionRole) {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  storage.removeItem(roleSessionStorageKeys[role])
}

function readStoredActiveRole() {
  const storage = getBrowserStorage()
  const storedRole = parseJson(storage?.getItem(ACTIVE_ROLE_STORAGE_KEY) ?? null)

  return toSessionRole(storedRole)
}

function writeStoredActiveRole(role: AppRole) {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  if (!role) {
    storage.removeItem(ACTIVE_ROLE_STORAGE_KEY)
    return
  }

  storage.setItem(ACTIVE_ROLE_STORAGE_KEY, JSON.stringify(role))
}

function readStoredAccessToken(role: SessionRole | null | undefined) {
  if (!role) {
    return null
  }

  return readStoredRoleSession(role).accessToken
}

function getFirstSessionRoleWithToken(
  sessions: Record<SessionRole, Pick<RoleSessionState, 'accessToken'>>,
  preferredRole?: AppRole,
  eligibleRoles: readonly SessionRole[] = sessionRoles,
) {
  if (
    preferredRole &&
    eligibleRoles.includes(preferredRole) &&
    sessions[preferredRole].accessToken
  ) {
    return preferredRole
  }

  return eligibleRoles.find((role) => sessions[role].accessToken) ?? null
}

function isUserExpectedSessionRole(
  user: UserInfoResponse | null | undefined,
  expectedRole: SessionRole,
) {
  return getUserSessionRole(user) === expectedRole
}

function inferSessionRoleFromApiPath(path: string): SessionRole | null {
  const normalizedPath = path.toLowerCase()

  if (normalizedPath.includes('/counselors')) {
    return 'counselor'
  }

  if (normalizedPath.includes('/parents')) {
    return 'parent'
  }

  if (normalizedPath.includes('/children')) {
    return 'child'
  }

  return null
}

function migrateLegacyAppSession() {
  const storage = getBrowserStorage()

  if (!storage) {
    return
  }

  const legacyState = getPersistedState(
    parseJson(storage.getItem(LEGACY_SESSION_STORAGE_KEY)),
  )

  if (!legacyState) {
    return
  }

  const legacySession = normalizeRoleSession(legacyState)
  const legacyRole =
    toSessionRole(legacyState.activeRole) ?? getUserSessionRole(legacySession.currentUser)

  if (legacyRole && legacySession.accessToken) {
    const currentRoleSession = readStoredRoleSession(legacyRole)

    if (!currentRoleSession.accessToken) {
      writeStoredRoleSession(legacyRole, legacySession)
    }
  }

  storage.removeItem(LEGACY_SESSION_STORAGE_KEY)
}

function readInitialRoleSessions() {
  migrateLegacyAppSession()

  return sessionRoles.reduce(
    (sessions, role) => ({
      ...sessions,
      [role]: readStoredRoleSession(role),
    }),
    createEmptyRoleSessions(),
  )
}

export type { RoleSessionState, SessionRole }
export {
  createEmptyRoleSession,
  createEmptyRoleSessions,
  getFirstSessionRoleWithToken,
  getUserSessionRole,
  inferSessionRoleFromApiPath,
  isUserExpectedSessionRole,
  readInitialRoleSessions,
  readStoredAccessToken,
  readStoredActiveRole,
  readStoredRoleSession,
  roleSessionStorageKeys,
  sessionRoles,
  toSessionRole,
  clearStoredRoleSession,
  writeStoredActiveRole,
  writeStoredRoleSession,
}
