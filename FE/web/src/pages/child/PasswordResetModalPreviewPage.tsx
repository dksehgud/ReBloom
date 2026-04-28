import PasswordResetModalLayout from '../../components/auth/password-reset/PasswordResetModalLayout'

function PasswordResetModalPreviewPage() {
  return (
    <main className="password-reset-preview-page">
      <div className="password-reset-preview-phone">
        <PasswordResetModalLayout
          title="계정 비밀번호 변경"
          currentStep={1}
          totalSteps={3}
          onClose={() => {}}
          actions={
            <>
              <button type="button" className="auth-button is-secondary">
                이전
              </button>
              <button type="button" className="auth-button is-primary">
                다음
              </button>
            </>
          }
        >
          <div className="password-reset-placeholder-group">
            <div className="password-reset-placeholder-heading" />
            <div className="password-reset-placeholder-description" />
            <div className="password-reset-placeholder-input" />
          </div>
        </PasswordResetModalLayout>
      </div>
    </main>
  )
}

export default PasswordResetModalPreviewPage
