import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import './App.css'
import AppRouter from './app/router/AppRouter'
import { resolveShellMode } from './shared/utils/shellMode'

function App() {
  const location = useLocation()
  const shellMode = resolveShellMode(location.search)

  useEffect(() => {
    window.__REBLOOM_SHELL_MODE__ = shellMode
    document.documentElement.dataset.shellMode = shellMode
    document.body.dataset.shellMode = shellMode

    return () => {
      delete document.documentElement.dataset.shellMode
      delete document.body.dataset.shellMode
    }
  }, [shellMode])

  useEffect(() => {
    if (shellMode !== 'webview') {
      document.documentElement.style.removeProperty('--app-viewport-height')
      return
    }

    const visualViewport = window.visualViewport
    const updateViewportHeight = () => {
      const viewportHeight = visualViewport?.height ?? window.innerHeight

      document.documentElement.style.setProperty(
        '--app-viewport-height',
        `${Math.round(viewportHeight)}px`,
      )
    }

    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)
    visualViewport?.addEventListener('resize', updateViewportHeight)

    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
      visualViewport?.removeEventListener('resize', updateViewportHeight)
      document.documentElement.style.removeProperty('--app-viewport-height')
    }
  }, [shellMode])

  return <AppRouter />
}

export default App
