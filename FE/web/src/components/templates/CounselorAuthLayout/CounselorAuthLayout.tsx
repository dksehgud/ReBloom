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
  return (
    <main className="counselor-auth-shell">
      <section className="counselor-auth-frame">
        <aside className="counselor-auth-brand-panel">
          <img
            src={rebloomLogo}
            alt="Re:Bloom"
            className="counselor-auth-brand-logo"
          />
          <div className="counselor-auth-brand-copy">
            <p className="counselor-auth-brand-eyebrow">Counselor Dashboard</p>
            <h1 className="counselor-auth-brand-title">
              아이의 감정 흐름을
              <br />
              더 깊이 이해하는
              <br />
              상담사 대시보드
            </h1>
            <p className="counselor-auth-brand-description">
              리블룸 상담사 대시보드에서 최근 표현 분석, 감정 흐름,
              관찰 기록 코멘트를 한 번에 확인해보세요.
            </p>
          </div>
        </aside>

        <section className="counselor-auth-content-panel">
          <div className="counselor-auth-card">
            <header className="counselor-auth-card-header">
              <h2 className="counselor-auth-card-title">{title}</h2>
              <p className="counselor-auth-card-description">{description}</p>
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
