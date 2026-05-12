import { useEffect, useState, type ReactNode } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom'

import FindPasswordPage from '../../pages/auth/FindPasswordPage'
import LandingPage from '../../pages/auth/LandingPage'
import LoginPage from '../../pages/auth/LoginPage'
import SignUpPage from '../../pages/auth/SignUpPage'
import ChildDiaryListPage from '../../pages/child/ChildDiaryListPage'
import ChildSettingsPage from '../../pages/child/ChildSettingsPage'
import ParentHomePage from '../../pages/parent/ParentHomePage'
import ParentNotificationsPage from '../../pages/parent/ParentNotificationsPage'
import ParentObservationsPage from '../../pages/parent/ParentObservationsPage'
import ParentReportPage from '../../pages/parent/ParentReportPage'
import ParentSettingsPage from '../../pages/parent/ParentSettingsPage'
import { authApi, toAppRole } from '../../features/auth/api/authApi'
import { useAppSessionStore } from '../../features/auth/store/useAppSessionStore'
import { useSelectedChildStore } from '../../features/student/store/useSelectedChildStore'
import type { AppRole } from '../../shared/types/appRole'
import type { ChildAddress } from '../../shared/types/childAddress'

type AuthRouteContextValue = {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
}

type ChildRouteContextValue = {
  profileAddress: ChildAddress
  setProfileAddress: (address: ChildAddress) => void
}

type PhoneShellProps = {
  children: ReactNode
  className?: string
}

type PlaceholderRoutePageProps = {
  title: string
  description: string
  role: Exclude<AppRole, null>
}

function PhoneShell({ children, className }: PhoneShellProps) {
  return (
    <main className="app-shell">
      <section className={`phone-shell${className ? ` ${className}` : ''}`}>{children}</section>
    </main>
  )
}

function AuthRouteLayout() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore((state) => state.clearSelectedChild)

  const phoneShellClassName = `phone-shell--auth${
    location.pathname === '/signup' ? ' phone-shell--signup' : ''
  }`

  useEffect(() => {
    setActiveRole(null)
    clearSelectedChild()
  }, [clearSelectedChild, setActiveRole])

  return (
    <PhoneShell className={phoneShellClassName}>
      <Outlet context={{ email, password, setEmail, setPassword }} />
    </PhoneShell>
  )
}

function ChildRouteLayout() {
  const [profileAddress, setProfileAddress] = useState<ChildAddress>({
    baseAddress: '',
    detailAddress: '',
  })
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore((state) => state.clearSelectedChild)

  useEffect(() => {
    setActiveRole('child')
    clearSelectedChild()
  }, [clearSelectedChild, setActiveRole])

  return <Outlet context={{ profileAddress, setProfileAddress }} />
}

function ParentRouteLayout() {
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore((state) => state.clearSelectedChild)

  useEffect(() => {
    setActiveRole('parent')
    clearSelectedChild()
  }, [clearSelectedChild, setActiveRole])

  return (
    <PhoneShell>
      <Outlet />
    </PhoneShell>
  )
}

function useAuthRouteContext() {
  return useOutletContext<AuthRouteContextValue>()
}

function useChildRouteContext() {
  return useOutletContext<ChildRouteContextValue>()
}

function LandingRoute() {
  const navigate = useNavigate()

  return <LandingPage onStart={() => navigate('/login')} />
}

function LoginRoute() {
  const navigate = useNavigate()
  const { email, password, setEmail, setPassword } = useAuthRouteContext()
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const setCurrentUser = useAppSessionStore((state) => state.setCurrentUser)
  const setSessionTokens = useAppSessionStore((state) => state.setSessionTokens)
  const [loginError, setLoginError] = useState<string | undefined>()
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)

  const handleLoginSubmit = async () => {
    if (isLoginSubmitting) {
      return
    }

    try {
      setIsLoginSubmitting(true)
      setLoginError(undefined)

      const tokens = await authApi.login(email.trim().toLowerCase(), password)
      const myInfo = await authApi.getMyInfo(tokens.accessToken)
      const nextRole = toAppRole(myInfo.role)

      setSessionTokens(tokens)
      setActiveRole(nextRole)
      setCurrentUser(myInfo)

      if (nextRole === 'child') {
        navigate('/child/diary', { replace: true })
        return
      }

      if (nextRole === 'parent') {
        navigate('/parent/home', { replace: true })
        return
      }

      navigate('/counselor', { replace: true })
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.',
      )
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  return (
    <LoginPage
      email={email}
      error={loginError}
      isSubmitting={isLoginSubmitting}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onForgotPasswordClick={() => navigate('/find-password')}
      onSignUpClick={() => navigate('/signup')}
      onSubmit={handleLoginSubmit}
      onStartChildClick={() => navigate('/child/diary')}
      onStartParentClick={() => navigate('/parent/home')}
    />
  )
}

