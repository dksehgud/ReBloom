import { useCallback, useEffect, useState } from 'react'

import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'
import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import {
  parentReportWeeks,
  reportWeekdays,
  type ParentReportMood,
  type ParentReportMoodTone,
  type ParentReportWeek,
} from '../constants/parentReport'
import {
  getParentDiaryEmotions,
  getParentRmssds,
  getParentSleepScores,
} from '../api/parentReportApi'
import type {
  ParentChartPointDto,
  ParentDiaryEmotionPointDto,
} from '../types/parentReport'

type UseParentReportDataParams = {
  childrenId?: string
  selectedWeekIndex: number
}

type UseParentReportDataResult = {
  currentWeek: ParentReportWeek
  isError: boolean
  isLoading: boolean
}

type ReportWeekday = ParentReportWeek['moods'][number]['weekday']

const fallbackReportRanges = [
  {
    baseDate: '2026-04-20',
    endDate: '2026-04-26',
    startDate: '2026-04-20',
  },
  {
    baseDate: '2026-04-27',
    endDate: '2026-05-03',
    startDate: '2026-04-27',
  },
  {
    baseDate: '2026-05-04',
    endDate: '2026-05-10',
    startDate: '2026-05-04',
  },
] as const

const dayOfWeekLabelMap: Record<string, ReportWeekday> = {
  FRIDAY: '금',
  FRI: '금',
  MONDAY: '월',
  MON: '월',
  SATURDAY: '토',
  SAT: '토',
  SUNDAY: '일',
  SUN: '일',
  THURSDAY: '목',
  THU: '목',
  TUESDAY: '화',
  TUE: '화',
  WEDNESDAY: '수',
  WED: '수',
}

const emotionToneMap: Record<DiaryEmotionKey, ParentReportMoodTone> = {
  angry: 'orange',
  calm: 'green',
  excited: 'pink',
  happy: 'yellow',
  sad: 'blue',
  tired: 'purple',
}

function getReportRange(selectedWeekIndex: number) {
  return fallbackReportRanges[selectedWeekIndex] ?? fallbackReportRanges[0]
}

function normalizeEmotionIcon(value?: string | null): DiaryEmotionKey | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (['happy', 'positive', 'joy', '기쁨', '행복', '긍정'].includes(normalized)) {
    return 'happy'
  }

  if (['calm', 'neutral', 'normal', '평온', '중립'].includes(normalized)) {
    return 'calm'
  }

  if (['excited', 'active', '활발', '신남'].includes(normalized)) {
    return 'excited'
  }

  if (['sad', 'negative', '우울', '슬픔', '부정'].includes(normalized)) {
    return 'sad'
  }

  if (['angry', 'anger', '화남', '분노', '예민'].includes(normalized)) {
    return 'angry'
  }

  if (['tired', 'fatigue', '피곤', '지침'].includes(normalized)) {
    return 'tired'
  }

  if (normalized.includes('positive')) return 'happy'
  if (normalized.includes('neutral')) return 'calm'
  if (normalized.includes('negative')) return 'sad'
  if (normalized.includes('angry')) return 'angry'
  if (normalized.includes('tired')) return 'tired'

  return null
}

