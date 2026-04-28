import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  footerStacked?: boolean
  bodyCentered?: boolean
  bodyScrollable?: boolean
  screenClassName?: string
}

function AuthShell({
  title,
  description,
  children,
  footer,
  footerStacked = false,
  bodyCentered = false,
  bodyScrollable = false,
  screenClassName,
}: AuthShellProps) {
  return (
    <section className={`auth-screen${screenClassName ? ` ${screenClassName}` : ''}`}>
      <div className="auth-content">
        <header className="auth-title-group">
          <h1 className="auth-title">{title}</h1>
          {description ? (
            <div className="auth-description">{description}</div>
          ) : null}
        </header>
        <div
          className={`auth-body${bodyCentered ? ' is-centered' : ''}${
            bodyScrollable ? ' is-scrollable' : ''
          }`}
        >
          {children}
        </div>
      </div>
      {footer ? (
        <div className={`auth-footer${footerStacked ? ' is-stacked' : ''}`}>
          {footer}
        </div>
      ) : null}
    </section>
  )
}

export default AuthShell
