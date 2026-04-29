import type { ReactNode } from 'react'

type CommonModalLayoutProps = {
  title: string
  children: ReactNode
  actions?: ReactNode
  onClose?: () => void
  headerContent?: ReactNode
  className?: string
  overlayClassName?: string
  bodyClassName?: string
  actionsClassName?: string
  titleAlign?: 'left' | 'center'
  showDivider?: boolean
}

function joinClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ')
}

function CommonModalLayout({
  title,
  children,
  actions,
  onClose,
  headerContent,
  className,
  overlayClassName,
  bodyClassName,
  actionsClassName,
  titleAlign = 'left',
  showDivider = false,
}: CommonModalLayoutProps) {
  const titleId = `common-modal-title-${title
    .toLowerCase()
    .replace(/\s+/g, '-')}`

  return (
    <div
      className={joinClassNames('common-modal-overlay', overlayClassName)}
      role="presentation"
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={joinClassNames('common-modal', className)}
        role="dialog"
      >
        <header className="common-modal-header">
          <div className="common-modal-topbar">
            <h2
              className={joinClassNames(
                'common-modal-title',
                titleAlign === 'center' && 'is-center',
              )}
              id={titleId}
            >
              {title}
            </h2>
            {onClose ? (
              <button
                type="button"
                className="common-modal-close-button"
                aria-label="닫기"
                onClick={onClose}
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 6L18 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          {showDivider ? <div className="common-modal-divider" /> : null}
          {headerContent ? (
            <div className="common-modal-header-content">{headerContent}</div>
          ) : null}
        </header>

        <div className={joinClassNames('common-modal-body', bodyClassName)}>
          {children}
        </div>

        {actions ? (
          <div
            className={joinClassNames('common-modal-actions', actionsClassName)}
          >
            {actions}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default CommonModalLayout
