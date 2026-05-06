import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'

export const reportWeekdays = ['월', '화', '수', '목', '금', '토', '일'] as const

type ReportWeekday = (typeof reportWeekdays)[number]

export type ParentReportMoodTone = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange'

export type ParentReportMood = {
  weekday: ReportWeekday
  emotionKey: DiaryEmotionKey | null
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
  stabilityScores: {
    weekday: ReportWeekday
    score: number
  }[]
  stabilityInsight: string
}

export const parentReportWeeks: ParentReportWeek[] = [
  {
    id: '2026-04-w4',
    label: '2026년 4월 4주차',
    moods: [
      { weekday: '월', emotionKey: 'happy', tone: 'yellow' },
      { weekday: '화', emotionKey: 'sad', tone: 'blue' },
      { weekday: '수', emotionKey: 'calm', tone: 'green' },
      { weekday: '목', emotionKey: null, tone: null },
      { weekday: '금', emotionKey: 'happy', tone: 'yellow' },
      { weekday: '토', emotionKey: 'excited', tone: 'pink' },
      { weekday: '일', emotionKey: 'tired', tone: 'purple' },
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
    stabilityScores: [
      { weekday: '월', score: 66 },
      { weekday: '화', score: 71 },
      { weekday: '수', score: 58 },
      { weekday: '목', score: 63 },
      { weekday: '금', score: 74 },
      { weekday: '토', score: 82 },
      { weekday: '일', score: 79 },
    ],
    stabilityInsight: '주 중반에는 긴장도가 높아졌지만, 주말로 갈수록 다시 안정되는 흐름이에요.',
  },
  {
    id: '2026-05-w1',
    label: '2026년 5월 1주차',
    moods: [
      { weekday: '월', emotionKey: 'happy', tone: 'yellow' },
      { weekday: '화', emotionKey: 'angry', tone: 'orange' },
      { weekday: '수', emotionKey: null, tone: null },
      { weekday: '목', emotionKey: 'calm', tone: 'green' },
      { weekday: '금', emotionKey: 'happy', tone: 'yellow' },
      { weekday: '토', emotionKey: 'excited', tone: 'pink' },
      { weekday: '일', emotionKey: null, tone: null },
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
    stabilityScores: [
      { weekday: '월', score: 64 },
      { weekday: '화', score: 59 },
      { weekday: '수', score: 43 },
      { weekday: '목', score: 56 },
      { weekday: '금', score: 67 },
      { weekday: '토', score: 79 },
      { weekday: '일', score: 74 },
    ],
    stabilityInsight: '자율신경 안정도는 주 중반에 내려갔다가 주말로 갈수록 회복되는 흐름이에요.',
  },
  {
    id: '2026-05-w2',
    label: '2026년 5월 2주차',
    moods: [
      { weekday: '월', emotionKey: 'calm', tone: 'green' },
      { weekday: '화', emotionKey: 'happy', tone: 'yellow' },
      { weekday: '수', emotionKey: 'calm', tone: 'green' },
      { weekday: '목', emotionKey: 'happy', tone: 'yellow' },
      { weekday: '금', emotionKey: null, tone: null },
      { weekday: '토', emotionKey: 'excited', tone: 'pink' },
      { weekday: '일', emotionKey: 'happy', tone: 'yellow' },
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
    stabilityScores: [
      { weekday: '월', score: 72 },
      { weekday: '화', score: 69 },
      { weekday: '수', score: 74 },
      { weekday: '목', score: 78 },
      { weekday: '금', score: 70 },
      { weekday: '토', score: 84 },
      { weekday: '일', score: 83 },
    ],
    stabilityInsight: '전반적으로 안정도가 높은 편이고, 큰 흔들림 없이 유지되고 있어요.',
  },
]
