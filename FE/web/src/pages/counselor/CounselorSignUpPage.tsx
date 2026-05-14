import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AuthModal from '../../components/auth/AuthModal'
import AuthInput from '../../components/auth/AuthInput'
import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'
import {
  authApi,
  type SignupRequest,
} from '../../features/auth/api/authApi'
import { openDaumPostcodePopup } from '../../shared/utils/daumPostcode'

type SignUpStep = 'email' | 'verification' | 'profile'
type EmailStatus = 'idle' | 'success' | 'error'
type VerificationStatus = 'idle' | 'error'

const INITIAL_CODE_LENGTH = 6
const INITIAL_TIME_LEFT = 5 * 60
const KOREAN_NAME_PATTERN = /^[가-힣]{2,10}$/
const PHONE_NUMBER_PATTERN = /^010-\d{4}-\d{4}$/
const PASSWORD_ALLOWED_PATTERN = /^[!-~]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatTimeLeft(timeLeft: number) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function CounselorSignUpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registerUUID = searchParams.get('registerUUID') ?? undefined
  const oauthEmail = searchParams.get('email') ?? ''
  const isOAuthSignup = Boolean(registerUUID)
  const [step, setStep] = useState<SignUpStep>(isOAuthSignup ? 'profile' : 'email')
  const [email, setEmail] = useState(oauthEmail)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [verificationDigits, setVerificationDigits] = useState<string[]>(
    Array.from({ length: INITIAL_CODE_LENGTH }, () => ''),
  )
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('idle')
  const [verificationError, setVerificationError] = useState<string | undefined>()
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_LEFT)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [hospitalAddress, setHospitalAddress] = useState('')
  const [hospitalAddressDetail, setHospitalAddressDetail] = useState('')
  const [hospitalAddressError, setHospitalAddressError] = useState<
    string | undefined
  >()
  const [isLoadingAddressSearch, setIsLoadingAddressSearch] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)

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
      letter: /[A-Za-z]/.test(password),
      number: /\d/.test(password),
      allowedCharacters:
        password.length > 0 && PASSWORD_ALLOWED_PATTERN.test(password),
    }),
    [password],
  )

  const isNameValid = KOREAN_NAME_PATTERN.test(name.trim())
  const isPhoneValid = PHONE_NUMBER_PATTERN.test(phone)

  const isProfileStepComplete =
    isNameValid &&
    isPhoneValid &&
    hospitalName.trim().length > 0 &&
    hospitalAddress.trim().length > 0 &&
    hospitalAddressDetail.trim().length > 0 &&
    (isOAuthSignup ||
      (passwordRuleStates.length &&
        passwordRuleStates.letter &&
        passwordRuleStates.number &&
        passwordRuleStates.allowedCharacters &&
        passwordConfirm.length > 0 &&
        password === passwordConfirm))

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

  const handleDuplicateCheck = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    setEmailError(undefined)

    if (normalizedEmail.length === 0 || !EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailStatus('error')
      setEmailError('올바른 이메일 형식으로 입력해주세요.')
      return
    }

    try {
      setIsCheckingEmail(true)
      const isDuplicate = await authApi.checkEmailDuplicate(normalizedEmail)

      if (isDuplicate) {
        setEmailStatus('error')
        setEmailError('이미 존재하는 이메일입니다.')
        return
      }

      setEmail(normalizedEmail)
      setEmailStatus('success')
    } catch (error) {
      setEmailStatus('error')
      setEmailError(
        error instanceof Error ? error.message : '이메일 중복 확인에 실패했습니다.',
      )
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (emailStatus !== 'success' || isSendingCode) {
      return
    }

    try {
      setIsSendingCode(true)
      setEmailError(undefined)
      setVerificationError(undefined)
      await authApi.sendEmailVerificationCode(email.trim().toLowerCase())
      setStep('verification')
      setVerificationStatus('idle')
      setVerificationDigits(Array.from({ length: INITIAL_CODE_LENGTH }, () => ''))
      setTimeLeft(INITIAL_TIME_LEFT)
    } catch (error) {
      setEmailError(
        error instanceof Error ? error.message : '인증코드 전송에 실패했습니다.',
      )
    } finally {
      setIsSendingCode(false)
    }
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
    setVerificationStatus('idle')
    setVerificationError(undefined)

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

  const handleVerificationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isVerificationComplete || isVerifyingCode) {
      return
    }

    if (timeLeft === 0) {
      setVerificationStatus('error')
      setVerificationError('인증 시간이 만료되었습니다. 인증코드를 다시 받아주세요.')
      return
    }

    try {
      setIsVerifyingCode(true)
      setVerificationError(undefined)
      const isVerified = await authApi.verifyEmailCode(
        email.trim().toLowerCase(),
        verificationCode,
      )

      if (isVerified) {
        setVerificationStatus('idle')
        setStep('profile')
        return
      }

      setVerificationStatus('error')
      setVerificationError('인증코드가 올바르지 않습니다.')
    } catch (error) {
      setVerificationStatus('error')
      setVerificationError(
        error instanceof Error ? error.message : '인증코드 확인에 실패했습니다.',
      )
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleResend = async () => {
    if (isSendingCode) {
      return
    }

    try {
      setIsSendingCode(true)
      setVerificationError(undefined)
      await authApi.sendEmailVerificationCode(email.trim().toLowerCase())
      setVerificationDigits(Array.from({ length: INITIAL_CODE_LENGTH }, () => ''))
      setVerificationStatus('idle')
      setTimeLeft(INITIAL_TIME_LEFT)
      verificationInputRefs.current[0]?.focus()
    } catch (error) {
      setVerificationStatus('error')
      setVerificationError(
        error instanceof Error ? error.message : '인증코드 재전송에 실패했습니다.',
      )
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleSearchHospitalAddress = async () => {
    try {
      setIsLoadingAddressSearch(true)
      setHospitalAddressError(undefined)

      await openDaumPostcodePopup(
        (data) => {
          const nextAddress = data.roadAddress || data.address || data.jibunAddress
          setHospitalAddress(nextAddress)
          setHospitalAddressError(undefined)
        },
        '병원 주소 검색',
      )
    } catch {
      setHospitalAddressError(
        '주소 검색창을 여는 데 실패했어요. 다시 시도해 주세요.',
      )
    } finally {
      setIsLoadingAddressSearch(false)
    }
  }

  const getProfileValidationMessage = () => {
    if (!isNameValid) {
      return '이름은 한글 2~10자로 입력해주세요.'
    }

    if (!isPhoneValid) {
      return '휴대폰 번호를 010-1234-5678 형식으로 입력해주세요.'
    }

    if (!hospitalName.trim()) {
      return '병원명을 입력해주세요.'
    }

    if (!hospitalAddress.trim()) {
      return '병원 주소를 입력해주세요.'
    }

    if (!hospitalAddressDetail.trim()) {
      return '병원 상세 주소를 입력해주세요.'
    }

    if (
      !isOAuthSignup &&
      !(
        passwordRuleStates.length &&
        passwordRuleStates.letter &&
        passwordRuleStates.number &&
        passwordRuleStates.allowedCharacters &&
        passwordConfirm.length > 0 &&
        password === passwordConfirm
      )
    ) {
      return '비밀번호 조건과 비밀번호 확인을 다시 확인해주세요.'
    }

    return '회원가입 정보를 다시 확인해주세요.'
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isProfileStepComplete || isSubmitting) {
      setSubmitError(getProfileValidationMessage())
      return
    }

    const request: SignupRequest = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      role: 'COUNSELOR',
      hospitalName: hospitalName.trim(),
      hospitalAddress: hospitalAddress.trim(),
      hospitalAddressDetail: hospitalAddressDetail.trim(),
      ...(isOAuthSignup ? { registerUUID } : { password }),
    }

    try {
      setIsSubmitting(true)
      setSubmitError(undefined)
      await authApi.signup(request)
      setIsCompleteModalOpen(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '회원가입에 실패했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteSignup = () => {
    setIsCompleteModalOpen(false)
    navigate('/counselor/login', { replace: true })
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
                setEmailError(undefined)
              }}
              action={
                <button
                  type="button"
                  className={`counselor-inline-action${
                    emailStatus === 'success' ? ' is-success' : ''
                  }`}
                  disabled={isCheckingEmail}
                  onClick={handleDuplicateCheck}
                >
                  {isCheckingEmail
                    ? '확인 중'
                    : emailStatus === 'success'
                      ? '확인 완료'
                      : '중복 확인'}
                </button>
              }
              help="* 이메일 중복 확인 후 인증번호를 전송할 수 있습니다."
              success={
                emailStatus === 'success' ? '사용 가능한 이메일입니다.' : undefined
              }
              error={emailStatus === 'error' ? emailError : undefined}
            />

            <button
              type="submit"
              className="counselor-auth-button counselor-auth-button--primary"
              disabled={emailStatus !== 'success' || isSendingCode}
            >
              {isSendingCode ? '전송 중' : '다음 →'}
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
                disabled={isSendingCode}
                onClick={handleResend}
              >
                {isSendingCode ? '재전송 중' : '재전송'}
              </button>
            </div>

            {verificationStatus === 'error' ? (
              <p className="counselor-code-error">
                {verificationError ?? '인증코드가 올바르지 않습니다.'}
              </p>
            ) : null}

            <button
              type="submit"
              className="counselor-auth-button counselor-auth-button--primary"
              disabled={!isVerificationComplete || isVerifyingCode}
            >
              {isVerifyingCode ? '확인 중' : '다음 →'}
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
              maxLength={10}
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={
                name.length > 0 && !isNameValid
                  ? '이름은 한글 2~10자로 입력해주세요.'
                  : undefined
              }
            />
            <AuthInput
              label="핸드폰 번호"
              type="tel"
              placeholder="010-1234-5678"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={13}
              value={phone}
              onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
              error={
                phone.length > 0 && !isPhoneValid
                  ? '핸드폰 번호는 010-1234-5678 형식으로 입력해주세요.'
                  : undefined
              }
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
                readOnly
                action={
                  <button
                    type="button"
                    className={`field-input-action counselor-address-search-button ${
                      isLoadingAddressSearch ? 'is-disabled' : 'is-active'
                    }`}
                    disabled={isLoadingAddressSearch}
                    onClick={handleSearchHospitalAddress}
                  >
                    {isLoadingAddressSearch ? '불러오는 중' : '주소 검색'}
                  </button>
                }
                error={hospitalAddressError}
                help={
                  hospitalAddressError
                    ? '주소 검색을 다시 시도해 주세요.'
                    : !hospitalAddress
                      ? '병원 기본 주소는 주소 검색으로 입력해 주세요.'
                      : undefined
                }
              />
              <AuthInput
                label="상세 주소"
                placeholder="상세 주소"
                value={hospitalAddressDetail}
                onChange={(event) => setHospitalAddressDetail(event.target.value)}
              />
            </div>
            {!isOAuthSignup ? (
              <>
            <AuthInput
              label="비밀번호"
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="비밀번호"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={
                password.length > 0 && !passwordRuleStates.allowedCharacters
                  ? '공백이나 한글은 사용할 수 없어요.'
                  : undefined
              }
              action={
                <button
                  type="button"
                  className="counselor-password-toggle"
                  aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                >
                  {isPasswordVisible ? <FiEye /> : <FiEyeOff />}
                </button>
              }
            />
            <div className="counselor-password-rules">
              <span className={passwordRuleStates.letter ? 'is-valid' : ''}>
                영문
              </span>
              <span className={passwordRuleStates.number ? 'is-valid' : ''}>
                숫자
              </span>
              <span className={passwordRuleStates.length ? 'is-valid' : ''}>
                8-20자
              </span>
              <span className="is-optional">
                특수문자 가능
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
                  {isPasswordConfirmVisible ? <FiEye /> : <FiEyeOff />}
                </button>
              }
              error={
                passwordConfirm.length > 0 && password !== passwordConfirm
                  ? '비밀번호가 일치하지 않습니다.'
                  : undefined
              }
            />
              </>
            ) : null}

            {submitError ? <p className="field-error">{submitError}</p> : null}

            <button
              type="submit"
              className="counselor-auth-button counselor-auth-button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '가입 중' : '다음 →'}
            </button>
          </form>
        </div>
      ) : null}

      {isCompleteModalOpen ? (
        <AuthModal
          actions={
            <button
              className="auth-button is-primary"
              onClick={handleCompleteSignup}
              type="button"
            >
              확인
            </button>
          }
          title="회원가입 완료"
        >
          <div className="auth-modal-panel">
            상담사 회원가입이 완료되었습니다.
          </div>
        </AuthModal>
      ) : null}
    </CounselorAuthLayout>
  )
}

export default CounselorSignUpPage
