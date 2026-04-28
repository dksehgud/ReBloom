import { useState } from 'react'

import AuthInput from '../../components/auth/AuthInput'
import AuthShell from '../../components/auth/AuthShell'

type FindPasswordPageProps = {
  initialEmail?: string
  onBackToLogin: () => void
  onMoveToLogin: (email: string) => void
}

function FindPasswordPage({
  initialEmail = '',
  onBackToLogin,
  onMoveToLogin,
}: FindPasswordPageProps) {
  const [email, setEmail] = useState(initialEmail)
  const [temporaryPasswordSent, setTemporaryPasswordSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [resent, setResent] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()
  const hasEmailValue = normalizedEmail.length > 0
  const isUnregisteredEmail =
    normalizedEmail === 'missing@naver.com' ||
    normalizedEmail === 'none@naver.com' ||
    normalizedEmail === 'notfound@naver.com'

  const handleSendTemporaryPassword = () => {
    if (!hasEmailValue) {
      return
    }

    if (isUnregisteredEmail) {
      setEmailError('가입된 이메일이 없습니다.')
      setTemporaryPasswordSent(false)
      setResent(false)
      return
    }

    setEmailError('')
    setTemporaryPasswordSent(true)
    setResent(false)
  }

  const handleResetEmailInput = () => {
    setTemporaryPasswordSent(false)
    setEmailError('')
    setResent(false)
  }

  const handleResendTemporaryPassword = () => {
    setTemporaryPasswordSent(true)
    setEmailError('')
    setResent(true)
  }

  return (
    <AuthShell
      bodyCentered
      screenClassName="auth-screen--find-password"
      title="비밀번호 찾기"
      footer={
        temporaryPasswordSent ? (
          <button
            type="button"
            className="auth-button is-primary"
            onClick={() => onMoveToLogin(email)}
          >
            로그인
          </button>
        ) : (
          <>
            <button
              type="button"
              className="auth-button is-secondary"
              onClick={onBackToLogin}
            >
              이전
            </button>
            <button
              type="button"
              className="auth-button is-primary"
              disabled={!hasEmailValue}
              onClick={handleSendTemporaryPassword}
            >
              임시 비밀번호 받기
            </button>
          </>
        )
      }
    >
      <div className="find-password-fields">
        <div className="find-password-notice">
          {temporaryPasswordSent ? (
            <div className="find-password-notice-lines">
              <span>{email}으로</span>
              <span>
                임시 비밀번호를 {resent ? '재전송했습니다.' : '전송했습니다.'}
              </span>
            </div>
          ) : (
            <div className="find-password-notice-lines">
              <span>가입한 이메일을 입력하시면</span>
              <span>임시 비밀번호를 보내드립니다.</span>
            </div>
          )}
        </div>
        <AuthInput
          label="이메일"
          type="email"
          placeholder="이메일"
          autoComplete="email"
          readOnly={temporaryPasswordSent}
          value={email}
          error={emailError || undefined}
          onChange={
            temporaryPasswordSent
              ? undefined
              : (event) => {
                  setEmail(event.target.value)
                  if (emailError) {
                    setEmailError('')
                  }
                }
          }
        />
        {temporaryPasswordSent ? (
          <div className="find-password-resend">
            <span>이메일을 받지 못하셨나요?</span>
            <button type="button" onClick={handleResendTemporaryPassword}>
              재전송
            </button>
            <button
              type="button"
              className="find-password-reset"
              onClick={handleResetEmailInput}
            >
              다시 입력
            </button>
          </div>
        ) : null}
      </div>
    </AuthShell>
  )
}

export default FindPasswordPage
