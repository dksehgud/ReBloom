import { useState } from 'react'
import '../../App.css'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'

type AuthView = 'landing' | 'login'

function AuthPage() {
  const [view, setView] = useState<AuthView>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <main className="app-shell">
      <section className={`phone-shell phone-shell--${view}`}>
        {view === 'landing' ? (
          <LandingPage onStart={() => setView('login')} />
        ) : (
          <LoginPage
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
          />
        )}
      </section>
    </main>
  )
}

export default AuthPage
