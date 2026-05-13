import type { FormEvent } from 'react'
import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'

import googleLogo from '../../assets/google-logo.svg'
import kakaoLogo from '../../assets/kakao-logo.svg'
import AuthInput from '../../components/auth/AuthInput'
import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'
import { authApi, toAppRole } from '../../features/auth/api/authApi'
import { useAppSessionStore } from '../../features/auth/store/useAppSessionStore'
import { useSelectedChildStore } from '../../features/student/store/useSelectedChildStore'

function CounselorLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loginError, setLoginError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const clearSession = useAppSessionStore((state) => state.clearSession)
  const setActiveRole = useAppSessionStore((state) => state.setActiveRole)
  const setCurrentUser = useAppSessionStore((state) => state.setCurrentUser)
  const setSessionTokens = useAppSessionStore((state) => state.setSessionTokens)
  const clearSelectedChild = useSelectedChildStore(
    (state) => state.clearSelectedChild,
  )

  const isSubmitEnabled = email.trim().length > 0 && password.trim().length > 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isSubmitEnabled || isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      setLoginError(undefined)

      const tokens = await authApi.login(email.trim().toLowerCase(), password)
      const myInfo = await authApi.getMyInfo(tokens.accessToken)
      const nextRole = toAppRole(myInfo.role)

      if (nextRole !== 'counselor') {
        clearSession()
        throw new Error('상담사 계정으로 로그인해 주세요.')
      }

      setSessionTokens(tokens)
      setCurrentUser(myInfo)
      setActiveRole('counselor')
      clearSelectedChild()
      navigate('/counselor/dashboard', { replace: true })
    } catch (error) {
      clearSession()
      setLoginError(
        error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CounselorAuthLayout title="로그인" description="Sign in">
      <div className="counselor-login">
        <form className="counselor-login-form" onSubmit={handleSubmit}>
          <AuthInput
            label="이메일"
            type="email"
            placeholder="이메일"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <AuthInput
            label="비밀번호"
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            action={
              <button
                type="button"
                className="counselor-password-toggle"
                aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                onClick={() => setIsPasswordVisible((prev) => !prev)}
              >
                {isPasswordVisible ? <FiEye /> : <FiEyeOff />}
              </button>
            }
          />

          <div className="counselor-login-links">
            <Link to="/counselor/find-password" className="counselor-auth-link">
              비밀번호 찾기
            </Link>
          </div>

          <button
            type="submit"
            className="counselor-auth-button counselor-auth-button--primary"
            disabled={!isSubmitEnabled || isSubmitting}
          >
            {isSubmitting ? '로그인 중' : '로그인'}
          </button>
        </form>

        {loginError ? <p className="field-error">{loginError}</p> : null}

        <div className="counselor-social-divider" aria-hidden="true">
          <span />
          <p>Or with</p>
          <span />
        </div>

        <div className="counselor-social-buttons">
          <button
            type="button"
            className="counselor-social-icon-button counselor-social-icon-button--kakao"
            aria-label="카카오 로그인"
          >
            <img src={kakaoLogo} alt="" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="counselor-social-icon-button counselor-social-icon-button--google"
            aria-label="구글 로그인"
          >
            <img src={googleLogo} alt="" aria-hidden="true" />
          </button>
        </div>

        <p className="counselor-auth-inline-copy">
          계정이 없으신가요?{' '}
          <Link to="/counselor/signup" className="counselor-auth-link">
            회원가입
          </Link>
        </p>
      </div>
    </CounselorAuthLayout>
  )
}

export default CounselorLoginPage