function getWeekdayFromDate(dateValue: string): ReportWeekday | null {
  const date = new Date(`${dateValue.split('T')[0]}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return reportWeekdays[date.getDay() === 0 ? 6 : date.getDay() - 1] ?? null
}

function getWeekdayFromChartPoint(point: ParentChartPointDto) {
  if (point.dayLabel && reportWeekdays.includes(point.dayLabel as ReportWeekday)) {
    return point.dayLabel as ReportWeekday
  }

  if (point.dayOfWeek) {
    return dayOfWeekLabelMap[point.dayOfWeek] ?? null
  }

  return getWeekdayFromDate(point.date)
}

function mapDiaryEmotionsToMoods(points: ParentDiaryEmotionPointDto[] = []) {
  const moodByWeekday = new Map<ReportWeekday, ParentReportMood>()

  points.forEach((point) => {
    const weekday = getWeekdayFromDate(point.targetDate)
    const emotionKey = normalizeEmotionIcon(point.emotionIcon)

    if (!weekday || !emotionKey) {
      return
    }

    moodByWeekday.set(weekday, {
      emotionKey,
      tone: emotionToneMap[emotionKey],
      weekday,
    })
  })

  return reportWeekdays.map(
    (weekday) =>
      moodByWeekday.get(weekday) ?? {
        emotionKey: null,
        tone: null,
        weekday,
      },
  )
}

function mapChartPointsToScores(points: ParentChartPointDto[] = []) {
  const scoreByWeekday = new Map<ReportWeekday, number>()

  points.forEach((point) => {
    const weekday = getWeekdayFromChartPoint(point)

    if (!weekday || typeof point.value !== 'number') {
      return
    }

    scoreByWeekday.set(weekday, Math.round(point.value))
  })

  return reportWeekdays.map((weekday) => ({
    score: scoreByWeekday.get(weekday) ?? 0,
    weekday,
  }))
}

function mergeReportWeekWithApiData({
  currentWeek,
  diaryEmotions,
  rmssds,
  sleepScores,
}: {
  currentWeek: ParentReportWeek
  diaryEmotions?: ParentDiaryEmotionPointDto[]
  rmssds?: ParentChartPointDto[]
  sleepScores?: ParentChartPointDto[]
}): ParentReportWeek {
  return {
    ...currentWeek,
    moods: diaryEmotions ? mapDiaryEmotionsToMoods(diaryEmotions) : currentWeek.moods,
    sleepScores: sleepScores ? mapChartPointsToScores(sleepScores) : currentWeek.sleepScores,
    stabilityScores: rmssds ? mapChartPointsToScores(rmssds) : currentWeek.stabilityScores,
  }
}

export function useParentReportData({
  childrenId,
  selectedWeekIndex,
}: UseParentReportDataParams): UseParentReportDataResult {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const [apiWeek, setApiWeek] = useState<ParentReportWeek | null>(null)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const currentFallbackWeek = parentReportWeeks[selectedWeekIndex] ?? parentReportWeeks[0]

  const loadReportData = useCallback(async () => {
    if (!accessToken || !childrenId) {
      setApiWeek(null)
      setIsError(false)
      setIsLoading(false)
      return
    }

    const { baseDate, endDate, startDate } = getReportRange(selectedWeekIndex)

    try {
      setIsLoading(true)
      setIsError(false)

      const [emotionResult, sleepResult, rmssdResult] = await Promise.allSettled([
        getParentDiaryEmotions({
          accessToken,
          childrenId,
          endDate,
          startDate,
        }),
        getParentSleepScores({
          accessToken,
          baseDate,
          childrenId,
        }),
        getParentRmssds({
          accessToken,
          baseDate,
          childrenId,
        }),
      ])

      setApiWeek(
        mergeReportWeekWithApiData({
          currentWeek: currentFallbackWeek,
          diaryEmotions:
            emotionResult.status === 'fulfilled' ? emotionResult.value.emotionList ?? [] : undefined,
          rmssds:
            rmssdResult.status === 'fulfilled' ? rmssdResult.value.contents ?? [] : undefined,
          sleepScores:
            sleepResult.status === 'fulfilled' ? sleepResult.value.contents ?? [] : undefined,
        }),
      )
      setIsError(
        [emotionResult, sleepResult, rmssdResult].some((result) => result.status === 'rejected'),
      )
    } catch (error) {
      console.error(error)
      setApiWeek(null)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, childrenId, currentFallbackWeek, selectedWeekIndex])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReportData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadReportData])

  return {
    currentWeek: apiWeek ?? currentFallbackWeek,
    isError,
    isLoading,
  }
}
