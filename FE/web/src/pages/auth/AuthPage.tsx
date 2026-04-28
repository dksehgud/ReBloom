import { useState } from 'react'

import FindPasswordPage from './FindPasswordPage'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import SignUpPage from './SignUpPage'

type AuthView = 'landing' | 'login' | 'signup' | 'find-password'

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
            onForgotPasswordClick={() => setView('find-password')}
            onSignUpClick={() => setView('signup')}
          />
        ) : view === 'find-password' ? (
          <FindPasswordPage
            onBackToLogin={() => setView('login')}
            onMoveToLogin={(nextEmail) => {
              setEmail(nextEmail)
              setPassword('')
              setView('login')
            }}
          />
        ) : (
          <SignUpPage onBackToLogin={() => setView('login')} />
        )}
      </section>
    </main>
  )
}

export default AuthPage
