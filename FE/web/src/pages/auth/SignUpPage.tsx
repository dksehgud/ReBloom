import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

import SignUpModals from '../../components/auth/signup/SignUpModals'
import SignUpStepDetails from '../../components/auth/signup/SignUpStepDetails'
import SignUpStepEmail from '../../components/auth/signup/SignUpStepEmail'
import SignUpStepRole from '../../components/auth/signup/SignUpStepRole'
import {
  authApi,
  type SignupRequest,
  type UserProfileResponse,
} from '../../features/auth/api/authApi'
import { openDaumPostcodePopup } from '../../shared/utils/daumPostcode'
import { geocodeAddress } from '../../shared/utils/kakaoGeocoder'

type UserRole = 'child' | 'parent'
type SignUpStep = 'role' | 'email' | 'code' | 'details'
type ModalType = 'complete' | 'parent-confirm' | 'parent-missing' | null
type EmailStatus = 'idle' | 'available' | 'duplicate' | 'invalid'
type CodeStatus = 'idle' | 'error' | 'expired'
type Gender = 'male' | 'female' | null

const CODE_LENGTH = 6
const CODE_DURATION_SECONDS = 300
const KOREAN_NAME_PATTERN = /^[가-힣]{2,10}$/
const PASSWORD_ALLOWED_PATTERN = /^[!-~]+$/

type SignUpPageProps = {
  onBackToLogin: () => void
}

