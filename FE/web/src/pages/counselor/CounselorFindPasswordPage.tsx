import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import AuthInput from '../../components/auth/AuthInput'
import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'
import { authApi } from '../../features/auth/api/authApi'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function CounselorFindPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [emailError, setEmailError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()
  const isSubmitEnabled = normalizedEmail.length > 0

  const sendTemporaryPassword = async () => {
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailError('올바른 이메일 형식으로 입력해주세요.')
      setIsSubmitted(false)
      return
    }

    try {
      setIsSubmitting(true)
      setEmailError(undefined)
      await authApi.resetPassword(normalizedEmail)
      setEmail(normalizedEmail)
      setIsSubmitted(true)
    } catch (error) {
      setEmailError(
        error instanceof Error
          ? error.message
          : '임시 비밀번호 발급에 실패했습니다.',
      )
      setIsSubmitted(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isSubmitEnabled || isSubmitting) {
      return
    }

    void sendTemporaryPassword()
  }

  const handleResend = () => {
    if (isSubmitting) {
      return
    }

    void sendTemporaryPassword()
  }

  return (
    <CounselorAuthLayout
      title="비밀번호 찾기"
      description={
        isSubmitted
          ? `${email || 'team@naver.com'}으로 임시 비밀번호를 전송했습니다.`
          : 'Sign in'
      }
    >
      <div className="counselor-find-password">
        <form className="counselor-find-password-form" onSubmit={handleSubmit}>
          <AuthInput
            label="이메일"
            type="email"
            placeholder="test@naver.com"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError(undefined)
              setIsSubmitted(false)
            }}
            error={emailError}
          />

          {isSubmitted ? (
            <div className="counselor-find-password-meta">
              <p className="counselor-find-password-helper">
                이메일을 받지 못하셨나요?
              </p>
              <button
                type="button"
                className="counselor-auth-link counselor-code-resend"
                disabled={isSubmitting}
                onClick={handleResend}
              >
                {isSubmitting ? '재전송 중' : '재전송'}
              </button>
            </div>
          ) : null}

          {isSubmitted ? (
            <Link
              to="/counselor/login"
              className="counselor-auth-button counselor-auth-button--primary counselor-auth-button-link"
            >
              로그인
            </Link>
          ) : (
            <button
              type="submit"
              className="counselor-auth-button counselor-auth-button--primary"
              disabled={!isSubmitEnabled || isSubmitting}
            >
              {isSubmitting ? '발급 중' : '임시 비밀번호 받기'}
            </button>
          )}
        </form>

        {isSubmitted ? (
          <p className="counselor-auth-inline-copy">
            계정으로 바로 돌아가려면{' '}
            <Link to="/counselor/login" className="counselor-auth-link">
              로그인
            </Link>
            을 선택해주세요.
          </p>
        ) : null}
      </div>
    </CounselorAuthLayout>
  )
}

export default CounselorFindPasswordPage
