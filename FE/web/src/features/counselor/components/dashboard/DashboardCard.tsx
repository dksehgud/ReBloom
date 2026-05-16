import { useState, type CSSProperties, type ReactNode } from 'react'
import { FiInfo } from 'react-icons/fi'

type DashboardCardProps = {
  title: string
  children: ReactNode
  className?: string
  info?: string
  style?: CSSProperties
}

function DashboardCard({ title, children, className, info, style }: DashboardCardProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  return (
    <section
      className={`counselor-dashboard-card${className ? ` ${className}` : ''}`}
      style={style}
    >
      <div
        className={`counselor-dashboard-card-title${
          isInfoOpen ? ' is-info-open' : ''
        }`}
      >
        <h3>{title}</h3>
        {info ? (
          <span className="counselor-dashboard-info-wrap">
            <button
              type="button"
              className="counselor-dashboard-info-button"
              aria-label={`${title} 설명 보기`}
              aria-expanded={isInfoOpen}
              onClick={(event) => {
                event.stopPropagation()
                setIsInfoOpen((current) => !current)
              }}
            >
              <FiInfo aria-hidden="true" />
            </button>
            {isInfoOpen ? (
              <span
                className="counselor-dashboard-tooltip-row"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <span className="counselor-dashboard-tooltip" role="note">
                  {info}
                </span>
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export default DashboardCard
