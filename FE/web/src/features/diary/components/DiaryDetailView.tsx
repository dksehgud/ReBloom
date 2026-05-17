import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import DiaryEmotionIcon from './DiaryEmotionIcon'
import type { DiaryEmotionKey } from '../constants/diaryEmotions'

type DiaryDetailViewProps = {
  dateLabel: string
  emotionKey: DiaryEmotionKey
  content: string
  title?: string
  onBack?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

type ScrollbarState = {
  isVisible: boolean
  thumbHeight: number
  thumbTop: number
}

const MIN_SCROLLBAR_THUMB_HEIGHT = 32

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 6.5L9 12L14.5 17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 4.75H15M5.75 7H18.25M17 7L16.12 18.43C16.05 19.37 15.27 20.1 14.33 20.1H9.67C8.73 20.1 7.95 19.37 7.88 18.43L7 7M10 10.25V16.25M14 10.25V16.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 19.25L8.1 18.5L17.4 9.2C18.13 8.47 18.13 7.28 17.4 6.55L17.2 6.35C16.47 5.62 15.28 5.62 14.55 6.35L5.25 15.65L4.75 19.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M13.5 7.5L16.25 10.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function DiaryDetailView({
  dateLabel,
  emotionKey,
  content,
  title = '오늘의 일기',
  onBack,
  onEdit,
  onDelete,
}: DiaryDetailViewProps) {
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

    if (maxScrollTop <= 1) {
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

    const trackHeight = body.clientHeight
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
  }, [content, updateScrollbar])

  return (
    <section className="diary-detail-view">
      <header className="diary-detail-view__header">
        <button
          type="button"
          className="diary-detail-view__icon-button"
          aria-label="뒤로가기"
          onClick={onBack}
        >
          <BackIcon />
        </button>
        <div className="diary-detail-view__actions">
          <button
            type="button"
            className="diary-detail-view__icon-button is-muted"
            aria-label="일기 수정"
            onClick={onEdit}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="diary-detail-view__icon-button is-muted"
            aria-label="일기 삭제"
            onClick={onDelete}
          >
            <TrashIcon />
          </button>
        </div>
      </header>

      <div className="diary-detail-view__content">
        <div className={`diary-detail-view__mood diary-detail-view__mood--${emotionKey}`}>
          <DiaryEmotionIcon
            emotionKey={emotionKey}
            size={26}
            className="diary-detail-view__mood-icon"
          />
        </div>

        <p className="diary-detail-view__date">{dateLabel}</p>

        <section className="diary-detail-view__section">
          <h2 className="diary-detail-view__title">{title}</h2>

          <div className="diary-detail-view__body-card">
            <div
              ref={bodyRef}
              className="diary-detail-view__body-scroll"
              onScroll={updateScrollbar}
            >
              <p className="diary-detail-view__body-text">{content}</p>
            </div>
            {scrollbar.isVisible ? (
              <div className="diary-detail-view__scrollbar" aria-hidden="true">
                <span
                  className="diary-detail-view__scrollbar-thumb"
                  style={{
                    height: `${scrollbar.thumbHeight}px`,
                    transform: `translateY(${scrollbar.thumbTop}px)`,
                  }}
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  )
}

export type { DiaryDetailViewProps }

export default DiaryDetailView
