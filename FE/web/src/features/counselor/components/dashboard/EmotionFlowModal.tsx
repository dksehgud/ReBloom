import { useCallback, useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

import {
  getCounselorEmotionFlow,
  type CounselorEmotionFlowResponseDto,
} from '../../api/counselorDashboardApi'
import {
  emotionFlowModeTabs,
  emotionFlowPeriods,
} from '../../mocks/dashboardMockData'
import type { EmotionFlowMode, EmotionFlowPeriod } from '../../types/dashboard'
import {
  getAverageExpressionPredictionScore,
  parseExpressionPredictionScore,
} from '../../utils/expressionPrediction'
import { useAppSessionStore } from '../../../auth/store/useAppSessionStore'
import { useCounselorMockMode } from '../../hooks/useCounselorMockMode'
import EmotionFlowLineChart from './charts/EmotionFlowLineChart'

type EmotionFlowModalProps = {
  childId: string
  onClose: () => void
}

function padDateValue(value: number) {
  return String(value).padStart(2, '0')
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${padDateValue(date.getMonth() + 1)}-${padDateValue(
    date.getDate(),
  )}`
}

function shiftPeriod(date: Date, mode: EmotionFlowMode, delta: number) {
  return mode === 'monthly'
    ? new Date(date.getFullYear(), date.getMonth() + delta, 1)
    : new Date(date.getFullYear() + delta, 0, 1)
}

function isCurrentOrFuturePeriod(date: Date, mode: EmotionFlowMode) {
  const today = new Date()

  if (mode === 'monthly') {
    return (
      date.getFullYear() > today.getFullYear() ||
      (date.getFullYear() === today.getFullYear() && date.getMonth() >= today.getMonth())
    )
  }

  return date.getFullYear() >= today.getFullYear()
}

function getPeriodLabel(date: Date, mode: EmotionFlowMode) {
  if (mode === 'monthly') {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  return `${date.getFullYear()}년`
}

function getWeekOfMonth(date: Date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const day = firstDayOfMonth.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const firstWeekStart = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    firstDayOfMonth.getDate() + mondayOffset,
  )

  return Math.max(
    1,
    Math.floor((date.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
  )
}

function createEmotionFlowPeriod(
  response: CounselorEmotionFlowResponseDto,
  mode: EmotionFlowMode,
  baseDate: Date,
): EmotionFlowPeriod {
  const pointMap = new Map<
    string,
    { diaryScores: number[]; conversationScores: number[]; order: number }
  >()

  const getLabel = (dateTimeValue: string) => {
    const date = new Date(dateTimeValue)

    if (Number.isNaN(date.getTime())) {
      return dateTimeValue
    }

    if (mode === 'monthly') {
      return `${date.getMonth() + 1}월 ${getWeekOfMonth(date)}주`
    }

    return `${date.getFullYear()}.${padDateValue(date.getMonth() + 1)}`
  }

  const getOrder = (dateTimeValue: string) => {
    const date = new Date(dateTimeValue)

    if (Number.isNaN(date.getTime())) {
      return Number.MAX_SAFE_INTEGER
    }

    return date.getTime()
  }

  const addPoint = (
    label: string,
    order: number,
    key: 'diaryScores' | 'conversationScores',
    prediction?: number | string | null,
  ) => {
    const current =
      pointMap.get(label) ?? { conversationScores: [], diaryScores: [], order }

    current[key].push(parseExpressionPredictionScore(prediction))
    current.order = Math.min(current.order, order)
    pointMap.set(label, current)
  }

  ;(response.diaryList ?? []).forEach((point) => {
    addPoint(
      getLabel(point.targetDate),
      getOrder(point.targetDate),
      'diaryScores',
      point.prediction,
    )
  })
  ;(response.conversationList ?? []).forEach((point) => {
    addPoint(
      getLabel(point.startedAt),
      getOrder(point.startedAt),
      'conversationScores',
      point.prediction,
    )
  })

  return {
    id: formatIsoDate(baseDate),
    label: getPeriodLabel(baseDate, mode),
    points: [...pointMap.entries()]
      .sort(([, first], [, second]) => first.order - second.order)
      .map(([label, value]) => ({
        conversation: getAverageExpressionPredictionScore(value.conversationScores),
        diary: getAverageExpressionPredictionScore(value.diaryScores),
        hasConversation: value.conversationScores.length > 0,
        hasDiary: value.diaryScores.length > 0,
        label,
      })),
  }
}

function EmotionFlowModal({ childId, onClose }: EmotionFlowModalProps) {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useCounselorMockMode()
  const [mode, setMode] = useState<EmotionFlowMode>('monthly')
  const [periodIndex, setPeriodIndex] = useState(0)
  const [baseDate, setBaseDate] = useState(() => new Date())
  const [realPeriod, setRealPeriod] = useState<EmotionFlowPeriod | null>(null)
  const [isLoading, setIsLoading] = useState(!isMockMode)
  const [error, setError] = useState<string>()
  const periods = isMockMode ? emotionFlowPeriods[mode] : []
  const currentPeriod = isMockMode ? periods[periodIndex] ?? periods[0] : realPeriod
  const isFirstPeriod = isMockMode ? periodIndex === 0 : false
  const isLastPeriod = isMockMode
    ? periodIndex === periods.length - 1
    : isCurrentOrFuturePeriod(baseDate, mode)
  const periodLabel = currentPeriod?.label ?? getPeriodLabel(baseDate, mode)

  const loadEmotionFlow = useCallback(async () => {
    if (isMockMode) {
      setError(undefined)
      setIsLoading(false)
      return
    }

    if (!accessToken) {
      setRealPeriod(null)
      setError('로그인이 필요합니다.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(undefined)

      const response = await getCounselorEmotionFlow({
        accessToken,
        baseDate: formatIsoDate(baseDate),
        childId,
        period: mode === 'monthly' ? 'MONTH' : 'YEAR',
        type: 'ALL',
      })

      setRealPeriod(createEmotionFlowPeriod(response, mode, baseDate))
    } catch (nextError) {
      console.error(nextError)
      setRealPeriod(null)
      setError(
        nextError instanceof Error
          ? nextError.message
          : '감정 흐름 데이터를 불러오지 못했습니다.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, baseDate, childId, isMockMode, mode])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleModeChange = (nextMode: EmotionFlowMode) => {
    setMode(nextMode)
    setPeriodIndex(0)
    setBaseDate(new Date())
  }

  const handlePrevPeriod = () => {
    if (isMockMode) {
      setPeriodIndex((current) => Math.max(0, current - 1))
      return
    }

    setBaseDate((current) => shiftPeriod(current, mode, -1))
  }

  const handleNextPeriod = () => {
    if (isMockMode) {
      setPeriodIndex((current) => Math.min(periods.length - 1, current + 1))
      return
    }

    setBaseDate((current) => shiftPeriod(current, mode, 1))
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadEmotionFlow()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadEmotionFlow])

  return (
    <div className="counselor-emotion-flow-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="counselor-emotion-flow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="counselor-emotion-flow-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="counselor-emotion-flow-header">
          <div className="counselor-emotion-flow-topbar">
            <h2 id="counselor-emotion-flow-title">감정 흐름 크게보기</h2>
            <button
              type="button"
              className="counselor-emotion-flow-close"
              aria-label="감정 흐름 크게보기 닫기"
              onClick={onClose}
            >
              <FiX aria-hidden="true" />
            </button>
          </div>

          <div className="counselor-emotion-flow-tabs" role="tablist" aria-label="감정 흐름 기간">
            {emotionFlowModeTabs.map((tab) => (
              <button
                type="button"
                role="tab"
                key={tab.key}
                aria-selected={mode === tab.key}
                className={mode === tab.key ? 'is-active' : undefined}
                onClick={() => handleModeChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="counselor-emotion-flow-body">
          <div className="counselor-emotion-flow-period">
            <button
              type="button"
              aria-label="이전 기간"
              disabled={isFirstPeriod}
              onClick={handlePrevPeriod}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <strong>{periodLabel}</strong>
            <button
              type="button"
              aria-label="다음 기간"
              disabled={isLastPeriod}
              onClick={handleNextPeriod}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="counselor-emotion-flow-legend" aria-label="그래프 범례">
            <span>
              <i className="is-diary" aria-hidden="true" />
              일기
            </span>
            <span>
              <i className="is-conversation" aria-hidden="true" />
              대화
            </span>
          </div>

          <div className="counselor-emotion-flow-chart-panel">
            {isLoading ? (
              <p className="counselor-timeline-empty">감정 흐름 데이터를 불러오는 중입니다.</p>
            ) : error ? (
              <p className="counselor-timeline-empty">{error}</p>
            ) : currentPeriod && currentPeriod.points.length > 0 ? (
              <EmotionFlowLineChart data={currentPeriod.points} />
            ) : (
              <p className="counselor-timeline-empty">표시할 감정 흐름 데이터가 없습니다.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default EmotionFlowModal
