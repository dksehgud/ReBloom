import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ParentObservationModalFrameProps = {
  children: ReactNode
  className?: string
  onClose?: () => void
}

type ScrollbarState = {
  isVisible: boolean
  thumbHeight: number
  thumbTop: number
}

const SCROLLBAR_OFFSET_FROM_BODY_TOP = 48
const MIN_SCROLLBAR_THUMB_HEIGHT = 36

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-modal__close-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 5L15 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ParentObservationModalFrame({
  children,
  className,
  onClose,
}: ParentObservationModalFrameProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrollbar, setScrollbar] = useState<ScrollbarState>({
    isVisible: false,
    thumbHeight: MIN_SCROLLBAR_THUMB_HEIGHT,
    thumbTop: 0,
  })

  const updateScrollbar = useCallback(() => {
    const body = bodyRef.current

    if (!body) {
      return
    }

    const maxScrollTop = body.scrollHeight - body.clientHeight
    const trackHeight = Math.max(
      body.clientHeight - SCROLLBAR_OFFSET_FROM_BODY_TOP,
      0,
    )

    if (maxScrollTop <= 1 || trackHeight <= 0) {
      setScrollbar((current) =>
        current.isVisible
          ? {
              isVisible: false,
              thumbHeight: MIN_SCROLLBAR_THUMB_HEIGHT,
              thumbTop: 0,
            }
          : current,
      )
      return
    }

    const thumbHeight = Math.max(
      (body.clientHeight / body.scrollHeight) * trackHeight,
      MIN_SCROLLBAR_THUMB_HEIGHT,
    )
    const thumbTop =
      (body.scrollTop / maxScrollTop) * Math.max(trackHeight - thumbHeight, 0)

    setScrollbar((current) => {
      const next = {
        isVisible: true,
        thumbHeight,
        thumbTop,
      }

      if (
        current.isVisible === next.isVisible &&
        Math.abs(current.thumbHeight - next.thumbHeight) < 0.5 &&
        Math.abs(current.thumbTop - next.thumbTop) < 0.5
      ) {
        return current
      }

      return next
    })
  }, [])

  useLayoutEffect(() => {
    const body = bodyRef.current

    if (!body) {
      return undefined
    }

    const animationFrame = window.requestAnimationFrame(updateScrollbar)
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateScrollbar)

    resizeObserver?.observe(body)
    Array.from(body.children).forEach((child) => {
      resizeObserver?.observe(child)
    })

    window.addEventListener('resize', updateScrollbar)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateScrollbar)
    }
  }, [children, updateScrollbar])

  return (
    <div className="parent-observation-modal-overlay" role="presentation">
      <section
        className={`parent-observation-modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {onClose ? (
          <button
            type="button"
            className="parent-observation-modal__close-button"
            aria-label="닫기"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        ) : null}
        <div
          ref={bodyRef}
          className="parent-observation-modal__body"
          onScroll={updateScrollbar}
        >
          {children}
        </div>
        {scrollbar.isVisible ? (
          <div
            className="parent-observation-modal__scrollbar"
            aria-hidden="true"
          >
            <span
              className="parent-observation-modal__scrollbar-thumb"
              style={{
                height: `${scrollbar.thumbHeight}px`,
                transform: `translateY(${scrollbar.thumbTop}px)`,
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default ParentObservationModalFrame
