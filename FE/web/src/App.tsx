import './App.css'
import { useState } from 'react'

import ChildDiaryListPage from './pages/child/ChildDiaryListPage'
import ChildSettingsPage from './pages/child/ChildSettingsPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'diary' | 'settings'>('diary')
  const [profileAddress, setProfileAddress] = useState('서울특별시 강남구 테헤란로 212')

  return (
    <main className="app-shell">
      <section className="phone-shell">
        {currentPage === 'diary' ? (
          <ChildDiaryListPage onOpenSettings={() => setCurrentPage('settings')} />
        ) : (
          <ChildSettingsPage
            profileAddress={profileAddress}
            onBack={() => setCurrentPage('diary')}
            onSaveProfileAddress={setProfileAddress}
          />
        )}
      </section>
    </main>
  )
}

export default App
