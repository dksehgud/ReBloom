import type { FormEvent } from 'react'

import googleLogo from '../../assets/google-logo.svg'
import kakaoLogo from '../../assets/kakao-logo.svg'

type LoginPageProps = {
  email: string
  password: string
  error?: string
  isSubmitting?: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onForgotPasswordClick: () => void
  onSignUpClick: () => void
  onSubmit: () => void
  onStartChildClick: () => void
  onStartParentClick: () => void
  onSocialLoginClick: (provider: 'google' | 'kakao') => void
}

function LoginPage({
  email,
  password,
  error,
  isSubmitting = false,
  onEmailChange,
  onPasswordChange,
  onForgotPasswordClick,
  onSignUpClick,
  onSubmit,
  onStartChildClick,
  onStartParentClick,
  onSocialLoginClick,
}: LoginPageProps) {
  const isLoginEnabled = email.trim().length > 0 && password.trim().length > 0

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="login-screen" aria-label="로그인 화면">
      <header className="login-header">
        <h1>로그인</h1>
      </header>

      <form className="login-form" onSubmit={handleLoginSubmit}>
        <label className="field">
          <span className="sr-only">이메일</span>
          <input
            type="email"
            placeholder="이메일"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="sr-only">비밀번호</span>
          <input
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="text-link password-link"
          onClick={onForgotPasswordClick}
        >
          비밀번호 찾기
        </button>

        <button
          type="submit"
          className="primary-button login-button"
          disabled={!isLoginEnabled || isSubmitting}
        >
          {isSubmitting ? '로그인 중' : '로그인'}
        </button>
      </form>

      {error ? <p className="field-error">{error}</p> : null}

      <div className="mock-entry-section" aria-label="개발용 빠른 진입">
        <p className="mock-entry-title">API 연동 전 임시 진입</p>
        <div className="mock-entry-actions">
          <button
            type="button"
            className="auth-button is-secondary mock-entry-button"
            onClick={onStartChildClick}
          >
            아이로 시작
          </button>
          <button
            type="button"
            className="auth-button is-primary mock-entry-button"
            onClick={onStartParentClick}
          >
            부모로 시작
          </button>
        </div>
      </div>

      <div className="social-login">
        <div className="social-divider" aria-hidden="true">
          <span />
          <p>Or with</p>
          <span />
        </div>
        <div className="social-buttons">
          <button
            type="button"
            className="social-icon-button social-icon-button--kakao"
            onClick={() => onSocialLoginClick('kakao')}
            aria-label="카카오 로그인"
          >
            <img src={kakaoLogo} alt="" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="social-icon-button social-icon-button--google"
            onClick={() => onSocialLoginClick('google')}
            aria-label="구글 로그인"
          >
            <img src={googleLogo} alt="" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="signup-copy">
        계정이 없으신가요?{' '}
        <button
          type="button"
          className="text-link signup-link"
          onClick={onSignUpClick}
        >
          회원가입
        </button>
      </p>
    </section>
  )
}

export default LoginPage
