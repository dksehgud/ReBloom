import type { ReactNode } from 'react'

import rebloomLogo from '../../../assets/rebloom-logo.png'

type CounselorAuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

function CounselorAuthLayout({
  title,
  description,
  children,
  footer,
}: CounselorAuthLayoutProps) {
  const isDescriptionPlaceholder = description === 'Sign in'

  return (
    <main className="counselor-auth-shell">
      <section className="counselor-auth-frame">
        <aside className="counselor-auth-brand-panel" aria-label="Re:Bloom">
          <img
            src={rebloomLogo}
            alt="Re:Bloom"
            className="counselor-auth-brand-logo"
          />
        </aside>

        <section className="counselor-auth-content-panel">
          <div className="counselor-auth-card">
            <header className="counselor-auth-card-header">
              <h2 className="counselor-auth-card-title">{title}</h2>
              <p
                className="counselor-auth-card-description"
                aria-hidden={isDescriptionPlaceholder || undefined}
                style={
                  isDescriptionPlaceholder
                    ? { visibility: 'hidden' }
                    : undefined
                }
              >
                {description}
              </p>
            </header>
            <div className="counselor-auth-card-body">{children}</div>
            {footer ? (
              <footer className="counselor-auth-card-footer">{footer}</footer>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  )
}

export default CounselorAuthLayout
