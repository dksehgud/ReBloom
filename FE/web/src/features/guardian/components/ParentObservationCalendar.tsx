type ParentObservationCalendarDay = {
  day: number | null
  hasRecord?: boolean
}

type ParentObservationCalendarProps = {
  year: number
  month: number
  markedDays?: number[]
  selectedDay?: number | null
  onPreviousMonth?: () => void
  onNextMonth?: () => void
  onSelectDay?: (day: number) => void
}

const weekLabels = ['일', '월', '화', '수', '목', '금', '토']

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-calendar__nav-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 5L7.5 10L12.5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-calendar__nav-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOffset(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

function buildCalendarDays(year: number, month: number, markedDays: number[]) {
  const firstDayOffset = getFirstDayOffset(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7
  const markedDaySet = new Set(markedDays)

  return Array.from({ length: totalCells }, (_, index): ParentObservationCalendarDay => {
    const day = index - firstDayOffset + 1
    const isInMonth = day > 0 && day <= daysInMonth

    if (!isInMonth) {
      return { day: null }
    }

    return {
      day,
      hasRecord: markedDaySet.has(day),
    }
  })
}

function ParentObservationCalendar({
  year,
  month,
  markedDays = [],
  selectedDay = null,
  onPreviousMonth,
  onNextMonth,
  onSelectDay,
}: ParentObservationCalendarProps) {
  const calendarDays = buildCalendarDays(year, month, markedDays)

  return (
    <section className="parent-observation-calendar" aria-label="아이 관찰 기록 캘린더">
      <div className="parent-observation-calendar__header">
        <button
          type="button"
          className="parent-observation-calendar__nav-button"
          aria-label="이전 달"
          onClick={onPreviousMonth}
        >
          <ChevronLeftIcon />
        </button>

        <h2 className="parent-observation-calendar__month-label">{`${year}년 ${month}월`}</h2>

        <button
          type="button"
          className="parent-observation-calendar__nav-button"
          aria-label="다음 달"
          onClick={onNextMonth}
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="parent-observation-calendar__week-row">
        {weekLabels.map((label) => (
          <span key={label} className="parent-observation-calendar__week-label">
            {label}
          </span>
        ))}
      </div>

      <div className="parent-observation-calendar__grid">
        {calendarDays.map((entry, index) => {
          if (entry.day === null) {
            return (
              <span
                key={`blank-${index}`}
                className="parent-observation-calendar__day is-empty"
                aria-hidden="true"
              />
            )
          }

          const isSelected = selectedDay === entry.day

          return (
            <button
              key={entry.day}
              type="button"
              className={`parent-observation-calendar__day${
                isSelected ? ' is-selected' : ''
              }`}
              aria-pressed={isSelected}
              onClick={() => onSelectDay?.(entry.day!)}
            >
              <span className="parent-observation-calendar__day-number">{entry.day}</span>
              <span
                className={`parent-observation-calendar__day-marker${
                  entry.hasRecord ? ' is-visible' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ParentObservationCalendar
