import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import AuthInput from '../../components/auth/AuthInput'
import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

function CounselorFindPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isError, setIsError] = useState(false)

  const isSubmitEnabled = email.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isSubmitEnabled) {
      return
    }

    if (
      email.toLowerCase().includes('missing') ||
      email.toLowerCase().includes('none') ||
      email.toLowerCase().includes('notfound')
    ) {
      setIsError(true)
      setIsSubmitted(false)
      return
    }

    setIsError(false)
    setIsSubmitted(true)
  }

  const handleResend = () => {
    setIsSubmitted(true)
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
              setIsError(false)
            }}
            error={isError ? '존재하지 않는 이메일입니다.' : undefined}
          />

          {isSubmitted ? (
            <div className="counselor-find-password-meta">
              <p className="counselor-find-password-helper">
                이메일을 받지 못하셨나요?
              </p>
              <button
                type="button"
                className="counselor-auth-link counselor-code-resend"
                onClick={handleResend}
              >
                재전송
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
              disabled={!isSubmitEnabled}
            >
              임시 비밀번호 받기
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
