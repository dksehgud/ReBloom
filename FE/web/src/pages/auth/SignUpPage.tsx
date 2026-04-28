import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from 'react'

import SignUpModals from '../../components/auth/signup/SignUpModals'
import SignUpStepDetails from '../../components/auth/signup/SignUpStepDetails'
import SignUpStepEmail from '../../components/auth/signup/SignUpStepEmail'
import SignUpStepRole from '../../components/auth/signup/SignUpStepRole'

type UserRole = 'child' | 'parent'
type SignUpStep = 'role' | 'email' | 'code' | 'details'
type ModalType = 'complete' | 'parent-confirm' | 'parent-missing' | null
type EmailStatus = 'idle' | 'available' | 'duplicate' | 'invalid'
type CodeStatus = 'idle' | 'error' | 'expired'
type Gender = 'male' | 'female' | null

const CODE_LENGTH = 6
const CODE_DURATION_SECONDS = 180

type SignUpPageProps = {
  onBackToLogin: () => void
}

function SignUpPage({ onBackToLogin }: SignUpPageProps) {
  const [step, setStep] = useState<SignUpStep>('role')
  const [role, setRole] = useState<UserRole | null>(null)

  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')

  const [codeDigits, setCodeDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(CODE_DURATION_SECONDS)

  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>(null)
  const [birthDate, setBirthDate] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [parentEmail, setParentEmail] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)

  const codeValue = codeDigits.join('')
  const isCodeExpired = step === 'code' && remainingSeconds === 0
  const formattedRemainingTime = `${Math.floor(remainingSeconds / 60)}:${String(
    remainingSeconds % 60,
  ).padStart(2, '0')}`
  const hasEmailValue = email.trim().length > 0
  const isEmailAvailable = emailStatus === 'available'
  const hasPasswordLengthRule = password.length >= 8 && password.length <= 20
  const hasPasswordNumberRule = /\d/.test(password)
  const hasPasswordSpecialRule = /[^A-Za-z0-9]/.test(password)
  const hasPasswordRuleMatch =
    hasPasswordLengthRule &&
    hasPasswordNumberRule &&
    hasPasswordSpecialRule
  const passwordsMatch =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm

  const parentFormValid =
    name.trim().length > 0 && hasPasswordRuleMatch && passwordsMatch
  const childFormValid =
    name.trim().length > 0 &&
    gender !== null &&
    birthDate.trim().length > 0 &&
    hasPasswordRuleMatch &&
    passwordsMatch &&
    parentEmail.trim().length > 0

  const handleCheckEmail = () => {
    const normalizedEmail = email.trim().toLowerCase()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!normalizedEmail) {
      setEmailStatus('idle')
      return
    }

    if (!emailPattern.test(normalizedEmail)) {
      setEmailStatus('invalid')
      return
    }

    if (
      normalizedEmail === 'exist@naver.com' ||
      normalizedEmail === 'duplicate@naver.com'
    ) {
      setEmailStatus('duplicate')
      return
    }

    setEmailStatus('available')
  }

  const openCodeStep = () => {
    setCodeDigits(Array(CODE_LENGTH).fill(''))
    setCodeStatus('idle')
    setRemainingSeconds(CODE_DURATION_SECONDS)
    setStep('code')
  }

  const handleCodeChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/\D/g, '').slice(-1)
    const nextDigits = [...codeDigits]

    nextDigits[index] = nextValue
    setCodeDigits(nextDigits)
    setCodeStatus('idle')

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

  const handleResendCode = () => {
    setCodeDigits(Array(CODE_LENGTH).fill(''))
    setCodeStatus('idle')
    setRemainingSeconds(CODE_DURATION_SECONDS)
  }

  const handleVerifyCode = () => {
    if (remainingSeconds === 0) {
      setCodeStatus('expired')
      return
    }

    if (codeValue === '123456') {
      setCodeStatus('idle')
      setStep('details')
      return
    }

    setCodeStatus('error')
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

  const handleDetailsSubmit = () => {
    if (role === 'parent') {
      if (!parentFormValid) {
        return
      }

      setModal('complete')
      return
    }

    if (!childFormValid) {
      return
    }

    if (parentEmail.trim().toLowerCase().includes('missing')) {
      setModal('parent-missing')
      return
    }

    setModal('parent-confirm')
  }

  const handleCloseModal = () => {
    setModal(null)
  }

  const handleConfirmParent = () => {
    setModal('complete')
  }

  const handleResetMissingParent = () => {
    setModal(null)
    setParentEmail('')
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
          onNext={() => setStep('email')}
          onSelectRole={setRole}
          role={role}
        />
      ) : null}

      {step === 'email' ? (
        <SignUpStepEmail
          codeDigits={codeDigits}
          codeStatus={codeStatus}
          email={email}
          emailStatus={emailStatus}
          formattedRemainingTime={formattedRemainingTime}
          hasEmailValue={hasEmailValue}
          isCodeExpired={isCodeExpired}
          isEmailAvailable={isEmailAvailable}
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
          codeStatus={codeStatus}
          email={email}
          emailStatus={emailStatus}
          formattedRemainingTime={formattedRemainingTime}
          hasEmailValue={hasEmailValue}
          isCodeExpired={isCodeExpired}
          isEmailAvailable={isEmailAvailable}
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
          birthDate={birthDate}
          childFormValid={childFormValid}
          email={email}
          gender={gender}
          hasPasswordLengthRule={hasPasswordLengthRule}
          hasPasswordNumberRule={hasPasswordNumberRule}
          hasPasswordSpecialRule={hasPasswordSpecialRule}
          name={name}
          onBirthDateChange={handleBirthDateChange}
          onNameChange={(event) => setName(event.target.value)}
          onParentEmailChange={(event) => setParentEmail(event.target.value)}
          onPasswordChange={(event) => setPassword(event.target.value)}
          onPasswordConfirmChange={(event) => setPasswordConfirm(event.target.value)}
          onPrevious={openCodeStep}
          onSelectGender={setGender}
          onSubmit={handleDetailsSubmit}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onTogglePasswordConfirm={() => setShowPasswordConfirm((prev) => !prev)}
          parentEmail={parentEmail}
          parentFormValid={parentFormValid}
          password={password}
          passwordConfirm={passwordConfirm}
          passwordsMatch={passwordsMatch}
          role={role}
          showPassword={showPassword}
          showPasswordConfirm={showPasswordConfirm}
        />
      ) : null}

      <SignUpModals
        modal={modal}
        onClose={handleCloseModal}
        onConfirmParent={handleConfirmParent}
        onResetMissingParent={handleResetMissingParent}
        parentEmail={parentEmail}
        role={role}
      />
    </>
  )
}

export default SignUpPage
