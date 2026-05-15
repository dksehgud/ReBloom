import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  inferSessionRoleFromApiPath,
  isUserExpectedSessionRole,
  readStoredAccessToken,
  roleSessionStorageKeys,
} from '../src/features/auth/session/appSessionStorage'
import { useAppSessionStore } from '../src/features/auth/store/useAppSessionStore'
import type { UserInfoResponse } from '../src/features/auth/api/authApi'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function createUser(role: UserInfoResponse['role'], email: string): UserInfoResponse {
  return {
    email,
    name: email.split('@')[0] ?? 'User',
    role,
    status: 'ACTIVE',
    userId: email,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
  useAppSessionStore.getState().clearAllSessions()
})

describe('app session storage', () => {
  it('keeps parent and counselor sessions in separate storage keys', () => {
    const store = useAppSessionStore.getState()

    store.setRoleSession('parent', {
      accessToken: 'parent-token',
      currentUser: createUser('PARENT', 'parent@example.com'),
      refreshToken: 'parent-refresh',
    })
    store.setRoleSession('counselor', {
      accessToken: 'counselor-token',
      currentUser: createUser('COUNSELOR', 'counselor@example.com'),
      refreshToken: 'counselor-refresh',
    })

    expect(localStorage.getItem(roleSessionStorageKeys.parent)).toContain(
      'parent-token',
    )
    expect(localStorage.getItem(roleSessionStorageKeys.counselor)).toContain(
      'counselor-token',
    )
    expect(readStoredAccessToken('parent')).toBe('parent-token')
    expect(readStoredAccessToken('counselor')).toBe('counselor-token')

    useAppSessionStore.getState().setActiveRole('parent')
    expect(useAppSessionStore.getState().accessToken).toBe('parent-token')

    useAppSessionStore.getState().setActiveRole('counselor')
    expect(useAppSessionStore.getState().accessToken).toBe('counselor-token')
  })

  it('rejects a token owner whose backend role does not match the target app', () => {
    const parentUser = createUser('PARENT', 'parent@example.com')
    const counselorUser = createUser('COUNSELOR', 'counselor@example.com')

    expect(isUserExpectedSessionRole(parentUser, 'parent')).toBe(true)
    expect(isUserExpectedSessionRole(counselorUser, 'parent')).toBe(false)
    expect(isUserExpectedSessionRole(counselorUser, 'counselor')).toBe(true)
    expect(isUserExpectedSessionRole(parentUser, 'counselor')).toBe(false)
  })

  it('infers the fallback session role from app-specific API paths', () => {
    expect(inferSessionRoleFromApiPath('/auth/api/v1/parents/children')).toBe(
      'parent',
    )
    expect(
      inferSessionRoleFromApiPath('/auth/api/v1/counselors/children'),
    ).toBe('counselor')
  })
})
