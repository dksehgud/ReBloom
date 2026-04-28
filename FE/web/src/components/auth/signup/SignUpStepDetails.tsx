import type { ChangeEvent } from 'react'

import AuthInput from '../AuthInput'
import AuthShell from '../AuthShell'

type UserRole = 'child' | 'parent'
type Gender = 'male' | 'female' | null

type SignUpStepDetailsProps = {
  role: UserRole | null
  email: string
  name: string
  gender: Gender
  birthDate: string
  password: string
  passwordConfirm: string
  parentEmail: string
  parentEmailError?: string
  showPassword: boolean
  showPasswordConfirm: boolean
  childFormValid: boolean
  parentFormValid: boolean
  hasPasswordLengthRule: boolean
  hasPasswordNumberRule: boolean
  hasPasswordSpecialRule: boolean
  passwordsMatch: boolean
  onPrevious: () => void
  onSubmit: () => void
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSelectGender: (gender: Exclude<Gender, null>) => void
  onBirthDateChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordConfirmChange: (event: ChangeEvent<HTMLInputElement>) => void
  onParentEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onTogglePassword: () => void
  onTogglePasswordConfirm: () => void
}

type EyeIconProps = {
  closed?: boolean
}

function EyeIcon({ closed = false }: EyeIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 18 16"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 8C2.9 4.9 5.6 3.333 9 3.333S15.1 4.9 17 8c-1.9 3.1-4.6 4.667-8 4.667S2.9 11.1 1 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <circle cx="9" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.3" />
      {closed ? (
        <path
          d="M3 13L15 3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      ) : null}
    </svg>
  )
}

function SignUpStepDetails({
  role,
  email,
  name,
  gender,
  birthDate,
  password,
  passwordConfirm,
  parentEmail,
  parentEmailError,
  showPassword,
  showPasswordConfirm,
  childFormValid,
  parentFormValid,
  hasPasswordLengthRule,
  hasPasswordNumberRule,
  hasPasswordSpecialRule,
  passwordsMatch,
  onPrevious,
  onSubmit,
  onNameChange,
  onSelectGender,
  onBirthDateChange,
  onPasswordChange,
  onPasswordConfirmChange,
  onParentEmailChange,
  onTogglePassword,
  onTogglePasswordConfirm,
}: SignUpStepDetailsProps) {
  return (
    <AuthShell
      bodyScrollable
      footer={
        <>
          <button className="auth-button is-secondary" onClick={onPrevious} type="button">
            이전
          </button>
          <button
            className="auth-button is-primary"
            disabled={role === 'child' ? !childFormValid : !parentFormValid}
            onClick={onSubmit}
            type="button"
          >
            다음
          </button>
        </>
      }
      title="정보 입력"
    >
      <AuthInput label="이메일" readOnly value={email} />
      <AuthInput
        label="이름"
        onChange={onNameChange}
        placeholder="이름"
        value={name}
      />

      {role === 'child' ? (
        <>
          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label">성별</label>
            </div>
            <div className="gender-grid">
              <button
                className={`gender-option${gender === 'male' ? ' is-selected' : ''}`}
                onClick={() => onSelectGender('male')}
                type="button"
              >
                남자
              </button>
              <button
                className={`gender-option${gender === 'female' ? ' is-selected' : ''}`}
                onClick={() => onSelectGender('female')}
                type="button"
              >
                여자
              </button>
            </div>
          </div>
          <AuthInput
            label="생년월일"
            onChange={onBirthDateChange}
            placeholder="YYYY.MM.DD"
            value={birthDate}
          />
        </>
      ) : null}

      <AuthInput
        action={
          <button
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            className="field-input-icon"
            onClick={onTogglePassword}
            type="button"
          >
            <EyeIcon closed={!showPassword} />
          </button>
        }
        label="비밀번호"
        onChange={onPasswordChange}
        placeholder="비밀번호"
        type={showPassword ? 'text' : 'password'}
        value={password}
      />
      <div className="password-rules">
        <span className={hasPasswordLengthRule ? 'is-valid' : ''}>8-20자 사용</span>
        <span className={hasPasswordNumberRule ? 'is-valid' : ''}>숫자 사용</span>
        <span className={hasPasswordSpecialRule ? 'is-valid' : ''}>
          특수문자 사용
        </span>
      </div>

      <AuthInput
        action={
          <button
            aria-label={
              showPasswordConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'
            }
            className="field-input-icon"
            onClick={onTogglePasswordConfirm}
            type="button"
          >
            <EyeIcon closed={!showPasswordConfirm} />
          </button>
        }
        error={
          passwordConfirm && !passwordsMatch
            ? '비밀번호가 일치하지 않습니다.'
            : undefined
        }
        label="비밀번호 확인"
        onChange={onPasswordConfirmChange}
        placeholder="비밀번호 확인"
        type={showPasswordConfirm ? 'text' : 'password'}
        value={passwordConfirm}
      />

      {role === 'child' ? (
        <AuthInput
          error={parentEmailError}
          label="부모 연결"
          onChange={onParentEmailChange}
          placeholder="부모 이메일"
          value={parentEmail}
        />
      ) : null}
    </AuthShell>
  )
}

export default SignUpStepDetails
