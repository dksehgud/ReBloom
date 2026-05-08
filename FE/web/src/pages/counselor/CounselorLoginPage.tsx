import type { FormEvent } from 'react'
import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Link } from 'react-router-dom'

import googleLogo from '../../assets/google-logo.svg'
import AuthInput from '../../components/auth/AuthInput'
import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

function CounselorLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const isSubmitEnabled = email.trim().length > 0 && password.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
                {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
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
            disabled={!isSubmitEnabled}
          >
            로그인
          </button>
        </form>

        <div className="counselor-social-divider" aria-hidden="true">
          <span />
          <p>Or with</p>
          <span />
        </div>

        <button type="button" className="counselor-social-button">
          <img src={googleLogo} alt="" aria-hidden="true" />
          <span>Continue with Google</span>
        </button>

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
