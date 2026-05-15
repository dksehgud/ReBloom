import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'

export type BaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

export type ListResponseDto<T> = {
  contents?: T[]
  count?: number
}

export type ParentDiaryEmotionPointDto = {
  emotionIcon?: string | null
  targetDate: string
}

export type ParentDiaryEmotionResponseDto = {
  emotionList?: ParentDiaryEmotionPointDto[]
}

export type ParentChartPointDto = {
  date: string
  dayLabel?: string | null
  dayOfWeek?: string | null
  value?: number | null
}

export type ParentReportEmotionKey = DiaryEmotionKey
