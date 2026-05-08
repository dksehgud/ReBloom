import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

import AuthInput from '../../components/auth/AuthInput'
import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

type SignUpStep = 'email' | 'verification' | 'profile'
type EmailStatus = 'idle' | 'success' | 'error'
type VerificationStatus = 'idle' | 'error'

const INITIAL_CODE_LENGTH = 6
const INITIAL_TIME_LEFT = 4 * 60 + 58

function formatTimeLeft(timeLeft: number) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function CounselorSignUpPage() {
  const [step, setStep] = useState<SignUpStep>('email')
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [verificationDigits, setVerificationDigits] = useState<string[]>(
    Array.from({ length: INITIAL_CODE_LENGTH }, () => ''),
  )
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_LEFT)
  const [name, setName] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [hospitalAddress, setHospitalAddress] = useState('')
  const [hospitalAddressDetail, setHospitalAddressDetail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false)

  const verificationInputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (step !== 'verification' || timeLeft <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [step, timeLeft])

  const verificationCode = verificationDigits.join('')
  const isVerificationComplete =
    verificationCode.length === INITIAL_CODE_LENGTH &&
    verificationDigits.every((digit) => digit.length === 1)

  const passwordRuleStates = useMemo(
    () => ({
      length: password.length >= 8 && password.length <= 20,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  )

  const isProfileStepComplete =
    name.trim().length > 0 &&
    hospitalName.trim().length > 0 &&
    hospitalAddress.trim().length > 0 &&
    hospitalAddressDetail.trim().length > 0 &&
    passwordRuleStates.length &&
    passwordRuleStates.number &&
    passwordRuleStates.special &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm

  const titleMap: Record<SignUpStep, string> = {
    email: '회원가입',
    verification: '인증코드 입력',
    profile: '정보 입력',
  }

  const descriptionMap: Record<SignUpStep, string> = {
    email: 'Sign in',
    verification: `${email || 'team@naver.com'}으로 인증코드를 전송했습니다.`,
    profile: 'Sign in',
  }

  const handleDuplicateCheck = () => {
    if (email.trim().length === 0) {
      setEmailStatus('error')
      return
    }

    if (
      email.toLowerCase().includes('exist') ||
      email.toLowerCase().includes('taken')
    ) {
      setEmailStatus('error')
      return
    }

    setEmailStatus('success')
  }

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (emailStatus !== 'success') {
      return
    }

    setStep('verification')
    setVerificationStatus('idle')
    setVerificationDigits(Array.from({ length: INITIAL_CODE_LENGTH }, () => ''))
    setTimeLeft(INITIAL_TIME_LEFT)
  }

  const handleVerificationChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value.replace(/\D/g, '').slice(-1)

    setVerificationDigits((current) => {
      const nextDigits = [...current]
      nextDigits[index] = nextValue
      return nextDigits
    })

    if (nextValue && index < INITIAL_CODE_LENGTH - 1) {
      verificationInputRefs.current[index + 1]?.focus()
    }
  }

  const handleVerificationKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace' && verificationDigits[index].length === 0) {
      verificationInputRefs.current[Math.max(index - 1, 0)]?.focus()
    }
  }

  const handleVerificationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isVerificationComplete) {
      return
    }

    if (verificationCode === '555555') {
      setVerificationStatus('idle')
      setStep('profile')
      return
    }

    setVerificationStatus('error')
  }

  const handleResend = () => {
    setVerificationDigits(Array.from({ length: INITIAL_CODE_LENGTH }, () => ''))
    setVerificationStatus('idle')
    setTimeLeft(INITIAL_TIME_LEFT)
    verificationInputRefs.current[0]?.focus()
  }

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <CounselorAuthLayout
      title={titleMap[step]}
      description={descriptionMap[step]}
    >
      {step === 'email' ? (
        <div className="counselor-signup">
          <form className="counselor-signup-form" onSubmit={handleEmailSubmit}>
            <AuthInput
              label="이메일"
              type="email"
              placeholder="test@naver.com"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailStatus('idle')
              }}
              action={
                <button
                  type="button"
                  className={`counselor-inline-action${
                    emailStatus === 'success' ? ' is-success' : ''
                  }`}
                  onClick={handleDuplicateCheck}
                >
                  {emailStatus === 'success' ? '확인 완료' : '중복 확인'}
                </button>
              }
              help="* 이메일 중복 확인 후 인증번호를 전송할 수 있습니다."
              success={
                emailStatus === 'success' ? '사용 가능한 이메일입니다.' : undefined
              }
              error={
                emailStatus === 'error'
                  ? '이미 존재하는 이메일입니다.'
                  : undefined
              }
            />

            <button
              type="submit"
              className="counselor-auth-button counselor-auth-button--primary"
              disabled={emailStatus !== 'success'}
            >
              다음 →
            </button>
          </form>
        </div>
      ) : null}

      {step === 'verification' ? (
        <div className="counselor-signup">
          <form
            className="counselor-signup-form counselor-signup-form--verification"
            onSubmit={handleVerificationSubmit}
          >
            <div className="counselor-code-header">
              <p className="counselor-code-label">인증 코드 입력</p>
              <div className="counselor-code-timer">
                <span className="counselor-code-timer-dot" />
                <span>남은 시간: {formatTimeLeft(timeLeft)}</span>
              </div>
            </div>

            <div
              className={`counselor-code-inputs${
                verificationStatus === 'error' ? ' is-error' : ''
              }`}
            >
              {verificationDigits.map((digit, index) => (
                <input
                  key={`verification-${index}`}
                  ref={(element) => {
                    verificationInputRefs.current[index] = element
                  }}
                  className="counselor-code-input"
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(event) => handleVerificationChange(index, event)}
                  onKeyDown={(event) => handleVerificationKeyDown(index, event)}
                  value={digit}
                />
              ))}
            </div>

            <div className="counselor-code-actions">
              <p className="counselor-code-helper">이메일을 받지 못하셨나요?</p>
              <button
                type="button"
                className="counselor-auth-link counselor-code-resend"
                onClick={handleResend}
              >
                재전송
              </button>
            </div>

            {verificationStatus === 'error' ? (
              <p className="counselor-code-error">인증코드가 올바르지 않습니다.</p>
            ) : null}

            <button
              type="submit"
              className="counselor-auth-button counselor-auth-button--primary"
              disabled={!isVerificationComplete}
            >
              다음 →
            </button>
          </form>
        </div>
      ) : null}

      {step === 'profile' ? (
        <div className="counselor-signup">
          <form className="counselor-signup-form" onSubmit={handleProfileSubmit}>
            <AuthInput label="이메일" value={email} readOnly />
            <AuthInput
              label="이름"
              placeholder="이름"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <AuthInput
              label="병원명"
              placeholder="병원명"
              value={hospitalName}
              onChange={(event) => setHospitalName(event.target.value)}
            />
            <div className="counselor-address-group">
              <AuthInput
                label="병원주소"
                placeholder="주소"
                value={hospitalAddress}
                onChange={(event) => setHospitalAddress(event.target.value)}
              />
              <AuthInput
                label="상세 주소"
                placeholder="상세 주소"
                value={hospitalAddressDetail}
                onChange={(event) => setHospitalAddressDetail(event.target.value)}
              />
            </div>
            <AuthInput
              label="비밀번호"
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="비밀번호"
              autoComplete="new-password"
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
            <div className="counselor-password-rules">
              <span className={passwordRuleStates.length ? 'is-valid' : ''}>
                8-20자 사용
              </span>
              <span className={passwordRuleStates.number ? 'is-valid' : ''}>
                숫자 사용
              </span>
              <span className={passwordRuleStates.special ? 'is-valid' : ''}>
                특수문자 사용
              </span>
            </div>
            <AuthInput
              label="비밀번호 확인"
              type={isPasswordConfirmVisible ? 'text' : 'password'}
              placeholder="비밀번호 확인"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              action={
                <button
                  type="button"
                  className="counselor-password-toggle"
                  aria-label={
                    isPasswordConfirmVisible
                      ? '비밀번호 확인 숨기기'
                      : '비밀번호 확인 보기'
                  }
                  onClick={() => setIsPasswordConfirmVisible((prev) => !prev)}
                >
                  {isPasswordConfirmVisible ? <FiEyeOff /> : <FiEye />}
                </button>
              }
              error={
                passwordConfirm.length > 0 && password !== passwordConfirm
                  ? '비밀번호가 일치하지 않습니다.'
                  : undefined
              }
            />

            <button
              type="submit"
              className="counselor-auth-button counselor-auth-button--primary"
              disabled={!isProfileStepComplete}
            >
              다음 →
            </button>
          </form>
        </div>
      ) : null}
    </CounselorAuthLayout>
  )
}

export default CounselorSignUpPage
