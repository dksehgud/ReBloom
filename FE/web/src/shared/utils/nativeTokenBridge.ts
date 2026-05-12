type AndroidTokenBridge = {
  clearToken?: () => void
  saveToken?: (token: string) => void
}

declare global {
  interface Window {
    Android?: AndroidTokenBridge
  }
}

function saveNativeAccessToken(accessToken: string) {
  window.Android?.saveToken?.(accessToken)
}

function clearNativeAccessToken() {
  window.Android?.clearToken?.()
}

export { clearNativeAccessToken, saveNativeAccessToken }
