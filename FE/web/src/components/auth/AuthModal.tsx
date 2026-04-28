import type { ReactNode } from 'react'

type AuthModalProps = {
  title: string
  children: ReactNode
  actions: ReactNode
}

function AuthModal({ title, children, actions }: AuthModalProps) {
  return (
    <div className="auth-overlay" role="presentation">
      <section
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="auth-modal"
        role="dialog"
      >
        <h2 className="auth-modal-title" id="auth-modal-title">
          {title}
        </h2>
        {children}
        <div className="auth-modal-actions">{actions}</div>
      </section>
    </div>
  )
}

export default AuthModal
