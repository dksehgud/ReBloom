import { useMemo, useState } from 'react'

import ChildFloatingActionButton from '../../components/organisms/FloatingActionButton/ChildFloatingActionButton'
import ChildHeader from '../../components/organisms/Header/ChildHeader'
import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import DiaryCalendar from '../../features/diary/components/DiaryCalendar'
import type { DiaryCalendarEntry } from '../../features/diary/components/DiaryCalendar'

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 7H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5 12H16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5 17H14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function SettingsIcon() {
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
        d="M10.9 4.5H13.1L13.6 6.3C14 6.5 14.4 6.7 14.8 7L16.6 6.3L18.1 7.8L17.4 9.6C17.7 10 17.9 10.4 18.1 10.8L19.9 11.3V13.5L18.1 14C17.9 14.4 17.7 14.8 17.4 15.2L18.1 17L16.6 18.5L14.8 17.8C14.4 18.1 14 18.3 13.6 18.5L13.1 20.3H10.9L10.4 18.5C10 18.3 9.6 18.1 9.2 17.8L7.4 18.5L5.9 17L6.6 15.2C6.3 14.8 6.1 14.4 5.9 14L4.1 13.5V11.3L5.9 10.8C6.1 10.4 6.3 10 6.6 9.6L5.9 7.8L7.4 6.3L9.2 7C9.6 6.7 10 6.5 10.4 6.3L10.9 4.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12.4" r="2.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

const SAMPLE_ENTRIES_BY_MONTH: Record<string, DiaryCalendarEntry[]> = {
  '2026-03': [
    { day: 4, mood: '😌', tone: 'mint' },
    { day: 8, mood: '😊', tone: 'amber' },
    { day: 17, mood: '😰', tone: 'lavender' },
    { day: 25, mood: '😊', tone: 'mint' },
  ],
  '2026-04': [
    { day: 3, mood: '😊', tone: 'mint' },
    { day: 7, mood: '😊', tone: 'amber' },
    { day: 14, mood: '😰', tone: 'lavender' },
    { day: 15, mood: '😌', tone: 'mint' },
    { day: 16, mood: '😊', tone: 'amber' },
    { day: 21, mood: '😌', tone: 'mint' },
  ],
  '2026-05': [
    { day: 2, mood: '😊', tone: 'amber' },
    { day: 5, mood: '😌', tone: 'mint' },
    { day: 11, mood: '😰', tone: 'lavender' },
    { day: 22, mood: '😊', tone: 'mint' },
    { day: 27, mood: '😌', tone: 'amber' },
  ],
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function ChildDiaryListPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 3, 1))

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const entries = useMemo(
    () => SAMPLE_ENTRIES_BY_MONTH[getMonthKey(currentYear, currentMonth)] ?? [],
    [currentMonth, currentYear],
  )

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  return (
    <MobilePageLayout
      className="child-diary-list-page"
      contentClassName="child-diary-list-page__content"
      header={
        <ChildHeader
          mode="brand"
          rightSlot={
            <>
              <button
                type="button"
                className="child-header-icon-button"
                aria-label="일기 목록"
              >
                <MenuIcon />
              </button>
              <button
                type="button"
                className="child-header-icon-button"
                aria-label="설정"
              >
                <SettingsIcon />
              </button>
            </>
          }
        />
      }
    >
      <div className="child-diary-list-page__body">
        <DiaryCalendar
          year={currentYear}
          month={currentMonth}
          entries={entries}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        <ChildFloatingActionButton ariaLabel="일기 작성" />
      </div>
    </MobilePageLayout>
  )
}

export default ChildDiaryListPage
