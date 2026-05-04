import type { ReactNode } from 'react'

type SettingsItemProps = {
  label: string
  description?: string
  trailing?: ReactNode
  onClick?: () => void
  showChevron?: boolean
  showDivider?: boolean
  danger?: boolean
  disabled?: boolean
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function SettingsItem({
  label,
  description,
  trailing,
  onClick,
  showChevron = false,
  showDivider = true,
  danger = false,
  disabled = false,
}: SettingsItemProps) {
  const isInteractive = Boolean(onClick) && !disabled
  const className = `settings-item${showDivider ? ' has-divider' : ''}${
    danger ? ' is-danger' : ''
  }${disabled ? ' is-disabled' : ''}`

  const content = (
    <>
      <div className="settings-item-copy">
        <span className="settings-item-label">{label}</span>
        {description ? (
          <span className="settings-item-description">{description}</span>
        ) : null}
      </div>
      <div className="settings-item-trailing">
        {trailing}
        {showChevron ? (
          <span className="settings-item-chevron">
            <ChevronRightIcon />
          </span>
        ) : null}
      </div>
    </>
  )

  if (isInteractive) {
    return (
      <button
        type="button"
        className={`${className} is-button`}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

export default SettingsItem
