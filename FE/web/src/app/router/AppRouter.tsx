import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {Navigate, Outlet, Route, Routes, useLocation, useNavigate, useOutletContext,} from 'react-router-dom'

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
import {authApi, toAppRole} from '../../features/auth/api/authApi'
import {consumeOAuthIntent, saveOAuthIntent} from '../../features/auth/oauth/oauthIntent'
import {isUserExpectedSessionRole, type SessionRole,} from '../../features/auth/session/appSessionStorage'
import {useAppSessionStore} from '../../features/auth/store/useAppSessionStore'
import {isCounselorMockModeSearch} from '../../features/counselor/hooks/useCounselorMockMode'
import {isParentMockModeSearch} from '../../features/guardian/hooks/useParentMockMode'
import {useSelectedChildStore} from '../../features/student/store/useSelectedChildStore'
import {
  getChildDiaryNotificationSettings,
  updateChildDiaryNotificationSettings,
} from '../../features/notification/api/childNotificationSettingsApi'
import {type ChildConnectedCounselor, getChildConnectedCounselor,} from '../../features/user/api/childRelationApi'
import type {DiaryNotificationSettings} from '../../features/user/types/diaryNotificationSettings'
import type {ChildAddress} from '../../shared/types/childAddress'
import {
  clearNativeAccessToken,
  requestNativeSleepPermission,
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

function PhoneShell({children, className}: PhoneShellProps) {
    return (
        <main className="app-shell">
            <section className={`phone-shell${className ? ` ${className}` : ''}`}>
                {children}
            </section>
        </main>
    )
}

type RoleGuardStatus = 'allowed' | 'blocked' | 'checking'

function useRoleRouteGuard(
    expectedRole: SessionRole,
    isMockMode: boolean,
): RoleGuardStatus {
    const activeAccessToken = useAppSessionStore((state) => state.accessToken)
    const activeRole = useAppSessionStore((state) => state.activeRole)
    const roleSession = useAppSessionStore((state) => state.sessions[expectedRole])
    const clearSession = useAppSessionStore((state) => state.clearSession)
    const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
    const setCurrentUser = useAppSessionStore((state) => state.setCurrentUser)
    const clearSelectedChild = useSelectedChildStore(
        (state) => state.clearSelectedChild,
    )

    useEffect(() => {
        let isCanceled = false

        if (isMockMode) {
            setActiveRole(expectedRole)
            clearSelectedChild()
            return () => {
                isCanceled = true
            }
        }

        if (!roleSession.accessToken) {
            if (activeRole === expectedRole) {
                setActiveRole(null)
                clearSelectedChild()
            }
            return () => {
                isCanceled = true
            }
        }

        const allowRoleSession = () => {
            if (isCanceled) {
                return
            }

            setActiveRole(expectedRole)
            clearSelectedChild()
            saveNativeAccessToken(roleSession.accessToken ?? '')
        }

        const blockRoleSession = () => {
            if (isCanceled) {
                return
            }

            clearSession(expectedRole)
            if (activeRole === expectedRole) {
                clearNativeAccessToken()
            }
        }

        if (roleSession.currentUser) {
            if (isUserExpectedSessionRole(roleSession.currentUser, expectedRole)) {
                allowRoleSession()
            } else {
                blockRoleSession()
            }

            return () => {
                isCanceled = true
            }
        }

        void authApi
            .getMyInfo(roleSession.accessToken)
            .then((myInfo) => {
                if (!isUserExpectedSessionRole(myInfo, expectedRole)) {
                    blockRoleSession()
                    return
                }

                setCurrentUser(myInfo, expectedRole)
                allowRoleSession()
            })
            .catch(blockRoleSession)

        return () => {
            isCanceled = true
        }
    }, [
        activeRole,
        clearSelectedChild,
        clearSession,
        expectedRole,
        isMockMode,
        roleSession.accessToken,
        roleSession.currentUser,
        setActiveRole,
        setCurrentUser,
    ])

    if (isMockMode) {
        return activeRole === expectedRole ? 'allowed' : 'checking'
    }

    if (!roleSession.accessToken) {
        return 'blocked'
    }

    if (!roleSession.currentUser) {
        return 'checking'
    }

    if (!isUserExpectedSessionRole(roleSession.currentUser, expectedRole)) {
        return 'blocked'
    }

    return activeRole === expectedRole &&
    activeAccessToken === roleSession.accessToken
        ? 'allowed'
        : 'checking'
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
            <Outlet context={{email, password, setEmail, setPassword}}/>
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

    return <Outlet/>
}

function CounselorRouteLayout() {
    const location = useLocation()
    const isMockMode = isCounselorMockModeSearch(location.search)
    const guardStatus = useRoleRouteGuard('counselor', isMockMode)

    if (guardStatus === 'blocked') {
        return <Navigate replace to="/counselor/login"/>
    }

    if (guardStatus !== 'allowed') {
        return null
    }

    return <Outlet/>
}

function ChildRouteLayout() {
    const [profileAddress, setProfileAddress] = useState<ChildAddress>({
        baseAddress: '',
        detailAddress: '',
    })
    const guardStatus = useRoleRouteGuard('child', false)

    if (guardStatus === 'blocked') {
        return <Navigate replace to="/login"/>
    }

    if (guardStatus !== 'allowed') {
        return null
    }

    return <Outlet context={{profileAddress, setProfileAddress}}/>
}

function ParentRouteLayout() {
    const location = useLocation()
    const isMockMode = isParentMockModeSearch(location.search)
    const guardStatus = useRoleRouteGuard('parent', isMockMode)

    if (guardStatus === 'blocked') {
        return <Navigate replace to="/login"/>
    }

    if (guardStatus !== 'allowed') {
        return null
    }

    return (
        <PhoneShell>
            <Outlet/>
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

    return <LandingPage onStart={() => navigate('/login')}/>
}

function LoginRoute() {
    const navigate = useNavigate()
    const {email, password, setEmail, setPassword} = useAuthRouteContext()
    const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
    const setRoleSession = useAppSessionStore((state) => state.setRoleSession)
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

            setRoleSession(nextRole, {
                accessToken: tokens.accessToken,
                currentUser: myInfo,
                refreshToken: tokens.refreshToken,
            })
            saveNativeAccessToken(tokens.accessToken)
            setActiveRole(nextRole)

            if (nextRole === 'child') {
                requestNativeSleepPermission()
                navigate('/child/diary', {replace: true})
                return
            }

            if (nextRole === 'parent') {
                navigate('/parent/home', {replace: true})
                return
            }

            navigate('/counselor', {replace: true})
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
            onStartParentClick={() => navigate('/parent/home?mock=1')}
            onSocialLoginClick={handleSocialLogin}
        />
    )
}

function OAuthCallbackRoute() {
    const navigate = useNavigate()
    const location = useLocation()
    const clearSession = useAppSessionStore((state) => state.clearSession)
    const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
    const setRoleSession = useAppSessionStore((state) => state.setRoleSession)
    const clearSelectedChild = useSelectedChildStore(
        (state) => state.clearSelectedChild,
    )

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const status = searchParams.get('status')
        const intent = consumeOAuthIntent()

        if (status === 'LOGIN') {
            const accessToken = searchParams.get('accessToken')
            const refreshToken = searchParams.get('refreshToken')

            if (!accessToken || !refreshToken) {
                clearSession()
                navigate('/login', {replace: true})
                return
            }

            void authApi.getMyInfo(accessToken)
                .then((myInfo) => {
                    const nextRole = toAppRole(myInfo.role)

                    if (intent === 'counselor' && nextRole !== 'counselor') {
                        clearSession(nextRole)
                        clearNativeAccessToken()
                        navigate('/counselor/login?oauthRoleMismatch=1', {replace: true})
                        return
                    }

                    setRoleSession(nextRole, {
                        accessToken,
                        currentUser: myInfo,
                        refreshToken,
                    })
                    saveNativeAccessToken(accessToken)
                    setActiveRole(nextRole)
                    clearSelectedChild()

                    if (nextRole === 'child') {
                        requestNativeSleepPermission()
                        navigate('/child/diary', {replace: true})
                        return
                    }

                    if (nextRole === 'parent') {
                        navigate('/parent/home', {replace: true})
                        return
                    }

                    navigate('/counselor/dashboard', {replace: true})
                })
                .catch(() => {
                    clearSession()
                    clearNativeAccessToken()
                    navigate('/login', {replace: true})
                })
            return
        }

        if (status === 'SIGNUP_REQUIRED') {
            const registerUUID = searchParams.get('registerUUID')
            const email = searchParams.get('email')

            if (!registerUUID || !email) {
                navigate('/login', {replace: true})
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
                {replace: true},
            )
            return
        }

        navigate('/login', {replace: true})
    }, [
        clearSelectedChild,
        clearSession,
        location.search,
        navigate,
        setActiveRole,
        setRoleSession,
    ])

    return null
}

