import { useState } from 'react'

import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import SignUpPage from './SignUpPage'

type AuthView = 'landing' | 'login' | 'signup'

function AuthPage() {
  const [view, setView] = useState<AuthView>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <main className="app-shell">
      <section className={`phone-shell phone-shell--${view}`}>
        {view === 'landing' ? (
          <LandingPage onStart={() => setView('login')} />
        ) : view === 'login' ? (
          <LoginPage
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSignUpClick={() => setView('signup')}
          />
        ) : (
          <SignUpPage onBackToLogin={() => setView('login')} />
        )}
      </section>
    </main>
  )
}

export default AuthPage