function FindPasswordRoute() {
  const navigate = useNavigate()
  const { email, setEmail, setPassword } = useAuthRouteContext()

  return (
    <FindPasswordPage
      initialEmail={email}
      onBackToLogin={() => navigate('/login')}
      onMoveToLogin={(nextEmail) => {
        setEmail(nextEmail)
        setPassword('')
        navigate('/login')
      }}
    />
  )
}

function SignUpRoute() {
  const navigate = useNavigate()

  return <SignUpPage onBackToLogin={() => navigate('/login')} />
}

function ChildDiaryRoute() {
  const navigate = useNavigate()

  return (
    <PhoneShell>
      <ChildDiaryListPage onOpenSettings={() => navigate('/child/settings')} />
    </PhoneShell>
  )
}

function ChildSettingsRoute() {
  const navigate = useNavigate()
  const { profileAddress, setProfileAddress } = useChildRouteContext()
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const clearSession = useAppSessionStore((state) => state.clearSession)
  const currentUser = useAppSessionStore((state) => state.currentUser)
  const setCurrentUser = useAppSessionStore((state) => state.setCurrentUser)
  const clearSelectedChild = useSelectedChildStore((state) => state.clearSelectedChild)

  useEffect(() => {
    if (!accessToken || currentUser) {
      return
    }

    void authApi.getMyInfo(accessToken).then(setCurrentUser).catch(() => {
      clearSession()
      navigate('/login', { replace: true })
    })
  }, [accessToken, clearSession, currentUser, navigate, setCurrentUser])

  const childProfileAddress: ChildAddress = {
    baseAddress: currentUser?.address ?? profileAddress.baseAddress,
    detailAddress: currentUser?.addressDetail ?? profileAddress.detailAddress,
    latitude: currentUser?.latitude ?? profileAddress.latitude,
    longitude: currentUser?.longitude ?? profileAddress.longitude,
  }

  return (
    <PhoneShell>
      <ChildSettingsPage
        profileAddress={childProfileAddress}
        profileEmail={currentUser?.email ?? ''}
        profileName={currentUser?.name ?? ''}
        onBack={() => navigate('/child/diary')}
        onLogout={() => {
          clearSession()
          clearSelectedChild()
          navigate('/login', { replace: true })
        }}
        onSaveProfileAddress={async (nextAddress) => {
          setProfileAddress(nextAddress)

          if (!accessToken) {
            return
          }

          const nextUser = await authApi.updateMyInfo(
            {
              address: nextAddress.baseAddress,
              addressDetail: nextAddress.detailAddress,
              latitude: nextAddress.latitude,
              longitude: nextAddress.longitude,
            },
            accessToken,
          )
          setCurrentUser(nextUser)
        }}
      />
    </PhoneShell>
  )
}

function PlaceholderRoutePage({ title, description, role }: PlaceholderRoutePageProps) {
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)

  useEffect(() => {
    setActiveRole(role)
  }, [role, setActiveRole])

  return (
    <main className="app-shell">
      <section className="phone-shell">
        <div
          style={{
            alignItems: 'center',
            color: '#4d3e3e',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            justifyContent: 'center',
            minHeight: '100svh',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '28px', margin: 0 }}>{title}</h1>
          <p style={{ lineHeight: 1.6, margin: 0, maxWidth: '280px' }}>{description}</p>
        </div>
      </section>
    </main>
  )
}

function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthRouteLayout />}>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/signup" element={<SignUpRoute />} />
        <Route path="/find-password" element={<FindPasswordRoute />} />
      </Route>

      <Route path="/child" element={<ChildRouteLayout />}>
        <Route index element={<Navigate replace to="/child/diary" />} />
        <Route path="diary" element={<ChildDiaryRoute />} />
        <Route path="settings" element={<ChildSettingsRoute />} />
      </Route>

      <Route path="/parent" element={<ParentRouteLayout />}>
        <Route index element={<Navigate replace to="/parent/home" />} />
        <Route path="home" element={<ParentHomePage />} />
        <Route path="observations" element={<ParentObservationsPage />} />
        <Route path="report" element={<ParentReportPage />} />
        <Route path="notifications" element={<ParentNotificationsPage />} />
        <Route path="settings" element={<ParentSettingsPage />} />
        <Route path="*" element={<Navigate replace to="/parent/home" />} />
      </Route>

      <Route
        path="/counselor/*"
        element={
          <PlaceholderRoutePage
            title="상담사 대시보드"
            description="상담사 화면 구현 전에 공통 구조를 먼저 정리한 상태입니다."
            role="counselor"
          />
        }
      />

      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default AppRouter
