import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
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
  const infoButtonRef = useRef<HTMLButtonElement | null>(null)
  const tooltipRef = useRef<HTMLSpanElement | null>(null)

  const updateTooltipArrowPosition = useCallback(() => {
    const infoButton = infoButtonRef.current
    const tooltip = tooltipRef.current

    if (!infoButton || !tooltip) {
      return
    }

    const infoButtonRect = infoButton.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const arrowLeft =
      infoButtonRect.left + infoButtonRect.width / 2 - tooltipRect.left
    const boundedArrowLeft = Math.max(
      12,
      Math.min(tooltipRect.width - 12, arrowLeft),
    )

    tooltip.style.setProperty('--tooltip-arrow-left', `${boundedArrowLeft}px`)
  }, [])

  useLayoutEffect(() => {
    if (!isInfoOpen) {
      return undefined
    }

    updateTooltipArrowPosition()
    window.addEventListener('resize', updateTooltipArrowPosition)

    return () => {
      window.removeEventListener('resize', updateTooltipArrowPosition)
    }
  }, [isInfoOpen, updateTooltipArrowPosition])

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
              ref={infoButtonRef}
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
                <span
                  ref={tooltipRef}
                  className="counselor-dashboard-tooltip"
                  role="note"
                >
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
