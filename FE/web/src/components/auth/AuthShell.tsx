import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  footerStacked?: boolean
  bodyCentered?: boolean
}

function AuthShell({
  title,
  description,
  children,
  footer,
  footerStacked = false,
  bodyCentered = false,
}: AuthShellProps) {
  return (
    <div className="app-shell">
      <div className="phone-shell">
        <section className="auth-screen">
          <div className="auth-content">
            <header className="auth-title-group">
              <h1 className="auth-title">{title}</h1>
              {description ? (
                <div className="auth-description">{description}</div>
              ) : null}
            </header>
            <div className={`auth-body${bodyCentered ? ' is-centered' : ''}`}>
              {children}
            </div>
          </div>
          {footer ? (
            <div className={`auth-footer${footerStacked ? ' is-stacked' : ''}`}>
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default AuthShell
