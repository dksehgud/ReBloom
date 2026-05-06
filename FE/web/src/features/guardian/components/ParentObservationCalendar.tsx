type ParentObservationCalendarDay = {
  day: number | null
  hasRecord?: boolean
}

const weekLabels = ['일', '월', '화', '수', '목', '금', '토']

const aprilCalendarDays: ParentObservationCalendarDay[] = [
  { day: null },
  { day: null },
  { day: null },
  { day: 1 },
  { day: 2 },
  { day: 3, hasRecord: true },
  { day: 4, hasRecord: true },
  { day: 5 },
  { day: 6 },
  { day: 7 },
  { day: 8 },
  { day: 9 },
  { day: 10 },
  { day: 11 },
  { day: 12 },
  { day: 13, hasRecord: true },
  { day: 14, hasRecord: true },
  { day: 15, hasRecord: true },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24 },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  { day: 30 },
  { day: null },
  { day: null },
]

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-calendar__nav-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ParentObservationCalendar() {
  return (
    <section className="parent-observation-calendar" aria-label="아이 관찰 기록 캘린더">
      <div className="parent-observation-calendar__header">
        <button
          type="button"
          className="parent-observation-calendar__nav-button"
          aria-label="이전 달"
        >
          <ChevronLeftIcon />
        </button>

        <h2 className="parent-observation-calendar__month-label">2026년 4월</h2>

        <button
          type="button"
          className="parent-observation-calendar__nav-button"
          aria-label="다음 달"
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
        {aprilCalendarDays.map((entry, index) => {
          if (entry.day === null) {
            return <span key={`blank-${index}`} className="parent-observation-calendar__day is-empty" aria-hidden="true" />
          }

          return (
            <div key={entry.day} className="parent-observation-calendar__day">
              <span className="parent-observation-calendar__day-number">{entry.day}</span>
              <span
                className={`parent-observation-calendar__day-marker${
                  entry.hasRecord ? ' is-visible' : ''
                }`}
                aria-hidden="true"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ParentObservationCalendar
