import type { ReactNode } from 'react'

import CommonModalLayout from '../../organisms/Modal/CommonModalLayout'

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
    <CommonModalLayout
      actions={actions}
      actionsClassName="password-reset-modal-actions"
      bodyClassName="password-reset-modal-body"
      className="password-reset-modal"
      headerContent={
        <div className="password-reset-stepper-panel">
          <div
            aria-label={`${currentStep} / ${totalSteps} 단계`}
            className="password-reset-stepper"
          >
            {Array.from({ length: totalSteps }, (_, index) => {
              const step = index + 1
              const isActive = step === currentStep
              const isComplete = step < currentStep

              return (
                <div
                  key={`password-reset-step-${step}`}
                  className="password-reset-stepper-item"
                >
                  <span
                    className={`password-reset-stepper-dot${
                      isActive ? ' is-active' : ''
                    }${isComplete ? ' is-complete' : ''}`}
                  >
                    {isComplete ? '✓' : step}
                  </span>
                  {index < totalSteps - 1 ? (
                    <span
                      className={`password-reset-stepper-line${
                        step < currentStep ? ' is-active' : ''
                      }`}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      }
      onClose={onClose}
      overlayClassName="password-reset-overlay"
      showDivider
      title={title}
    >
      {children}
    </CommonModalLayout>
  )
}

export default PasswordResetModalLayout
