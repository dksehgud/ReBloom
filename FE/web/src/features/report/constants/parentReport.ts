import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'

export const reportWeekdays = ['월', '화', '수', '목', '금', '토', '일'] as const
export const PARENT_REPORT_VISIBLE_WEEK_COUNT = 3

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
    hasValue?: boolean
    weekday: ReportWeekday
    score: number
  }[]
  sleepInsight: string
  stabilityScores: {
    hasValue?: boolean
    weekday: ReportWeekday
    score: number
  }[]
  stabilityInsight: string
}
