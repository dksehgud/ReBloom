import type { DiaryEmotionKey } from '../constants/diaryEmotions'

type DiaryRecord = {
  id: string
  day: number
  summary: string
  content: string
  emotionKey: DiaryEmotionKey
}

type DiaryViewMode = 'calendar' | 'list' | 'detail' | 'write'
type MainDiaryViewMode = 'calendar' | 'list' | 'detail'
type DiaryRecordsByMonth = Record<string, DiaryRecord[]>

export type { DiaryRecord, DiaryRecordsByMonth, DiaryViewMode, MainDiaryViewMode }
