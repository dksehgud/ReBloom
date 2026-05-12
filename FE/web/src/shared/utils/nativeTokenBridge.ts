declare global {
  interface Window {
    Android?: {
      saveToken?: (token: string) => void
      clearToken?: () => void
    }
  }
}

function saveNativeAccessToken(accessToken: string | null | undefined) {
  if (!accessToken || typeof window === 'undefined') {
    return
  }

  window.Android?.saveToken?.(accessToken)
}

function clearNativeAccessToken() {
  if (typeof window === 'undefined') {
    return
  }

  window.Android?.clearToken?.()
}

export { clearNativeAccessToken, saveNativeAccessToken }
