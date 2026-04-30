import './App.css'
import { useState } from 'react'

import ChildDiaryListPage from './pages/child/ChildDiaryListPage'
import ChildSettingsPage from './pages/child/ChildSettingsPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'diary' | 'settings'>('diary')

  return (
    <main className="app-shell">
      <section className="phone-shell">
        {currentPage === 'diary' ? (
          <ChildDiaryListPage onOpenSettings={() => setCurrentPage('settings')} />
        ) : (
          <ChildSettingsPage onBack={() => setCurrentPage('diary')} />
        )}
      </section>
    </main>
  )
}

export default App
