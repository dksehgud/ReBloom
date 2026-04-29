import type { ReactNode } from 'react'

type MobilePageLayoutProps = {
  header?: ReactNode
  children: ReactNode
  bottomNavigation?: ReactNode
  className?: string
  contentClassName?: string
}

function MobilePageLayout({
  header,
  children,
  bottomNavigation,
  className,
  contentClassName,
}: MobilePageLayoutProps) {
  return (
    <section
      className={`mobile-page-layout${className ? ` ${className}` : ''}`}
    >
      <div className="mobile-page-surface">
        {header ? <header className="mobile-page-header-slot">{header}</header> : null}
        <main
          className={`mobile-page-content${
            contentClassName ? ` ${contentClassName}` : ''
          }`}
        >
          {children}
        </main>
        {bottomNavigation ? (
          <div className="mobile-page-bottom-slot">{bottomNavigation}</div>
        ) : null}
      </div>
    </section>
  )
}

export default MobilePageLayout
