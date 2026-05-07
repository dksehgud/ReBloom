import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import './App.css'
import AppRouter from './app/router/AppRouter'
import { resolveShellMode } from './shared/utils/shellMode'

function App() {
  const location = useLocation()

  useEffect(() => {
    const shellMode = resolveShellMode(location.search)

    window.__REBLOOM_SHELL_MODE__ = shellMode
    document.documentElement.dataset.shellMode = shellMode
    document.body.dataset.shellMode = shellMode

    return () => {
      delete document.documentElement.dataset.shellMode
      delete document.body.dataset.shellMode
    }
  }, [location.search])

  return <AppRouter />
}

export default App
