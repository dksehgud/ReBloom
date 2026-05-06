import type { ReactNode } from 'react'

type ParentObservationModalFrameProps = {
  children: ReactNode
  className?: string
  onClose?: () => void
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-modal__close-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 5L15 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ParentObservationModalFrame({
  children,
  className,
  onClose,
}: ParentObservationModalFrameProps) {
  return (
    <div className="parent-observation-modal-overlay" role="presentation">
      <section
        className={`parent-observation-modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {onClose ? (
          <button
            type="button"
            className="parent-observation-modal__close-button"
            aria-label="닫기"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        ) : null}
        {children}
      </section>
    </div>
  )
}

export default ParentObservationModalFrame
