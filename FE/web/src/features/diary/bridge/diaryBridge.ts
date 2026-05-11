import type { DiaryEmotionKey } from '../constants/diaryEmotions'

type NativeDiary = {
  id: string
  userId: string | null
  diaryDate: string
  content: string
  emotionKey: DiaryEmotionKey | null
  createdAt: number
  updatedAt: number
}

type DiarySavePayload = {
  id?: string
  userId?: string | null
  diaryDate: string
  content: string
  emotionKey: DiaryEmotionKey | null
}

type BridgeResponse<T> = {
  success: boolean
  data: T | null
  message: string | null
}

type NativeDiaryBridge = {
  getDiariesByMonth: (yearMonth: string) => string
  getDiaryByDate: (diaryDate: string) => string
  saveDiary: (requestJson: string) => string
  deleteDiary: (id: string) => string
}

declare global {
  interface Window {
    RebloomDiaryBridge?: NativeDiaryBridge
  }
}

function getBridge() {
  return typeof window === 'undefined' ? undefined : window.RebloomDiaryBridge
}

function parseBridgeResponse<T>(rawResponse: string): BridgeResponse<T> {
  const response = JSON.parse(rawResponse) as BridgeResponse<T>

  if (!response.success) {
    throw new Error(response.message ?? 'Diary bridge request failed')
  }

  return response
}

const diaryBridge = {
  isAvailable() {
    return Boolean(getBridge())
  },

  getDiariesByMonth(yearMonth: string) {
    const bridge = getBridge()
    if (!bridge) {
      return []
    }

    return parseBridgeResponse<NativeDiary[]>(bridge.getDiariesByMonth(yearMonth)).data ?? []
  },

  getDiaryByDate(diaryDate: string) {
    const bridge = getBridge()
    if (!bridge) {
      return null
    }

    return parseBridgeResponse<NativeDiary | null>(bridge.getDiaryByDate(diaryDate)).data
  },

  saveDiary(payload: DiarySavePayload) {
    const bridge = getBridge()
    if (!bridge) {
      throw new Error('Diary bridge is not available')
    }

    return parseBridgeResponse<NativeDiary>(
      bridge.saveDiary(JSON.stringify(payload)),
    ).data
  },

  deleteDiary(id: string) {
    const bridge = getBridge()
    if (!bridge) {
      throw new Error('Diary bridge is not available')
    }

    return parseBridgeResponse<{ deleted: boolean }>(bridge.deleteDiary(id)).data?.deleted ?? false
  },
}

export type { BridgeResponse, DiarySavePayload, NativeDiary }
export { diaryBridge }
