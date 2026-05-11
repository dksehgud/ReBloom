import type { ChangeEvent, KeyboardEvent } from 'react'

import AuthInput from '../AuthInput'
import AuthShell from '../AuthShell'

type EmailStatus = 'idle' | 'available' | 'duplicate' | 'invalid'
type CodeStatus = 'idle' | 'error' | 'expired'
type EmailStepMode = 'email' | 'code'

type SignUpStepEmailProps = {
  mode: EmailStepMode
  email: string
  emailStatus: EmailStatus
  emailError?: string
  hasEmailValue: boolean
  isEmailAvailable: boolean
  isCheckingEmail: boolean
  isSendingCode: boolean
  isVerifyingCode: boolean
  codeDigits: string[]
  codeStatus: CodeStatus
  codeError?: string
  formattedRemainingTime: string
  isCodeExpired: boolean
  onPrevious: () => void
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onCheckEmail: () => void
  onNextEmail: () => void
  onCodeChange: (index: number, event: ChangeEvent<HTMLInputElement>) => void
  onCodeKeyDown: (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => void
  onVerifyCode: () => void
  onResendCode: () => void
}

function SignUpStepEmail({
  mode,
  email,
  emailStatus,
  emailError,
  hasEmailValue,
  isEmailAvailable,
  isCheckingEmail,
  isSendingCode,
  isVerifyingCode,
  codeDigits,
  codeStatus,
  codeError,
  formattedRemainingTime,
  isCodeExpired,
  onPrevious,
  onEmailChange,
  onCheckEmail,
  onNextEmail,
  onCodeChange,
  onCodeKeyDown,
  onVerifyCode,
  onResendCode,
}: SignUpStepEmailProps) {
  if (mode === 'email') {
    return (
      <AuthShell
        bodyCentered
        footer={
          <>
            <button className="auth-button is-secondary" onClick={onPrevious} type="button">
              이전
            </button>
            <button
              className="auth-button is-primary"
              disabled={!isEmailAvailable || isSendingCode}
              onClick={onNextEmail}
              type="button"
            >
              {isSendingCode ? '전송 중' : '다음'}
            </button>
          </>
        }
        title="회원가입"
      >
        <AuthInput
          action={
            <button
              className={`field-input-action${
                isEmailAvailable
                  ? ' is-disabled'
                  : hasEmailValue
                    ? ' is-active'
                    : ' is-disabled'
              }`}
              disabled={!hasEmailValue || isEmailAvailable || isCheckingEmail}
              onClick={onCheckEmail}
              type="button"
            >
              {isEmailAvailable ? '확인완료' : isCheckingEmail ? '확인 중' : '중복 확인'}
            </button>
          }
          help="* 이메일 중복 확인 후 인증번호를 전송할 수 있습니다."
          label="이메일"
          onChange={onEmailChange}
          placeholder="test@naver.com"
          status={
            emailStatus === 'duplicate' ? (
              <span className="field-inline-error">이미 존재하는 이메일입니다.</span>
            ) : emailStatus === 'invalid' ? (
              <span className="field-inline-error">
                올바른 이메일 형식을 입력해주세요.
              </span>
            ) : null
          }
          type="email"
          value={email}
        />
        {emailError ? <p className="field-error">{emailError}</p> : null}
        {emailStatus === 'available' ? (
          <p className="field-success">사용 가능한 이메일입니다.</p>
        ) : null}
      </AuthShell>
    )
  }

  return (
    <AuthShell
      bodyCentered
      description={
        <>
          {email}으로
          <br />
          인증코드를 전송했습니다.
        </>
      }
      footer={
        <>
          <button className="auth-button is-secondary" onClick={onPrevious} type="button">
            이전
          </button>
          <button
            className="auth-button is-primary"
            disabled={isCodeExpired || isVerifyingCode}
            onClick={onVerifyCode}
            type="button"
          >
            {isVerifyingCode ? '확인 중' : '다음'}
          </button>
        </>
      }
      title="인증코드 입력"
    >
      <div className="code-meta">
        <span>인증 코드 입력</span>
        <span className="code-meta-divider">●</span>
        <span className="code-meta-timer">남은 시간: {formattedRemainingTime}</span>
      </div>

      <div className="code-input-row">
        {codeDigits.map((digit, index) => (
          <input
            className={`code-input${codeStatus === 'error' || isCodeExpired ? ' is-error' : ''}`}
            inputMode="numeric"
            key={`code-${index}`}
            maxLength={1}
            onChange={(event) => onCodeChange(index, event)}
            onKeyDown={(event) => onCodeKeyDown(index, event)}
            value={digit}
          />
        ))}
      </div>

      <div className="code-resend">
        <span>이메일을 받지 못하셨나요?</span>
        <button disabled={isSendingCode} onClick={onResendCode} type="button">
          {isSendingCode ? '전송 중' : '재전송'}
        </button>
      </div>

      {isCodeExpired ? (
        <p className="field-error code-error-message">
          인증코드 유효시간이 끝났습니다. 재전송해주세요.
        </p>
      ) : codeStatus === 'error' ? (
        <p className="field-error code-error-message">
          {codeError ?? '인증코드가 올바르지 않습니다.'}
        </p>
      ) : codeError ? (
        <p className="field-error code-error-message">{codeError}</p>
      ) : null}
    </AuthShell>
  )
}

export default SignUpStepEmail
