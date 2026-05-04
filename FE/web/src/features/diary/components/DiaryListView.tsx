import DiaryEmotionIcon from './DiaryEmotionIcon'
import type { DiaryEmotionKey } from '../constants/diaryEmotions'

type DiaryListItem = {
  id: string
  dateLabel: string
  summary: string
  emotionKey: DiaryEmotionKey
}

type DiaryListViewProps = {
  year: number
  month: number
  items: DiaryListItem[]
  onPreviousMonth?: () => void
  onNextMonth?: () => void
  onItemClick?: (item: DiaryListItem) => void
}

function EmptyBookIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="48"
      viewBox="0 0 48 48"
      width="48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 13.5C21.6 11.83 18.56 11 15.5 11H11V34H15.5C18.56 34 21.6 34.83 24 36.5M24 13.5C26.4 11.83 29.44 11 32.5 11H37V34H32.5C29.44 34 26.4 34.83 24 36.5M24 13.5V36.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  )
}

function DiaryListView({
  year,
  month,
  items,
  onPreviousMonth,
  onNextMonth,
  onItemClick,
}: DiaryListViewProps) {
  const monthNavigation = (
    <div className="diary-calendar__header diary-list-view__header">
      <div className="diary-calendar__month-navigation">
        <button
          type="button"
          className="diary-calendar__month-button"
          aria-label="이전 달"
          onClick={onPreviousMonth}
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="16"
            viewBox="0 0 24 24"
            width="16"
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
        </button>

        <h2 className="diary-calendar__title">
          {year}년 {month}월
        </h2>

        <button
          type="button"
          className="diary-calendar__month-button"
          aria-label="다음 달"
          onClick={onNextMonth}
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="16"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.5 6.5L15 12L9.5 17.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.9"
            />
          </svg>
        </button>
      </div>
    </div>
  )

  if (items.length === 0) {
    return (
      <section className="diary-list-view diary-list-view--empty">
        {monthNavigation}
        <div className="diary-list-view__empty-icon">
          <EmptyBookIcon />
        </div>
        <p className="diary-list-view__empty-text">아직 작성한 일기가 없어요</p>
      </section>
    )
  }

  return (
    <section className="diary-list-view">
      {monthNavigation}
      <div className="diary-list-view__list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="diary-list-card"
            onClick={() => onItemClick?.(item)}
          >
            <span className="diary-list-card__date">{item.dateLabel}</span>
            <span className="diary-list-card__summary">{item.summary}</span>
            <span
              className={`diary-list-card__mood diary-list-card__mood--${item.emotionKey}`}
              aria-hidden="true"
            >
              <DiaryEmotionIcon
                emotionKey={item.emotionKey}
                size={24}
                className="diary-list-card__mood-icon"
              />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export type { DiaryListItem, DiaryListViewProps }

export default DiaryListView
