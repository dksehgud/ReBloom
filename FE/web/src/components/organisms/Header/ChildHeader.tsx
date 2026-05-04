import type { ReactNode } from 'react'

type ChildHeaderProps = {
  title?: string
  mode?: 'brand' | 'title'
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  showDivider?: boolean
}

function ChildHeader({
  title,
  mode = 'title',
  leftSlot,
  rightSlot,
  showDivider = false,
}: ChildHeaderProps) {
  return (
    <header className={`child-header${showDivider ? ' has-divider' : ''}`}>
      <div className="child-header-inner">
        <div className="child-header-side is-left">
          {mode === 'brand' ? (
            <span className="child-header-brand">RE:BLOOM</span>
          ) : (
            leftSlot
          )}
        </div>
        <div className="child-header-center">
          {mode === 'title' && title ? (
            <h1 className="child-header-title">{title}</h1>
          ) : null}
        </div>
        <div className="child-header-side is-right">{rightSlot}</div>
      </div>
    </header>
  )
}

export default ChildHeader
