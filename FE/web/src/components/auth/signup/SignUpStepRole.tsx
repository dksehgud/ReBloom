import AuthShell from '../AuthShell'

type UserRole = 'child' | 'parent'

type SignUpStepRoleProps = {
  role: UserRole | null
  onSelectRole: (role: UserRole) => void
  onNext: () => void
  onBackToLogin: () => void
}

function SignUpStepRole({
  role,
  onSelectRole,
  onNext,
  onBackToLogin,
}: SignUpStepRoleProps) {
  return (
    <AuthShell
      bodyCentered
      description="사용자 유형을 선택해주세요"
      footer={
        <>
          <button className="auth-button is-secondary" onClick={onBackToLogin} type="button">
            이전
          </button>
          <button
            className="auth-button is-primary"
            disabled={!role}
            onClick={onNext}
            type="button"
          >
            다음
          </button>
        </>
      }
      title="회원 가입"
    >
      <div className="auth-type-grid">
        <button
          className={`auth-type-card${role === 'child' ? ' is-selected' : ''}`}
          onClick={() => onSelectRole('child')}
          type="button"
        >
          <span aria-hidden="true" className="auth-type-icon">
            🧒
          </span>
          <span>아이</span>
        </button>
        <button
          className={`auth-type-card${role === 'parent' ? ' is-selected' : ''}`}
          onClick={() => onSelectRole('parent')}
          type="button"
        >
          <span aria-hidden="true" className="auth-type-icon">
            👨‍👩‍👧
          </span>
          <span>부모</span>
        </button>
      </div>
      <p className="auth-inline-row">
        이미 계정이 있으신가요?{' '}
        <button className="auth-inline-link" onClick={onBackToLogin} type="button">
          로그인
        </button>
      </p>
    </AuthShell>
  )
}

export default SignUpStepRole
