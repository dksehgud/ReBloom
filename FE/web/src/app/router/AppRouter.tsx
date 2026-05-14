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
import { authApi, toAppRole } from '../../features/auth/api/authApi'
import { consumeOAuthIntent, saveOAuthIntent } from '../../features/auth/oauth/oauthIntent'
import { useAppSessionStore } from '../../features/auth/store/useAppSessionStore'
import { isCounselorMockModeSearch } from '../../features/counselor/hooks/useCounselorMockMode'
import { useSelectedChildStore } from '../../features/student/store/useSelectedChildStore'
import type { ChildAddress } from '../../shared/types/childAddress'
import {
  clearNativeAccessToken,
  saveNativeAccessToken,
} from '../../shared/utils/nativeTokenBridge'

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
      <Outlet context={{ email, password, setEmail, setPassword }} />
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
  const location = useLocation()
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )
  const isMockMode = isCounselorMockModeSearch(location.search)

  useEffect(() => {
    if (!accessToken && !isMockMode) {
      setActiveRole(null)
      clearSelectedChild()
      return
    }

    setActiveRole('counselor')
    clearSelectedChild()
  }, [accessToken, clearSelectedChild, isMockMode, setActiveRole])

  if (!accessToken && !isMockMode) {
    return <Navigate replace to="/counselor/login" />
  }

  return <Outlet />
}

function ChildRouteLayout() {
  const [profileAddress, setProfileAddress] = useState<ChildAddress>({
    baseAddress: '',
    detailAddress: '',
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
      saveNativeAccessToken(tokens.accessToken)
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

  const handleSocialLogin = (provider: 'google' | 'kakao') => {
    saveOAuthIntent('default')
    authApi.beginOAuthLogin(provider)
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
      onSocialLoginClick={handleSocialLogin}
    />
  )
}

function OAuthCallbackRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const clearSession = useAppSessionStore((state) => state.clearSession)
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const setCurrentUser = useAppSessionStore((state) => state.setCurrentUser)
  const setSessionTokens = useAppSessionStore((state) => state.setSessionTokens)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const status = searchParams.get('status')

    if (status === 'LOGIN') {
      const accessToken = searchParams.get('accessToken')
      const refreshToken = searchParams.get('refreshToken')

      if (!accessToken || !refreshToken) {
        clearSession()
        navigate('/login', { replace: true })
        return
      }

      setSessionTokens({ accessToken, refreshToken })
      saveNativeAccessToken(accessToken)

      void authApi.getMyInfo(accessToken)
        .then((myInfo) => {
          const nextRole = toAppRole(myInfo.role)

          setCurrentUser(myInfo)
          setActiveRole(nextRole)
          clearSelectedChild()

          if (nextRole === 'child') {
            navigate('/child/diary', { replace: true })
            return
          }

          if (nextRole === 'parent') {
            navigate('/parent/home', { replace: true })
            return
          }

          navigate('/counselor/dashboard', { replace: true })
        })
        .catch(() => {
          clearSession()
          clearNativeAccessToken()
          navigate('/login', { replace: true })
        })
      return
    }

    if (status === 'SIGNUP_REQUIRED') {
      const registerUUID = searchParams.get('registerUUID')
      const email = searchParams.get('email')
      const intent = consumeOAuthIntent()

      if (!registerUUID || !email) {
        navigate('/login', { replace: true })
        return
      }

      const signupSearchParams = new URLSearchParams({
        registerUUID,
        email,
      })

      navigate(
        intent === 'counselor'
          ? `/counselor/signup?${signupSearchParams.toString()}`
          : `/signup?${signupSearchParams.toString()}`,
        { replace: true },
      )
      return
    }

    navigate('/login', { replace: true })
  }, [
    clearSelectedChild,
    clearSession,
    location.search,
    navigate,
    setActiveRole,
    setCurrentUser,
    setSessionTokens,
  ])

  return null
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
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  useEffect(() => {
    if (!accessToken || currentUser) {
      return
    }

    void authApi.getMyInfo(accessToken).then(setCurrentUser).catch(() => {
      clearSession()
      clearNativeAccessToken()
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
          clearNativeAccessToken()
          clearSelectedChild()
          navigate('/login', { replace: true })
        }}
        onVerifyCurrentPassword={async (password) => {
          if (!accessToken) {
            throw new Error('로그인이 필요합니다.')
          }

          await authApi.verifyPassword(password, accessToken)
        }}
        onChangePassword={async (payload) => {
          if (!accessToken) {
            throw new Error('로그인이 필요합니다.')
          }

          await authApi.changePassword(payload, accessToken)
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

function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthRouteLayout />}>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/oauth/callback" element={<OAuthCallbackRoute />} />
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
