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
  sleepScores: {
    weekday: ReportWeekday
    score: number
  }[]
  sleepInsight: string
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
    sleepScores: [
      { weekday: '월', score: 78 },
      { weekday: '화', score: 84 },
      { weekday: '수', score: 61 },
      { weekday: '목', score: 68 },
      { weekday: '금', score: 73 },
      { weekday: '토', score: 87 },
      { weekday: '일', score: 81 },
    ],
    sleepInsight: '수요일과 목요일의 수면 점수가 다른 날보다 낮아 보여요.',
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
    sleepScores: [
      { weekday: '월', score: 80 },
      { weekday: '화', score: 90 },
      { weekday: '수', score: 50 },
      { weekday: '목', score: 60 },
      { weekday: '금', score: 70 },
      { weekday: '토', score: 85 },
      { weekday: '일', score: 75 },
    ],
    sleepInsight: '수요일의 수면 점수가 다른 날보다 크게 낮아 보여요.',
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
    sleepScores: [
      { weekday: '월', score: 82 },
      { weekday: '화', score: 76 },
      { weekday: '수', score: 79 },
      { weekday: '목', score: 85 },
      { weekday: '금', score: 72 },
      { weekday: '토', score: 88 },
      { weekday: '일', score: 86 },
    ],
    sleepInsight: '전반적으로 수면 점수가 안정적이고 주말로 갈수록 더 좋아졌어요.',
  },
]
