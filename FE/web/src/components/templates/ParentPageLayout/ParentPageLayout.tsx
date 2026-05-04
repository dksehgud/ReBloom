import type { ReactNode } from 'react'

type ParentPageLayoutProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  bottomNavigation?: ReactNode
}

function ParentPageLayout({
  children,
  className,
  contentClassName,
  bottomNavigation,
}: ParentPageLayoutProps) {
  return (
    <section className={`parent-page-layout${className ? ` ${className}` : ''}`}>
      <div className="parent-page-layout__surface">
        <main
          className={`parent-page-layout__content${
            contentClassName ? ` ${contentClassName}` : ''
          }`}
        >
          {children}
        </main>
        <div className="parent-page-layout__bottom-slot">
          {bottomNavigation ?? <div className="parent-page-layout__bottom-placeholder" />}
        </div>
      </div>
    </section>
  )
}

export default ParentPageLayout
