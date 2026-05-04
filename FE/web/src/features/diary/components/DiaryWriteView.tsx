import type { ChangeEventHandler } from 'react'

import DiaryEmotionIcon from './DiaryEmotionIcon'
import type { DiaryEmotionKey } from '../constants/diaryEmotions'

type DiaryWriteViewProps = {
  dateLabel: string
  content: string
  emotionKey?: DiaryEmotionKey | null
  placeholder?: string
  maxLength?: number
  isSubmitDisabled?: boolean
  onBack?: () => void
  onMoodClick?: () => void
  onContentChange?: ChangeEventHandler<HTMLTextAreaElement>
  onSubmit?: () => void
}

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

function DiaryWriteView({
  dateLabel,
  content,
  emotionKey = null,
  placeholder = '오늘 하루를 기록해보세요.',
  maxLength = 2000,
  isSubmitDisabled = false,
  onBack,
  onMoodClick,
  onContentChange,
  onSubmit,
}: DiaryWriteViewProps) {
  return (
    <section className="diary-write-view">
      <header className="diary-write-view__header">
        <button
          type="button"
          className="diary-write-view__icon-button"
          aria-label="뒤로가기"
          onClick={onBack}
        >
          <BackIcon />
        </button>

        <button
          type="button"
          className="diary-write-view__save-button"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
        >
          저장
        </button>
      </header>

      <div className="diary-write-view__content">
        <button
          type="button"
          className={`diary-write-view__mood-button${
            emotionKey ? ` diary-write-view__mood-button--${emotionKey}` : ' is-empty'
          }`}
          aria-label="감정 선택"
          onClick={onMoodClick}
        >
          {emotionKey ? (
            <DiaryEmotionIcon
              emotionKey={emotionKey}
              size={26}
              className="diary-write-view__mood-image"
            />
          ) : (
            <span aria-hidden="true">+</span>
          )}
        </button>

        <p className="diary-write-view__date">{dateLabel}</p>

        <section className="diary-write-view__section diary-write-view__section--body">
          <div className="diary-write-view__title-row">
            <h2 className="diary-write-view__title">오늘의 일기</h2>
          </div>

          <div className="diary-write-view__textarea-card">
            <textarea
              className="diary-write-view__textarea"
              value={content}
              onChange={onContentChange}
              maxLength={maxLength}
              placeholder={placeholder}
            />
          </div>

          <div className="diary-write-view__count-row">
            <span className="diary-write-view__count">
              {content.length}/{maxLength}
            </span>
          </div>
        </section>
      </div>
    </section>
  )
}

export type { DiaryWriteViewProps }

export default DiaryWriteView
