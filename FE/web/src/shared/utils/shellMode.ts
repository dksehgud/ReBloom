type ShellMode = 'preview' | 'webview'

declare global {
  interface Window {
    __REBLOOM_SHELL_MODE__?: ShellMode
  }
}

const SHELL_MODE_STORAGE_KEY = 'rebloom-shell-mode'

function resolveShellMode(search: string): ShellMode {
  const searchParams = new URLSearchParams(search)
  const queryMode = searchParams.get('mode')

  if (queryMode === 'webview') {
    return 'webview'
  }

  if (queryMode === 'preview') {
    return 'preview'
  }

  if (typeof window !== 'undefined') {
    if (window.__REBLOOM_SHELL_MODE__ === 'webview') {
      return 'webview'
    }

    if (window.__REBLOOM_SHELL_MODE__ === 'preview') {
      return 'preview'
    }

    try {
      const storedMode = window.localStorage.getItem(SHELL_MODE_STORAGE_KEY)

      if (storedMode === 'webview') {
        return 'webview'
      }

      if (storedMode === 'preview') {
        return 'preview'
      }
    } catch {
      return 'preview'
    }
  }

  return 'preview'
}

export { resolveShellMode, type ShellMode }
