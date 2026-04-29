import { useState } from 'react'

import AuthInput from '../../../../components/auth/AuthInput'
import PasswordResetModalLayout from '../../../../components/auth/password-reset/PasswordResetModalLayout'

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

const MOCK_CURRENT_PASSWORD = 'Rebloom!123'

function PasswordResetModalPreview() {
  const [currentStep, setCurrentStep] = useState(1)
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNextPassword, setShowNextPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const hasLengthRule = nextPassword.length >= 8 && nextPassword.length <= 20
  const hasNumberRule = /\d/.test(nextPassword)
  const hasSpecialRule = /[^A-Za-z0-9]/.test(nextPassword)

  const isCurrentPasswordMismatched =
    currentPassword.trim().length > 0 &&
    currentPassword !== MOCK_CURRENT_PASSWORD
  const isSameAsCurrentPassword =
    nextPassword.trim().length > 0 && nextPassword === currentPassword
  const isPasswordMatched =
    confirmPassword.trim().length > 0 && confirmPassword === nextPassword
  const isPasswordMismatched =
    confirmPassword.trim().length > 0 && confirmPassword !== nextPassword

  const isCurrentStepEnabled =
    currentPassword.trim().length > 0 && !isCurrentPasswordMismatched
  const isNextStepEnabled =
    nextPassword.trim().length > 0 &&
    hasLengthRule &&
    hasNumberRule &&
    hasSpecialRule &&
    !isSameAsCurrentPassword
  const isConfirmStepEnabled = isPasswordMatched

  const resetModalState = () => {
    setCurrentStep(1)
    setCurrentPassword('')
    setNextPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNextPassword(false)
    setShowConfirmPassword(false)
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handlePrimaryAction = () => {
    if (currentStep === 1 && isCurrentStepEnabled) {
      setCurrentStep(2)
      return
    }

    if (currentStep === 2 && isNextStepEnabled) {
      setCurrentStep(3)
      return
    }

    if (currentStep === 3 && isConfirmStepEnabled) {
      resetModalState()
    }
  }

  const stepConfig =
    currentStep === 1
      ? {
          title: '현재 비밀번호 입력',
          description: '본인 확인을 위해 현재 비밀번호를 입력해주세요',
          primaryLabel: '다음',
          primaryEnabled: isCurrentStepEnabled,
          content: (
            <AuthInput
              label=""
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              error={
                isCurrentPasswordMismatched
                  ? '현재 비밀번호가 일치하지 않습니다.'
                  : undefined
              }
              action={
                <button
                  type="button"
                  className="field-input-icon"
                  aria-label={
                    showCurrentPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                  }
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                >
                  <EyeIcon visible={showCurrentPassword} />
                </button>
              }
            />
          ),
        }
      : currentStep === 2
        ? {
            title: '새 비밀번호 입력',
            description: '안전한 비밀번호로 설정해주세요',
            primaryLabel: '다음',
            primaryEnabled: isNextStepEnabled,
            content: (
              <>
                <AuthInput
                  label=""
                  type={showNextPassword ? 'text' : 'password'}
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
                      aria-label={
                        showNextPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                      }
                      onClick={() => setShowNextPassword((prev) => !prev)}
                    >
                      <EyeIcon visible={showNextPassword} />
                    </button>
                  }
                />
                <div className="password-reset-rules">
                  <span className={hasLengthRule ? 'is-valid' : ''}>
                    8-20자 사용
                  </span>
                  <span className={hasNumberRule ? 'is-valid' : ''}>
                    숫자 사용
                  </span>
                  <span className={hasSpecialRule ? 'is-valid' : ''}>
                    특수문자 사용
                  </span>
                </div>
              </>
            ),
          }
        : {
            title: '비밀번호 확인',
            description: '새 비밀번호를 다시 한번 입력해주세요',
            primaryLabel: '완료',
            primaryEnabled: isConfirmStepEnabled,
            content: (
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
            ),
          }

  return (
    <main className="password-reset-preview-page">
      <div className="password-reset-preview-phone">
        <PasswordResetModalLayout
          title="계정 비밀번호 변경"
          currentStep={currentStep}
          totalSteps={3}
          onClose={resetModalState}
          actions={
            <>
              <button
                type="button"
                className="auth-button is-secondary"
                onClick={currentStep === 1 ? resetModalState : handlePrevious}
              >
                이전
              </button>
              <button
                type="button"
                className={`auth-button ${
                  stepConfig.primaryEnabled ? 'is-primary' : 'is-neutral'
                }`}
                disabled={!stepConfig.primaryEnabled}
                onClick={handlePrimaryAction}
              >
                {stepConfig.primaryLabel}
              </button>
            </>
          }
        >
          <div className="password-reset-step-content">
            <h2 className="password-reset-step-title">{stepConfig.title}</h2>
            <p className="password-reset-step-description">
              {stepConfig.description}
            </p>
            {stepConfig.content}
          </div>
        </PasswordResetModalLayout>
      </div>
    </main>
  )
}

export default PasswordResetModalPreview
