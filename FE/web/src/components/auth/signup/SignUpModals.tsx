import AuthModal from '../AuthModal'

type UserRole = 'child' | 'parent'
type ModalType = 'complete' | null

type SignUpModalsProps = {
  modal: ModalType
  role: UserRole | null
  onComplete: () => void
}

function SignUpModals({
  modal,
  role,
  onComplete,
}: SignUpModalsProps) {
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
            ? '아이 회원가입이 완료되었습니다.'
            : '회원가입이 완료되었습니다.'}
        </div>
      </AuthModal>
    )
  }

  return null
}

export default SignUpModals
