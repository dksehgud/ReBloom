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
import CounselorDashboardPage from '../../pages/counselor/CounselorDashboardPage'
import CounselorFindPasswordPage from '../../pages/counselor/CounselorFindPasswordPage'
import CounselorLoginPage from '../../pages/counselor/CounselorLoginPage'
import CounselorSettingsPage from '../../pages/counselor/CounselorSettingsPage'
import CounselorSignUpPage from '../../pages/counselor/CounselorSignUpPage'
import ParentHomePage from '../../pages/parent/ParentHomePage'
import ParentNotificationsPage from '../../pages/parent/ParentNotificationsPage'
import ParentObservationsPage from '../../pages/parent/ParentObservationsPage'
import ParentReportPage from '../../pages/parent/ParentReportPage'
import ParentSettingsPage from '../../pages/parent/ParentSettingsPage'
import { useAppSessionStore } from '../../features/auth/store/useAppSessionStore'
import { useSelectedChildStore } from '../../features/student/store/useSelectedChildStore'
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

function PhoneShell({ children, className }: PhoneShellProps) {
  return (
    <main className="app-shell">
      <section className={`phone-shell${className ? ` ${className}` : ''}`}>
        {children}
      </section>
    </main>
  )
}

function AuthRouteLayout() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  const phoneShellClassName = `phone-shell--auth${
    location.pathname === '/signup' ? ' phone-shell--signup' : ''
  }`

  useEffect(() => {
    setActiveRole(null)
    clearSelectedChild()
  }, [clearSelectedChild, setActiveRole])

  return (
    <PhoneShell className={phoneShellClassName}>
      <Outlet
        context={{
          email,
          password,
          setEmail,
          setPassword,
        }}
      />
    </PhoneShell>
  )
}

function CounselorAuthRouteLayout() {
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  useEffect(() => {
    setActiveRole(null)
    clearSelectedChild()
  }, [clearSelectedChild, setActiveRole])

  return <Outlet />
}

function CounselorRouteLayout() {
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  useEffect(() => {
    setActiveRole('counselor')
    clearSelectedChild()
  }, [clearSelectedChild, setActiveRole])

  return <Outlet />
}

function ChildRouteLayout() {
  const [profileAddress, setProfileAddress] = useState<ChildAddress>({
    baseAddress: '부산 해운대구 좌동순환로 212',
    detailAddress: '101동 1203호',
  })
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  useEffect(() => {
    setActiveRole('child')
    clearSelectedChild()
  }, [clearSelectedChild, setActiveRole])

  return <Outlet context={{ profileAddress, setProfileAddress }} />
}

function ParentRouteLayout() {
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

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

  return (
    <LoginPage
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onForgotPasswordClick={() => navigate('/find-password')}
      onSignUpClick={() => navigate('/signup')}
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
  const clearSession = useAppSessionStore((state) => state.clearSession)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  return (
    <PhoneShell>
      <ChildSettingsPage
        profileAddress={profileAddress}
        onBack={() => navigate('/child/diary')}
        onLogout={() => {
          clearSession()
          clearSelectedChild()
          navigate('/login', { replace: true })
        }}
        onSaveProfileAddress={setProfileAddress}
      />
    </PhoneShell>
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

      <Route element={<CounselorAuthRouteLayout />}>
        <Route path="/counselor" element={<Navigate replace to="/counselor/login" />} />
        <Route path="/counselor/login" element={<CounselorLoginPage />} />
        <Route path="/counselor/signup" element={<CounselorSignUpPage />} />
        <Route
          path="/counselor/find-password"
          element={<CounselorFindPasswordPage />}
        />
      </Route>

      <Route element={<CounselorRouteLayout />}>
        <Route path="/counselor/dashboard" element={<CounselorDashboardPage />} />
        <Route path="/counselor/settings" element={<CounselorSettingsPage />} />
      </Route>

      <Route path="/counselor/*" element={<Navigate replace to="/counselor/login" />} />

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

      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default AppRouter
