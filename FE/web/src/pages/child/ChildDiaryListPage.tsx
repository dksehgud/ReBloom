import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import ChildFloatingActionButton from '../../components/organisms/FloatingActionButton/ChildFloatingActionButton'
import ChildHeader from '../../components/organisms/Header/ChildHeader'
import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import DiaryCalendar from '../../features/diary/components/DiaryCalendar'
import type { DiaryCalendarEntry } from '../../features/diary/components/DiaryCalendar'
import DiaryListView from '../../features/diary/components/DiaryListView'
import type { DiaryListItem } from '../../features/diary/components/DiaryListView'

type DiaryTone = 'mint' | 'amber' | 'lavender'

type DiaryRecord = {
  id: string
  day: number
  summary: string
  mood: ReactNode
  tone: DiaryTone
}

type ViewMode = 'calendar' | 'list'

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

const SAMPLE_RECORDS_BY_MONTH: Record<string, DiaryRecord[]> = {
  '2026-03': [
    { id: '2026-03-04', day: 4, summary: '오늘은 새로운 블록 놀이를 해봤어요.', mood: '😊', tone: 'mint' },
    { id: '2026-03-08', day: 8, summary: '바깥놀이를 오래 해서 기분이 좋았어요.', mood: '🙂', tone: 'amber' },
    { id: '2026-03-17', day: 17, summary: '친구와 다퉈서 조금 속상했어요.', mood: '🥺', tone: 'lavender' },
    { id: '2026-03-25', day: 25, summary: '엄마와 같이 그림책을 읽었어요.', mood: '😊', tone: 'mint' },
  ],
  '2026-04': [
    { id: '2026-04-03', day: 3, summary: '오늘은 수업 시간에 발표를 잘했어요.', mood: '😊', tone: 'mint' },
    { id: '2026-04-07', day: 7, summary: '간식으로 좋아하는 과일을 먹었어요.', mood: '🙂', tone: 'amber' },
    { id: '2026-04-14', day: 14, summary: '비가 와서 밖에서 못 놀아 아쉬웠어요.', mood: '🥺', tone: 'lavender' },
    { id: '2026-04-15', day: 15, summary: '선생님께 칭찬을 받아 기뻤어요.', mood: '😊', tone: 'mint' },
    { id: '2026-04-16', day: 16, summary: '친구와 역할놀이를 하며 많이 웃었어요.', mood: '🙂', tone: 'amber' },
    { id: '2026-04-21', day: 21, summary: '오늘은 가족과 함께 저녁 산책을 했어요.', mood: '😊', tone: 'mint' },
  ],
  '2026-05': [
    { id: '2026-05-02', day: 2, summary: '주말이라 늦잠을 자서 편안했어요.', mood: '🙂', tone: 'amber' },
    { id: '2026-05-05', day: 5, summary: '어린이날 선물을 받아 정말 신났어요.', mood: '😊', tone: 'mint' },
    { id: '2026-05-11', day: 11, summary: '넘어져서 무릎이 조금 아팠어요.', mood: '🥺', tone: 'lavender' },
    { id: '2026-05-22', day: 22, summary: '체육 시간에 달리기를 열심히 했어요.', mood: '😊', tone: 'mint' },
    { id: '2026-05-27', day: 27, summary: '친구와 레고를 함께 만들어 즐거웠어요.', mood: '🙂', tone: 'amber' },
  ],
  '2026-06': [],
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatDateLabel(year: number, month: number, day: number) {
  return `${year}. ${month}. ${day}.`
}

function ChildDiaryListPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 3, 1))
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const records = useMemo(
    () => SAMPLE_RECORDS_BY_MONTH[getMonthKey(currentYear, currentMonth)] ?? [],
    [currentMonth, currentYear],
  )

  const calendarEntries = useMemo<DiaryCalendarEntry[]>(
    () =>
      records.map((record) => ({
        day: record.day,
        mood: record.mood,
        tone: record.tone,
      })),
    [records],
  )

  const listItems = useMemo<DiaryListItem[]>(
    () =>
      records.map((record) => ({
        id: record.id,
        dateLabel: formatDateLabel(currentYear, currentMonth, record.day),
        summary: record.summary,
        mood: record.mood,
      })),
    [currentMonth, currentYear, records],
  )

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'calendar' ? 'list' : 'calendar'))
  }

  return (
    <MobilePageLayout
      className="child-diary-list-page"
      contentClassName={`child-diary-list-page__content child-diary-list-page__content--${viewMode}`}
      header={
        <ChildHeader
          mode="brand"
          rightSlot={
            <>
              <button
                type="button"
                className="child-header-icon-button"
                aria-label={viewMode === 'calendar' ? '일기 목록 보기' : '캘린더 보기'}
                onClick={handleToggleViewMode}
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
      <div className={`child-diary-list-page__body child-diary-list-page__body--${viewMode}`}>
        {viewMode === 'calendar' ? (
          <DiaryCalendar
            year={currentYear}
            month={currentMonth}
            entries={calendarEntries}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
        ) : (
          <DiaryListView
            year={currentYear}
            month={currentMonth}
            items={listItems}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
        )}
        <ChildFloatingActionButton ariaLabel="일기 작성" />
      </div>
    </MobilePageLayout>
  )
}

export default ChildDiaryListPage
