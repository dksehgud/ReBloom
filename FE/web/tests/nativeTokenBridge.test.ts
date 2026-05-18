import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearNativeNavigationHistory,
  saveNativeAccessToken,
} from '../src/shared/utils/nativeTokenBridge'

describe('native token bridge FCM registration gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the access token to the Android bridge for child and parent sessions', () => {
    const saveToken = vi.fn()

    vi.stubGlobal('window', { Android: { saveToken } })

    saveNativeAccessToken('child-access-token', 'child')
    saveNativeAccessToken('parent-access-token', 'parent')

    expect(saveToken).toHaveBeenNthCalledWith(1, 'child-access-token')
    expect(saveToken).toHaveBeenNthCalledWith(2, 'parent-access-token')
  })

  it('does not request native FCM registration for unsupported roles', () => {
    const saveToken = vi.fn()

    vi.stubGlobal('window', { Android: { saveToken } })

    saveNativeAccessToken('counselor-access-token', 'counselor')
    saveNativeAccessToken('unknown-access-token')

    expect(saveToken).not.toHaveBeenCalled()
  })

  it('requests native WebView history cleanup after authenticated navigation', () => {
    const clearHistory = vi.fn()

    vi.stubGlobal('window', { Android: { clearHistory } })

    clearNativeNavigationHistory()

    expect(clearHistory).toHaveBeenCalledOnce()
  })
})
