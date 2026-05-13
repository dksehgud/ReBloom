import { useCallback, useEffect, useMemo, useState } from 'react'

import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'
import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import {
  PARENT_REPORT_VISIBLE_WEEK_COUNT,
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
import { parentReportWeeksMock } from '../mocks/parentReport'
import type {
  ParentChartPointDto,
  ParentDiaryEmotionPointDto,
} from '../types/parentReport'
import { useParentMockMode } from './useParentMockMode'

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

const CURRENT_REPORT_WEEK_INDEX = PARENT_REPORT_VISIBLE_WEEK_COUNT - 1
const DAYS_PER_WEEK = 7

function formatDateParam(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)

  return nextDate
}

function getMondayOfWeek(date: Date) {
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)

  const dayOfWeek = monday.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + mondayOffset)

  return monday
}

function getWeekLabelByEndDate(endDate: Date) {
  const thursday = addDays(getMondayOfWeek(endDate), 3)
  const firstDayOfLabelMonth = new Date(thursday.getFullYear(), thursday.getMonth(), 1)
  const daysUntilFirstThursday =
    (4 - firstDayOfLabelMonth.getDay() + DAYS_PER_WEEK) % DAYS_PER_WEEK
  const firstThursday = addDays(firstDayOfLabelMonth, daysUntilFirstThursday)
  const weekOfMonth =
    Math.floor((thursday.getTime() - firstThursday.getTime()) / (DAYS_PER_WEEK * 24 * 60 * 60 * 1000)) +
    1

  return `${thursday.getFullYear()}년 ${thursday.getMonth() + 1}월 ${weekOfMonth}주차`
}

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
  const weekOffset = selectedWeekIndex - CURRENT_REPORT_WEEK_INDEX
  const startOfWeek = addDays(getMondayOfWeek(new Date()), weekOffset * DAYS_PER_WEEK)
  const endOfWeek = addDays(startOfWeek, DAYS_PER_WEEK - 1)
  const startDate = formatDateParam(startOfWeek)
  const endDate = formatDateParam(endOfWeek)

  return {
    baseDate: startDate,
    endDate,
    id: `${startDate}_${endDate}`,
    label: getWeekLabelByEndDate(endOfWeek),
    startDate,
  }
}

function createEmptyReportWeek(
  reportRange: ReturnType<typeof getReportRange>,
): ParentReportWeek {
  return {
    id: reportRange.id,
    label: reportRange.label,
    moods: reportWeekdays.map((weekday) => ({
      emotionKey: null,
      tone: null,
      weekday,
    })),
    sleepInsight: '',
    sleepScores: reportWeekdays.map((weekday) => ({
      score: 0,
      weekday,
    })),
    stabilityInsight: '',
    stabilityScores: reportWeekdays.map((weekday) => ({
      score: 0,
      weekday,
    })),
  }
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
  const isMockMode = useParentMockMode()
  const [apiWeek, setApiWeek] = useState<ParentReportWeek | null>(null)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const reportRange = useMemo(() => getReportRange(selectedWeekIndex), [selectedWeekIndex])
  const currentFallbackWeek = useMemo(
    () => createEmptyReportWeek(reportRange),
    [reportRange],
  )
  const currentMockWeek =
    parentReportWeeksMock[selectedWeekIndex] ?? parentReportWeeksMock.at(-1)

  const loadReportData = useCallback(async () => {
    if (isMockMode) {
      setApiWeek(null)
      setIsError(false)
      setIsLoading(false)
      return
    }

    if (!accessToken || !childrenId) {
      setApiWeek(null)
      setIsError(false)
      setIsLoading(false)
      return
    }

    const { baseDate, endDate, startDate } = reportRange

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
  }, [accessToken, childrenId, currentFallbackWeek, isMockMode, reportRange])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReportData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadReportData])

  return {
    currentWeek: isMockMode
      ? currentMockWeek ?? currentFallbackWeek
      : apiWeek ?? currentFallbackWeek,
    isError,
    isLoading,
  }
}