function SignUpPage({ onBackToLogin }: SignUpPageProps) {
  const [searchParams] = useSearchParams()
  const registerUUID = searchParams.get('registerUUID') ?? undefined
  const oauthEmail = searchParams.get('email') ?? ''
  const isOAuthSignup = Boolean(registerUUID)
  const [step, setStep] = useState<SignUpStep>('role')
  const [role, setRole] = useState<UserRole | null>(null)

  const [email, setEmail] = useState(oauthEmail)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)

  const [codeDigits, setCodeDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('idle')
  const [codeError, setCodeError] = useState<string | undefined>()
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(CODE_DURATION_SECONDS)

  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>(null)
  const [birthDate, setBirthDate] = useState('')
  const [baseAddress, setBaseAddress] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [addressError, setAddressError] = useState<string | undefined>()
  const [isLoadingAddressSearch, setIsLoadingAddressSearch] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [parentEmail, setParentEmail] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingParent, setIsCheckingParent] = useState(false)
  const [parentProfile, setParentProfile] = useState<UserProfileResponse | null>(null)
  const [pendingChildCoords, setPendingChildCoords] = useState<
    { latitude: number; longitude: number } | undefined
  >()

  const codeValue = codeDigits.join('')
  const isCodeExpired = step === 'code' && remainingSeconds === 0
  const formattedRemainingTime = `${Math.floor(remainingSeconds / 60)}:${String(
    remainingSeconds % 60,
  ).padStart(2, '0')}`
  const hasEmailValue = email.trim().length > 0
  const isEmailAvailable = emailStatus === 'available'
  const isNameValid = KOREAN_NAME_PATTERN.test(name.trim())
  const nameError =
    name.length > 0 && !isNameValid
      ? '이름은 한글 2~10자로 입력해주세요.'
      : undefined
  const hasPasswordLengthRule = password.length >= 8 && password.length <= 20
  const hasPasswordLetterRule = /[A-Za-z]/.test(password)
  const hasPasswordNumberRule = /\d/.test(password)
  const hasPasswordSpecialRule = /[^A-Za-z0-9]/.test(password)
  const hasPasswordAllowedCharacters =
    password.length === 0 || PASSWORD_ALLOWED_PATTERN.test(password)
  const passwordError =
    password.length > 0 && !hasPasswordAllowedCharacters
      ? '공백이나 한글은 사용할 수 없어요.'
      : undefined
  const parentEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const hasParentEmailValue = parentEmail.trim().length > 0
  const isParentEmailValid = parentEmailPattern.test(parentEmail.trim())
  const parentEmailError =
    hasParentEmailValue && !isParentEmailValid
      ? '올바른 이메일 형식으로 입력해주세요.'
      : undefined
  const hasPasswordRuleMatch =
    hasPasswordLengthRule &&
    hasPasswordLetterRule &&
    hasPasswordNumberRule &&
    hasPasswordAllowedCharacters
  const passwordsMatch =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm
  const parentFormValid =
    isNameValid &&
    (isOAuthSignup || (hasPasswordRuleMatch && passwordsMatch))
  const childFormValid =
    isNameValid &&
    gender !== null &&
    birthDate.trim().length > 0 &&
    baseAddress.trim().length > 0 &&
    detailAddress.trim().length > 0 &&
    (isOAuthSignup || (hasPasswordRuleMatch && passwordsMatch)) &&
    hasParentEmailValue &&
    isParentEmailValid

  const handleCheckEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    setEmailError(undefined)

    if (!normalizedEmail) {
      setEmailStatus('idle')
      return
    }

    if (!emailPattern.test(normalizedEmail)) {
      setEmailStatus('invalid')
      return
    }

    try {
      setIsCheckingEmail(true)
      const isDuplicate = await authApi.checkEmailDuplicate(normalizedEmail)

      setEmailStatus(isDuplicate ? 'duplicate' : 'available')
      if (!isDuplicate) {
        setEmail(normalizedEmail)
      }
    } catch (error) {
      setEmailStatus('idle')
      setEmailError(
        error instanceof Error
          ? error.message
          : '이메일 중복 확인에 실패했습니다.',
      )
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const openCodeStep = async () => {
    if (!isEmailAvailable || isSendingCode) {
      return
    }

    try {
      setIsSendingCode(true)
      setEmailError(undefined)
      setCodeError(undefined)
      await authApi.sendEmailVerificationCode(email.trim().toLowerCase())
      setCodeDigits(Array(CODE_LENGTH).fill(''))
      setCodeStatus('idle')
      setRemainingSeconds(CODE_DURATION_SECONDS)
      setStep('code')
    } catch (error) {
      setEmailError(
        error instanceof Error
          ? error.message
          : '인증번호 전송에 실패했습니다.',
      )
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleCodeChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/\D/g, '').slice(-1)
    const nextDigits = [...codeDigits]

    nextDigits[index] = nextValue
    setCodeDigits(nextDigits)
    setCodeStatus('idle')
    setCodeError(undefined)

    if (nextValue && index < CODE_LENGTH - 1) {
      const nextInput = event.currentTarget.nextElementSibling
      if (nextInput instanceof HTMLInputElement) {
        nextInput.focus()
      }
    }
  }

  const handleCodeKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const previousInput = event.currentTarget.previousElementSibling
      if (previousInput instanceof HTMLInputElement) {
        previousInput.focus()
      }
    }
  }

  const handleResendCode = async () => {
    if (isSendingCode) {
      return
    }

    try {
      setIsSendingCode(true)
      setCodeError(undefined)
      await authApi.sendEmailVerificationCode(email.trim().toLowerCase())
      setCodeDigits(Array(CODE_LENGTH).fill(''))
      setCodeStatus('idle')
      setRemainingSeconds(CODE_DURATION_SECONDS)
    } catch (error) {
      setCodeError(
        error instanceof Error
          ? error.message
          : '인증번호 재전송에 실패했습니다.',
      )
    } finally {
      setIsSendingCode(false)
    }
  }

  const returnToCodeStep = () => {
    setCodeStatus('idle')
    setCodeError(undefined)
    setStep('code')
  }

  const handleVerifyCode = async () => {
    if (remainingSeconds === 0) {
      setCodeStatus('expired')
      return
    }

    if (codeValue.length !== CODE_LENGTH) {
      setCodeStatus('error')
      setCodeError('인증코드 6자리를 모두 입력해주세요.')
      return
    }

    try {
      setIsVerifyingCode(true)
      setCodeError(undefined)
      const isVerified = await authApi.verifyEmailCode(
        email.trim().toLowerCase(),
        codeValue,
      )

      if (isVerified) {
        setCodeStatus('idle')
        setStep('details')
        return
      }

      setCodeStatus('error')
    } catch (error) {
      setCodeStatus('error')
      setCodeError(
        error instanceof Error
          ? error.message
          : '인증코드 확인에 실패했습니다.',
      )
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleBirthDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
    const parts = []

    if (digits.slice(0, 4)) {
      parts.push(digits.slice(0, 4))
    }
    if (digits.slice(4, 6)) {
      parts.push(digits.slice(4, 6))
    }
    if (digits.slice(6, 8)) {
      parts.push(digits.slice(6, 8))
    }

    setBirthDate(parts.join('.'))
  }

  const handleSearchAddress = async () => {
    try {
      setIsLoadingAddressSearch(true)
      setAddressError(undefined)

      await openDaumPostcodePopup(
        async (data) => {
          const nextAddress = data.roadAddress || data.address || data.jibunAddress
          try {
            const coords = await geocodeAddress(nextAddress)
            setBaseAddress(nextAddress)
            setLatitude(coords.latitude)
            setLongitude(coords.longitude)
            setAddressError(undefined)
          } catch (error) {
            setBaseAddress(nextAddress)
            setLatitude(undefined)
            setLongitude(undefined)
            setAddressError(
              error instanceof Error ? error.message : '주소의 위도/경도를 찾지 못했습니다.',
            )
          }
        },
        '회원가입 주소 검색',
      )
    } catch {
      setAddressError('주소 검색창을 여는 데 실패했어요. 다시 시도해 주세요.')
    } finally {
      setIsLoadingAddressSearch(false)
    }
  }

  const buildSignupRequest = (
    coords?: { latitude: number; longitude: number },
  ): SignupRequest | null => {
    if (!role) {
      return null
    }

    const common = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      ...(isOAuthSignup ? { registerUUID } : { password }),
    }

    if (role === 'parent') {
      return {
        ...common,
        role: 'PARENT',
      }
    }

    if (!gender) {
      return null
    }

    return {
      ...common,
      role: 'CHILDREN',
      parentEmail: parentEmail.trim().toLowerCase(),
      birth: birthDate,
      gender: gender === 'male' ? 'MALE' : 'FEMALE',
      address: baseAddress.trim(),
      addressDetail: detailAddress.trim(),
      latitude: coords?.latitude ?? latitude,
      longitude: coords?.longitude ?? longitude,
    }
  }

  const submitSignup = async (coords?: { latitude: number; longitude: number }) => {
    const request = buildSignupRequest(coords)

    if (!request) {
      setSubmitError('회원가입 정보를 다시 확인해주세요.')
      return false
    }

    try {
      setIsSubmitting(true)
      setSubmitError(undefined)
      await authApi.signup(request)
      return true
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '회원가입에 실패했습니다.',
      )
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const openParentConfirmModal = async (coords?: {
    latitude: number
    longitude: number
  }) => {
    try {
      setIsCheckingParent(true)
      setSubmitError(undefined)

      const parent = await authApi.findParentProfile(parentEmail.trim().toLowerCase())

      setParentProfile(parent)
      setPendingChildCoords(coords)
      setModal('parent-confirm')
    } catch {
      setParentProfile(null)
      setPendingChildCoords(undefined)
      setSubmitError(undefined)
      setModal('parent-missing')
    } finally {
      setIsCheckingParent(false)
    }
  }

  const handleConfirmParent = async () => {
    const isSuccess = await submitSignup(pendingChildCoords)

    if (isSuccess) {
      setModal('complete')
      setParentProfile(null)
      setPendingChildCoords(undefined)
      return
    }

    setModal(null)
  }

  const getDetailsValidationMessage = () => {
    if (!role) {
      return '가입 유형을 선택해주세요.'
    }

    if (!isNameValid) {
      return '이름은 한글 2~10자로 입력해주세요.'
    }

    if (!isOAuthSignup && !(hasPasswordRuleMatch && passwordsMatch)) {
      return '비밀번호 조건과 비밀번호 확인을 다시 확인해주세요.'
    }

    if (role === 'child') {
      if (!gender) {
        return '성별을 선택해주세요.'
      }

      if (!birthDate.trim()) {
        return '생년월일을 입력해주세요.'
      }

      if (!baseAddress.trim()) {
        return '기본 주소를 입력해주세요.'
      }

      if (!detailAddress.trim()) {
        return '상세 주소를 입력해주세요.'
      }

      if (!hasParentEmailValue) {
        return '부모 이메일을 입력해주세요.'
      }

      if (!isParentEmailValid) {
        return '부모 이메일 형식을 다시 확인해주세요.'
      }
    }

    return '회원가입 정보를 다시 확인해주세요.'
  }

  const handleDetailsSubmit = async () => {
    setSubmitError(undefined)

    if (role === 'parent') {
      if (!parentFormValid) {
        setSubmitError(getDetailsValidationMessage())
        return
      }

      const isSuccess = await submitSignup()
      if (isSuccess) {
        setModal('complete')
      }
      return
    }

    if (!childFormValid) {
      const message = getDetailsValidationMessage()
      setSubmitError(message)
      if (!baseAddress.trim()) {
        setAddressError('기본 주소는 필수 입력 값이에요.')
      }
      return
    }

    let coords =
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : undefined

    if (!coords) {
      try {
        setIsLoadingAddressSearch(true)
        coords = await geocodeAddress(baseAddress)
        setLatitude(coords.latitude)
        setLongitude(coords.longitude)
        setAddressError(undefined)
      } catch (error) {
        setAddressError(
          error instanceof Error ? error.message : '주소의 위도/경도를 찾지 못했습니다.',
        )
        setIsLoadingAddressSearch(false)
        return
      } finally {
        setIsLoadingAddressSearch(false)
      }
    }

    await openParentConfirmModal(coords)
  }

  const handleComplete = () => {
    setModal(null)
    setStep('role')
    setRole(null)
    setEmail('')
    setEmailStatus('idle')
    setEmailError(undefined)
    setIsCheckingEmail(false)
    setIsSendingCode(false)
    setCodeDigits(Array(CODE_LENGTH).fill(''))
    setCodeStatus('idle')
    setCodeError(undefined)
    setIsVerifyingCode(false)
    setRemainingSeconds(CODE_DURATION_SECONDS)
    setName('')
    setGender(null)
    setBirthDate('')
    setBaseAddress('')
    setDetailAddress('')
    setLatitude(undefined)
    setLongitude(undefined)
    setAddressError(undefined)
    setIsLoadingAddressSearch(false)
    setPassword('')
    setPasswordConfirm('')
    setParentEmail('')
    setShowPassword(false)
    setShowPasswordConfirm(false)
    setSubmitError(undefined)
    setIsSubmitting(false)
    setIsCheckingParent(false)
    setParentProfile(null)
    setPendingChildCoords(undefined)
    onBackToLogin()
  }

  useEffect(() => {
    if (step !== 'code' || remainingSeconds <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [remainingSeconds, step])

  return (
    <>
      {step === 'role' ? (
        <SignUpStepRole
          onBackToLogin={onBackToLogin}
          onNext={() => setStep(isOAuthSignup ? 'details' : 'email')}
          onSelectRole={setRole}
          role={role}
        />
      ) : null}

      {step === 'email' ? (
        <SignUpStepEmail
          codeDigits={codeDigits}
          codeError={codeError}
          codeStatus={codeStatus}
          email={email}
          emailError={emailError}
          emailStatus={emailStatus}
          formattedRemainingTime={formattedRemainingTime}
          hasEmailValue={hasEmailValue}
          isCheckingEmail={isCheckingEmail}
          isCodeExpired={isCodeExpired}
          isEmailAvailable={isEmailAvailable}
          isSendingCode={isSendingCode}
          isVerifyingCode={isVerifyingCode}
          mode="email"
          onCheckEmail={handleCheckEmail}
          onCodeChange={handleCodeChange}
          onCodeKeyDown={handleCodeKeyDown}
          onEmailChange={(event) => {
            setEmail(event.target.value)
            setEmailStatus('idle')
          }}
          onNextEmail={openCodeStep}
          onPrevious={() => setStep('role')}
          onResendCode={handleResendCode}
          onVerifyCode={handleVerifyCode}
        />
      ) : null}

      {step === 'code' ? (
        <SignUpStepEmail
          codeDigits={codeDigits}
          codeError={codeError}
          codeStatus={codeStatus}
          email={email}
          emailError={emailError}
          emailStatus={emailStatus}
          formattedRemainingTime={formattedRemainingTime}
          hasEmailValue={hasEmailValue}
          isCheckingEmail={isCheckingEmail}
          isCodeExpired={isCodeExpired}
          isEmailAvailable={isEmailAvailable}
          isSendingCode={isSendingCode}
          isVerifyingCode={isVerifyingCode}
          mode="code"
          onCheckEmail={handleCheckEmail}
          onCodeChange={handleCodeChange}
          onCodeKeyDown={handleCodeKeyDown}
          onEmailChange={(event) => {
            setEmail(event.target.value)
            setEmailStatus('idle')
          }}
          onNextEmail={openCodeStep}
          onPrevious={() => setStep('email')}
          onResendCode={handleResendCode}
          onVerifyCode={handleVerifyCode}
        />
      ) : null}

      {step === 'details' ? (
        <SignUpStepDetails
          addressError={addressError}
          baseAddress={baseAddress}
          birthDate={birthDate}
          childFormValid={childFormValid}
          detailAddress={detailAddress}
          email={email}
          gender={gender}
          hasPasswordAllowedCharacters={hasPasswordAllowedCharacters}
          hasPasswordLetterRule={hasPasswordLetterRule}
          hasPasswordLengthRule={hasPasswordLengthRule}
          hasPasswordNumberRule={hasPasswordNumberRule}
          hasPasswordSpecialRule={hasPasswordSpecialRule}
          isLoadingAddressSearch={isLoadingAddressSearch}
          isSubmitting={isSubmitting || isCheckingParent}
          isPasswordRequired={!isOAuthSignup}
          name={name}
          nameError={nameError}
          onBirthDateChange={handleBirthDateChange}
          onDetailAddressChange={(event) => setDetailAddress(event.target.value)}
          onNameChange={(event) => setName(event.target.value)}
          onParentEmailChange={(event) => setParentEmail(event.target.value)}
          onPasswordChange={(event) => setPassword(event.target.value)}
          onPasswordConfirmChange={(event) => setPasswordConfirm(event.target.value)}
          onPrevious={() => {
            if (isOAuthSignup) {
              setStep('role')
              return
            }

            returnToCodeStep()
          }}
          onSearchAddress={handleSearchAddress}
          onSelectGender={setGender}
          onSubmit={handleDetailsSubmit}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onTogglePasswordConfirm={() => setShowPasswordConfirm((prev) => !prev)}
          parentFormValid={parentFormValid}
          parentEmail={parentEmail}
          parentEmailError={parentEmailError}
          password={password}
          passwordError={passwordError}
          passwordConfirm={passwordConfirm}
          passwordsMatch={passwordsMatch}
          role={role}
          showPassword={showPassword}
          showPasswordConfirm={showPasswordConfirm}
          submitError={submitError}
        />
      ) : null}

      <SignUpModals
        isConfirmingParent={isSubmitting}
        modal={modal}
        onClose={() => setModal(null)}
        onComplete={handleComplete}
        onConfirmParent={handleConfirmParent}
        onResetMissingParent={() => {
          setModal(null)
          setParentEmail('')
        }}
        parentEmail={parentEmail}
        parentProfile={parentProfile}
        role={role}
      />
    </>
  )
}

export default SignUpPage
