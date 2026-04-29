import { useState } from 'react'

import AuthInput from '../../components/auth/AuthInput'
import PasswordResetModalLayout from '../../components/auth/password-reset/PasswordResetModalLayout'

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.25 12C3.94 8.95 7.03 7 12 7C16.97 7 20.06 8.95 21.75 12C20.06 15.05 16.97 17 12 17C7.03 17 3.94 15.05 2.25 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.88 5.09C10.56 5.03 11.26 5 12 5C16.97 5 20.06 6.95 21.75 10C21.28 10.85 20.72 11.61 20.08 12.28"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M17.29 17.29C15.81 17.75 14.07 18 12 18C7.03 18 3.94 16.05 2.25 13C3.08 11.49 4.17 10.24 5.54 9.27"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function PasswordResetModalPreviewPage() {
  const nextPassword = 'Rebloom!456'
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isPasswordMatched =
    confirmPassword.trim().length > 0 && confirmPassword === nextPassword
  const isPasswordMismatched =
    confirmPassword.trim().length > 0 && confirmPassword !== nextPassword

  return (
    <main className="password-reset-preview-page">
      <div className="password-reset-preview-phone">
        <PasswordResetModalLayout
          title="계정 비밀번호 변경"
          currentStep={3}
          totalSteps={3}
          onClose={() => {}}
          actions={
            <>
              <button type="button" className="auth-button is-secondary">
                이전
              </button>
              <button
                type="button"
                className={`auth-button ${isPasswordMatched ? 'is-primary' : 'is-neutral'}`}
                disabled={!isPasswordMatched}
              >
                완료
              </button>
            </>
          }
        >
          <div className="password-reset-step-content">
            <h2 className="password-reset-step-title">비밀번호 확인</h2>
            <p className="password-reset-step-description">
              새 비밀번호를 다시 한번 입력해주세요
            </p>
            <AuthInput
              label=""
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="비밀번호 확인"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={
                isPasswordMismatched
                  ? '새 비밀번호와 일치하지 않습니다.'
                  : undefined
              }
              action={
                <button
                  type="button"
                  className="field-input-icon"
                  aria-label={
                    showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                  }
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              }
            />
          </div>
        </PasswordResetModalLayout>
      </div>
    </main>
  )
}

export default PasswordResetModalPreviewPage
