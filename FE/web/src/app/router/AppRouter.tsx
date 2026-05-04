import { useState } from 'react'

import AuthPage from '../../pages/auth/AuthPage'
import ChildDiaryListPage from '../../pages/child/ChildDiaryListPage'
import ChildSettingsPage from '../../pages/child/ChildSettingsPage'

type AppScreen = 'child' | 'auth'
type ChildPage = 'diary' | 'settings'

function AppRouter() {
  const [screen, setScreen] = useState<AppScreen>('child')
  const [currentPage, setCurrentPage] = useState<ChildPage>('diary')
  const [profileAddress, setProfileAddress] = useState('서울특별시 강남구 테헤란로 212')

  if (screen === 'auth') {
    return <AuthPage initialView="login" />
  }

  return (
    <main className="app-shell">
      <section className="phone-shell">
        {currentPage === 'diary' ? (
          <ChildDiaryListPage onOpenSettings={() => setCurrentPage('settings')} />
        ) : (
          <ChildSettingsPage
            profileAddress={profileAddress}
            onBack={() => setCurrentPage('diary')}
            onLogout={() => {
              sessionStorage.clear()
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              setCurrentPage('diary')
              setScreen('auth')
            }}
            onSaveProfileAddress={setProfileAddress}
          />
        )}
      </section>
    </main>
  )
}

export default AppRouter