function FindPasswordRoute() {
    const navigate = useNavigate()
    const {email, setEmail, setPassword} = useAuthRouteContext()

    return (
        <FindPasswordPage
            initialEmail={email}
            onRequestTemporaryPassword={authApi.resetPassword}
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

    return <SignUpPage onBackToLogin={() => navigate('/login')}/>
}

function ChildDiaryRoute() {
    const navigate = useNavigate()
    const currentUserId = useAppSessionStore(
        (state) => state.currentUser?.userId ?? null,
    )

    return (
        <PhoneShell>
            <ChildDiaryListPage
                key={currentUserId ?? 'anonymous-child'}
                onOpenSettings={() => navigate('/child/settings')}
            />
        </PhoneShell>
    )
}

function ChildSettingsRoute() {
    const navigate = useNavigate()
    const {profileAddress, setProfileAddress} = useChildRouteContext()
    const accessToken = useAppSessionStore((state) => state.accessToken)
    const clearSession = useAppSessionStore((state) => state.clearSession)
    const currentUser = useAppSessionStore((state) => state.currentUser)
    const setCurrentUser = useAppSessionStore((state) => state.setCurrentUser)
    const [connectedCounselor, setConnectedCounselor] =
        useState<ChildConnectedCounselor | null>(null)
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
            navigate('/login', {replace: true})
        })
    }, [accessToken, clearSession, currentUser, navigate, setCurrentUser])

    useEffect(() => {
        if (!accessToken) {
            return
        }

        void getChildConnectedCounselor(accessToken)
            .then(setConnectedCounselor)
            .catch(() => setConnectedCounselor(null))
    }, [accessToken])

    const visibleConnectedCounselor = accessToken ? connectedCounselor : null

    const childProfileAddress: ChildAddress = {
        baseAddress: currentUser?.address ?? profileAddress.baseAddress,
        detailAddress: currentUser?.addressDetail ?? profileAddress.detailAddress,
        latitude: currentUser?.latitude ?? profileAddress.latitude,
        longitude: currentUser?.longitude ?? profileAddress.longitude,
    }

    const handleLoadNotificationSettings = useCallback(async () => {
        if (!accessToken) {
            throw new Error('로그인이 필요합니다.')
        }

        return getChildDiaryNotificationSettings(accessToken)
    }, [accessToken])

    const handleSaveNotificationSettings = useCallback(
        async (settings: DiaryNotificationSettings) => {
            if (!accessToken) {
                throw new Error('로그인이 필요합니다.')
            }

            return updateChildDiaryNotificationSettings(settings, accessToken)
        },
        [accessToken],
    )

    return (
        <PhoneShell>
            <ChildSettingsPage
                profileAddress={childProfileAddress}
                profileEmail={currentUser?.email ?? ''}
                profileName={currentUser?.name ?? ''}
                counselorName={
                    visibleConnectedCounselor?.connected
                        ? `${visibleConnectedCounselor.name ?? ''} 상담사`.trim()
                        : null
                }
                counselorSubtitle={
                    visibleConnectedCounselor?.connected
                        ? visibleConnectedCounselor.email
                        : null
                }
                onBack={() => navigate('/child/diary')}
                onLoadNotificationSettings={
                    accessToken ? handleLoadNotificationSettings : undefined
                }
                onLogout={() => {
                    clearSession()
                    clearNativeAccessToken()
                    clearSelectedChild()
                    navigate('/login', {replace: true})
                }}
                onSaveNotificationSettings={
                    accessToken ? handleSaveNotificationSettings : undefined
                }
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
            <Route element={<AuthRouteLayout/>}>
                <Route path="/" element={<LandingRoute/>}/>
                <Route path="/login" element={<LoginRoute/>}/>
                <Route path="/oauth/callback" element={<OAuthCallbackRoute/>}/>
                <Route path="/signup" element={<SignUpRoute/>}/>
                <Route path="/find-password" element={<FindPasswordRoute/>}/>
            </Route>

            <Route element={<CounselorAuthRouteLayout/>}>
                <Route path="/counselor" element={<Navigate replace to="/counselor/login"/>}/>
                <Route path="/counselor/login" element={<CounselorLoginPage/>}/>
                <Route path="/counselor/signup" element={<CounselorSignUpPage/>}/>
                <Route
                    path="/counselor/find-password"
                    element={<CounselorFindPasswordPage/>}
                />
            </Route>

            <Route element={<CounselorRouteLayout/>}>
                <Route path="/counselor/dashboard" element={<CounselorDashboardPage/>}/>
                <Route path="/counselor/settings" element={<CounselorSettingsPage/>}/>
            </Route>

            <Route path="/counselor/*" element={<Navigate replace to="/counselor/login"/>}/>

            <Route path="/child" element={<ChildRouteLayout/>}>
                <Route index element={<Navigate replace to="/child/diary"/>}/>
                <Route path="diary" element={<ChildDiaryRoute/>}/>
                <Route path="settings" element={<ChildSettingsRoute/>}/>
            </Route>

            <Route path="/parent" element={<ParentRouteLayout/>}>
                <Route index element={<Navigate replace to="/parent/home"/>}/>
                <Route path="home" element={<ParentHomePage/>}/>
                <Route path="observations" element={<ParentObservationsPage/>}/>
                <Route path="report" element={<ParentReportPage/>}/>
                <Route path="notifications" element={<ParentNotificationsPage/>}/>
                <Route path="settings" element={<ParentSettingsPage/>}/>
                <Route path="*" element={<Navigate replace to="/parent/home"/>}/>
            </Route>

            <Route path="*" element={<Navigate replace to="/"/>}/>
        </Routes>
    )
}

export default AppRouter
