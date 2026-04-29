import type { ReactNode } from 'react'

type DiaryCalendarEntry = {
  day: number
  mood: ReactNode
  tone: 'mint' | 'amber' | 'lavender'
}

type DiaryCalendarProps = {
  year: number
  month: number
  entries?: DiaryCalendarEntry[]
  onPreviousMonth?: () => void
  onNextMonth?: () => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOffset(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

function DiaryCalendar({
  year,
  month,
  entries = [],
  onPreviousMonth,
  onNextMonth,
}: DiaryCalendarProps) {
  const firstDayOffset = getFirstDayOffset(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7
  const entryMap = new Map(entries.map((entry) => [entry.day, entry]))

  return (
    <section className="diary-calendar">
      <div className="diary-calendar__header">
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

      <div className="diary-calendar__weekday-row">
        {DAY_LABELS.map((label) => (
          <span key={label} className="diary-calendar__weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="diary-calendar__grid">
        {Array.from({ length: totalCells }, (_, index) => {
          const day = index - firstDayOffset + 1
          const isInMonth = day > 0 && day <= daysInMonth
          const entry = isInMonth ? entryMap.get(day) : undefined

          return (
            <div
              key={`calendar-cell-${index + 1}`}
              className={`diary-calendar__cell${
                entry ? ' has-entry' : ''
              }`}
            >
              {isInMonth ? (
                <>
                  <span className="diary-calendar__day">{day}</span>
                  <span
                    className={`diary-calendar__mood${
                      entry ? ` diary-calendar__mood--${entry.tone}` : ' is-empty'
                    }`}
                    aria-hidden={entry ? undefined : 'true'}
                  >
                    {entry?.mood}
                  </span>
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export type { DiaryCalendarEntry, DiaryCalendarProps }

export default DiaryCalendar
