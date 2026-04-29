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
  const currentPassword = 'Rebloom!123'
  const [nextPassword, setNextPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const hasLengthRule = nextPassword.length >= 8 && nextPassword.length <= 20
  const hasNumberRule = /\d/.test(nextPassword)
  const hasSpecialRule = /[^A-Za-z0-9]/.test(nextPassword)
  const isSameAsCurrentPassword =
    nextPassword.trim().length > 0 && nextPassword === currentPassword

  const isNextEnabled =
    nextPassword.trim().length > 0 &&
    hasLengthRule &&
    hasNumberRule &&
    hasSpecialRule &&
    !isSameAsCurrentPassword

  return (
    <main className="password-reset-preview-page">
      <div className="password-reset-preview-phone">
        <PasswordResetModalLayout
          title="계정 비밀번호 변경"
          currentStep={2}
          totalSteps={3}
          onClose={() => {}}
          actions={
            <>
              <button type="button" className="auth-button is-secondary">
                이전
              </button>
              <button
                type="button"
                className={`auth-button ${isNextEnabled ? 'is-primary' : 'is-neutral'}`}
                disabled={!isNextEnabled}
              >
                다음
              </button>
            </>
          }
        >
          <div className="password-reset-step-content">
            <h2 className="password-reset-step-title">새 비밀번호 입력</h2>
            <p className="password-reset-step-description">
              안전한 비밀번호로 설정해주세요
            </p>
            <AuthInput
              label=""
              type={showPassword ? 'text' : 'password'}
              placeholder="새 비밀번호"
              autoComplete="new-password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              error={
                isSameAsCurrentPassword
                  ? '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
                  : undefined
              }
              action={
                <button
                  type="button"
                  className="field-input-icon"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              }
            />
            <div className="password-reset-rules">
              <span className={hasLengthRule ? 'is-valid' : ''}>8-20자 사용</span>
              <span className={hasNumberRule ? 'is-valid' : ''}>숫자 사용</span>
              <span className={hasSpecialRule ? 'is-valid' : ''}>특수문자 사용</span>
            </div>
          </div>
        </PasswordResetModalLayout>
      </div>
    </main>
  )
}

export default PasswordResetModalPreviewPage
