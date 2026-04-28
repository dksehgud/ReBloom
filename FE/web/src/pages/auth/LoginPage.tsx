import type { FormEvent } from 'react'

import googleLogo from '../../assets/google-logo.svg'
import kakaoLogo from '../../assets/kakao-logo.svg'

type LoginPageProps = {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onForgotPasswordClick: () => void
  onSignUpClick: () => void
}

function LoginPage({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onForgotPasswordClick,
  onSignUpClick,
}: LoginPageProps) {
  const isLoginEnabled = email.trim().length > 0 && password.trim().length > 0

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
          disabled={!isLoginEnabled}
        >
          로그인
        </button>
      </form>

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
            aria-label="카카오 로그인"
          >
            <img src={kakaoLogo} alt="" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="social-icon-button social-icon-button--google"
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
