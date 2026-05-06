export const reportWeekdays = ['월', '화', '수', '목', '금', '토', '일'] as const

type ReportWeekday = (typeof reportWeekdays)[number]

export type ParentReportMoodTone = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange'

export type ParentReportMood = {
  weekday: ReportWeekday
  emoji: string | null
  tone: ParentReportMoodTone | null
}

export type ParentReportWeek = {
  id: string
  label: string
  moods: ParentReportMood[]
}

export const parentReportWeeks: ParentReportWeek[] = [
  {
    id: '2026-04-w4',
    label: '2026년 4월 4주차',
    moods: [
      { weekday: '월', emoji: '😊', tone: 'yellow' },
      { weekday: '화', emoji: '😢', tone: 'blue' },
      { weekday: '수', emoji: '😌', tone: 'green' },
      { weekday: '목', emoji: null, tone: null },
      { weekday: '금', emoji: '😊', tone: 'yellow' },
      { weekday: '토', emoji: '😍', tone: 'pink' },
      { weekday: '일', emoji: '😰', tone: 'purple' },
    ],
  },
  {
    id: '2026-05-w1',
    label: '2026년 5월 1주차',
    moods: [
      { weekday: '월', emoji: '😊', tone: 'yellow' },
      { weekday: '화', emoji: '😰', tone: 'orange' },
      { weekday: '수', emoji: null, tone: null },
      { weekday: '목', emoji: '😌', tone: 'green' },
      { weekday: '금', emoji: '😊', tone: 'yellow' },
      { weekday: '토', emoji: '😍', tone: 'pink' },
      { weekday: '일', emoji: null, tone: null },
    ],
  },
  {
    id: '2026-05-w2',
    label: '2026년 5월 2주차',
    moods: [
      { weekday: '월', emoji: '😌', tone: 'green' },
      { weekday: '화', emoji: '😊', tone: 'yellow' },
      { weekday: '수', emoji: '😌', tone: 'green' },
      { weekday: '목', emoji: '😊', tone: 'yellow' },
      { weekday: '금', emoji: null, tone: null },
      { weekday: '토', emoji: '😍', tone: 'pink' },
      { weekday: '일', emoji: '😊', tone: 'yellow' },
    ],
  },
]
