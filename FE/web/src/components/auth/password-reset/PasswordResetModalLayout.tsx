import type { ReactNode } from 'react'

type PasswordResetModalLayoutProps = {
  title: string
  currentStep: number
  totalSteps: number
  children: ReactNode
  actions: ReactNode
  onClose?: () => void
}

function PasswordResetModalLayout({
  title,
  currentStep,
  totalSteps,
  children,
  actions,
  onClose,
}: PasswordResetModalLayoutProps) {
  return (
    <div className="password-reset-overlay" role="presentation">
      <section
        aria-labelledby="password-reset-modal-title"
        aria-modal="true"
        className="password-reset-modal"
        role="dialog"
      >
        <header className="password-reset-modal-header">
          <div className="password-reset-modal-topbar">
            <h1
              className="password-reset-modal-title"
              id="password-reset-modal-title"
            >
              {title}
            </h1>
            <button
              type="button"
              className="password-reset-close-button"
              aria-label="닫기"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="password-reset-modal-divider" />
          <div className="password-reset-stepper-panel">
            <div
              aria-label={`${currentStep} / ${totalSteps} 단계`}
              className="password-reset-stepper"
            >
              {Array.from({ length: totalSteps }, (_, index) => (
                <div
                  key={`password-reset-step-${index + 1}`}
                  className="password-reset-stepper-item"
                >
                  <span
                    className={`password-reset-stepper-dot${
                      index + 1 <= currentStep ? ' is-active' : ''
                    }`}
                  >
                    {index + 1}
                  </span>
                  {index < totalSteps - 1 ? (
                    <span
                      className={`password-reset-stepper-line${
                        index + 1 < currentStep ? ' is-active' : ''
                      }`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="password-reset-modal-body">{children}</div>

        <div className="password-reset-modal-actions">{actions}</div>
      </section>
    </div>
  )
}

export default PasswordResetModalLayout
