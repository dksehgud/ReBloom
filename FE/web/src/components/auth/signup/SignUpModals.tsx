import AuthInput from '../AuthInput'
import AuthModal from '../AuthModal'

type UserRole = 'child' | 'parent'
type ModalType = 'complete' | 'parent-confirm' | 'parent-missing' | null

type ParentProfile = {
  email: string
  name: string
}

type SignUpModalsProps = {
  modal: ModalType
  role: UserRole | null
  onComplete: () => void
  parentProfile?: ParentProfile | null
  parentEmail?: string
  isConfirmingParent?: boolean
  onClose?: () => void
  onConfirmParent?: () => void
  onResetMissingParent?: () => void
}

function SignUpModals({
  modal,
  role,
  onComplete,
  parentProfile,
  parentEmail = '',
  isConfirmingParent = false,
  onClose,
  onConfirmParent,
  onResetMissingParent,
}: SignUpModalsProps) {
  if (modal === 'parent-confirm') {
    return (
      <AuthModal
        actions={
          <>
            <button
              className="auth-button is-neutral"
              disabled={isConfirmingParent}
              onClick={onClose}
              type="button"
            >
              이전
            </button>
            <button
              className="auth-button is-primary"
              disabled={isConfirmingParent}
              onClick={onConfirmParent}
              type="button"
            >
              {isConfirmingParent ? '가입 중' : '확인'}
            </button>
          </>
        }
        title="부모 확인"
      >
        <p className="auth-modal-message">
          해당 부모님 정보로 연결하시겠습니까?
        </p>
        <div className="auth-modal-fields">
          <AuthInput label="부모 이름" readOnly value={parentProfile?.name ?? ''} />
          <AuthInput
            label="부모 이메일"
            readOnly
            value={parentProfile?.email ?? parentEmail}
          />
        </div>
      </AuthModal>
    )
  }

  if (modal === 'parent-missing') {
    return (
      <AuthModal
        actions={
          <>
            <button
              className="auth-button is-neutral"
              onClick={onResetMissingParent}
              type="button"
            >
              이전
            </button>
            <button className="auth-button is-primary" onClick={onClose} type="button">
              확인
            </button>
          </>
        }
        title="부모 확인"
      >
        <div className="auth-modal-panel">
          등록된 부모 계정을 찾을 수 없습니다.
          <br />
          이메일을 다시 확인해주세요.
        </div>
      </AuthModal>
    )
  }

  if (modal === 'complete') {
    return (
      <AuthModal
        actions={
          <button className="auth-button is-primary" onClick={onComplete} type="button">
            확인
          </button>
        }
        title="회원가입 완료"
      >
        <div className="auth-modal-panel">
          {role === 'child'
            ? '부모 계정 연결이 완료되었습니다.'
            : '회원가입이 완료되었습니다.'}
        </div>
      </AuthModal>
    )
  }

  return null
}

export default SignUpModals
