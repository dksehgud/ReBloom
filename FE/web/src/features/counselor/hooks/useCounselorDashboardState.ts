import { useCallback, useEffect, useState } from 'react'

import {
  createCounselorComment,
  deleteCounselorComment,
  getCounselorComment,
} from '../api/counselorCommentApi'
import {
  getCounselorChildren,
  type CounselorChildResponseDto,
} from '../api/counselorChildrenApi'
import {
  getCounselorAnalysisContent,
  type CounselorAnalysisContentResponseDto,
  type CounselorConversationAnalysisCardDto,
  type CounselorDiaryAnalysisCardDto,
} from '../api/counselorDashboardApi'
import {
  acceptCounselorParentRelation,
  getCounselorParentRelations,
  rejectCounselorParentRelation,
  type CounselorParentRelationResponseDto,
} from '../api/counselorParentRelationApi'
import { getCounselorObservationRecords } from '../api/counselorObservationApi'
import {
  DEFAULT_EXPRESSION_WEEK_INDEX,
  INITIAL_DASHBOARD_WEEK_OFFSETS,
  biometricRatio,
  createMockComment,
  expressionWeeks,
  hrvTrend,
  initialChildList,
  initialConnectionRequests,
  initialObservationComments,
  observationRecordsByWeek,
  sleepEfficiency,
  sleepScoreBars,
} from '../mocks/dashboardMockData'
import type {
  ChildListItem,
  CounselorConnectionRequest,
  DashboardExpressionAnalysis,
  DashboardMetricPoint,
  DashboardWeekOffsets,
  DashboardWeekSection,
  ExpressionFilter,
  ObservationRecord,
  TimelineDay,
  TimelineEntry,
} from '../types/dashboard'
import { getWeekAdjustedLineData } from '../utils/dashboardMetrics'
import {
  getChildHrAccRatios,
  getChildRmssds,
  getChildSleepEfficiencies,
  getChildSleepScores,
  type ChildChartPointDto,
} from '../../../shared/api/childChartApi'
import { getWeekRangeByOffset } from '../../../shared/utils/weekRange'
import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'
import { useCounselorMockMode } from './useCounselorMockMode'

function getCounselingStatusLabel(status: string) {
  if (status === 'IN_PROGRESS') {
    return '상담 진행 중'
  }

  if (status === 'ENDED') {
    return '상담 종료'
  }

  return status || '상담 상태 확인 중'
}

function getRelationStatusLabel(status: string) {
  if (status === 'PENDING') {
    return '연결 대기'
  }

  if (status === 'ACTIVE') {
    return '연결 완료'
  }

  if (status === 'REJECT') {
    return '연결 거절'
  }

  return status || '연결 상태 확인 중'
}

function getGenderLabel(gender?: string | null) {
  if (gender === 'MALE') {
    return '남'
  }

  if (gender === 'FEMALE') {
    return '여'
  }

  return null
}

function mapCounselorChildToListItem(
  child: CounselorChildResponseDto,
): ChildListItem {
  const statusLabel = getCounselingStatusLabel(child.counselingStatus)
  const genderLabel = getGenderLabel(child.gender)
  const metaParts = [
    typeof child.age === 'number' ? `${child.age}세` : null,
    genderLabel,
  ].filter(Boolean)

  return {
    id: child.childrenId,
    name: child.name,
    meta: metaParts.length > 0 ? metaParts.join(' · ') : statusLabel,
    subText: child.parentName ? `보호자: ${child.parentName}` : '보호자 미연결',
    age: typeof child.age === 'number' ? `${child.age}세` : undefined,
    gender: genderLabel ?? undefined,
    guardianName: child.parentName ?? undefined,
    registeredAt: '1970-01-01T00:00:00.000Z',
    counselingStatus: child.counselingStatus,
  }
}

function mapParentRelationToConnectionRequest(
  relation: CounselorParentRelationResponseDto,
): CounselorConnectionRequest {
  const statusLabel = getRelationStatusLabel(relation.relationStatus)

  return {
    id: relation.parentId,
    parentName: relation.parentName,
    parentEmail: relation.parentEmail,
    requestedAt: '',
    relationStatus: relation.relationStatus,
    child: {
      id: relation.childrenId,
      name: relation.childrenName,
      meta: statusLabel,
      subText: `보호자 : ${relation.parentName}`,
      registeredAt: '1970-01-01T00:00:00.000Z',
      counselingStatus: relation.relationStatus,
    },
  }
}

const EXPRESSION_FILTERS: ExpressionFilter[] = ['all', 'diary', 'conversation']

function parseDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function clampMetricValue(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeMetricValue(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value)
    ? clampMetricValue(value)
    : 0
}

function formatWeekdayLabel(dateValue: string, fallback?: string | null) {
  if (fallback) {
    return fallback
  }

  const date = parseDate(dateValue)

  if (!date) {
    return dateValue
  }

  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
}

function formatTimelineDate(dateValue: string) {
  const date = parseDate(dateValue)

  if (!date) {
    return dateValue
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  }).format(date)
}

function formatTimelineTime(dateTimeValue?: string | null) {
  if (!dateTimeValue) {
    return null
  }

  const date = new Date(dateTimeValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatTimelineTimeRange(startedAt: string, endedAt?: string | null) {
  const startTime = formatTimelineTime(startedAt)
  const endTime = formatTimelineTime(endedAt)

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`
  }

  return startTime ?? undefined
}

function mapEmotionIconToKey(
  emotionIcon?: string | null,
): DiaryEmotionKey | undefined {
  const normalized = emotionIcon?.trim().toLowerCase()

  if (!normalized) {
    return undefined
  }

  if (
    ['happy', 'calm', 'excited', 'sad', 'angry', 'tired'].includes(normalized)
  ) {
    return normalized as DiaryEmotionKey
  }

  if (
    normalized.includes('positive') ||
    normalized.includes('joy') ||
    normalized.includes('happy') ||
    normalized.includes('기쁨') ||
    normalized.includes('긍정')
  ) {
    return 'happy'
  }

  if (
    normalized.includes('neutral') ||
    normalized.includes('calm') ||
    normalized.includes('평온') ||
    normalized.includes('보통')
  ) {
    return 'calm'
  }

  if (
    normalized.includes('excited') ||
    normalized.includes('신남') ||
    normalized.includes('흥분')
  ) {
    return 'excited'
  }

  if (normalized.includes('sad') || normalized.includes('슬픔')) {
    return 'sad'
  }

  if (normalized.includes('angry') || normalized.includes('분노')) {
    return 'angry'
  }

  if (normalized.includes('tired') || normalized.includes('피곤')) {
    return 'tired'
  }

  return undefined
}

function getFallbackPredictionValue(emotionKey?: DiaryEmotionKey) {
  switch (emotionKey) {
    case 'happy':
    case 'excited':
      return 82
    case 'calm':
      return 64
    case 'sad':
    case 'tired':
      return 36
    case 'angry':
      return 28
    default:
      return 50
  }
}

function parsePredictionValue(
  prediction?: string | null,
  emotionKey?: DiaryEmotionKey,
) {
  const match = prediction?.match(/-?\d+(\.\d+)?/)
  const parsedValue = match ? Number(match[0]) : Number.NaN

  if (Number.isFinite(parsedValue)) {
    const normalizedValue =
      parsedValue > 0 && parsedValue <= 1 ? parsedValue * 100 : parsedValue

    return clampMetricValue(normalizedValue)
  }

  return getFallbackPredictionValue(emotionKey)
}

function mapDashboardChartPoints(
  points: ChildChartPointDto[],
  warningThreshold?: number,
): DashboardMetricPoint[] {
  return points.map((point) => {
    const value = normalizeMetricValue(point.value)

    return {
      label: formatWeekdayLabel(point.date, point.dayLabel),
      value,
      variant:
        typeof warningThreshold === 'number' &&
        typeof point.value === 'number' &&
        point.value < warningThreshold
          ? 'warning'
          : undefined,
    }
  })
}

function createEmptyExpressionAnalysis(): DashboardExpressionAnalysis {
  return {
    days: [],
    insight: '',
    trend: {
      all: [],
      conversation: [],
      diary: [],
    },
  }
}

function createMockExpressionAnalysis(
  weekIndex: number,
  childId: string,
): DashboardExpressionAnalysis {
  const currentWeek = expressionWeeks[weekIndex] ?? expressionWeeks[0]

  return {
    days: currentWeek.days,
    insight: currentWeek.insight,
    trend: {
      all: getWeekAdjustedLineData(currentWeek.trend.all, weekIndex, childId),
      conversation: getWeekAdjustedLineData(
        currentWeek.trend.conversation,
        weekIndex,
        childId,
      ),
      diary: getWeekAdjustedLineData(
        currentWeek.trend.diary,
        weekIndex,
        childId,
      ),
    },
  }
}

function clampWeekIndex(value: number) {
  return Math.max(0, Math.min(expressionWeeks.length - 1, value))
}

function getMockWeekIndex(weekOffset: number) {
  return clampWeekIndex(DEFAULT_EXPRESSION_WEEK_INDEX + weekOffset)
}

function updateObservationRecordComment(
  records: ObservationRecord[],
  reportId: string,
  comment: ObservationRecord['comment'],
) {
  return records.map((record) =>
    record.reportId === reportId
      ? {
          ...record,
          comment,
          hasComment: Boolean(comment),
        }
      : record,
  )
}

function getInitialSidebarCollapsed() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 1180px)').matches
  )
}

function getCardsAverageValue(
  cards: Array<
    CounselorDiaryAnalysisCardDto | CounselorConversationAnalysisCardDto
  >,
) {
  if (cards.length === 0) {
    return 0
  }

  const total = cards.reduce((sum, card) => {
    const emotionKey =
      'emotionIcon' in card ? mapEmotionIconToKey(card.emotionIcon) : undefined

    return sum + parsePredictionValue(card.prediction, emotionKey)
  }, 0)

  return clampMetricValue(total / cards.length)
}

function getAnalysisCardsForFilter(
  filter: ExpressionFilter,
  diaryCards: CounselorDiaryAnalysisCardDto[],
  conversationCards: CounselorConversationAnalysisCardDto[],
) {
  if (filter === 'diary') {
    return diaryCards
  }

  if (filter === 'conversation') {
    return conversationCards
  }

  return [...diaryCards, ...conversationCards]
}

function mapAnalysisContentToExpressionAnalysis(
  response: CounselorAnalysisContentResponseDto,
): DashboardExpressionAnalysis {
  const dailyGroups = response.dailyGroups ?? []
  const trend = EXPRESSION_FILTERS.reduce<
    Record<ExpressionFilter, DashboardMetricPoint[]>
  >(
    (nextTrend, filter) => {
      nextTrend[filter] = dailyGroups
        .map((group): DashboardMetricPoint | null => {
          const diaryCards = group.diaryList ?? []
          const conversationCards = group.conversationList ?? []
          const cards = getAnalysisCardsForFilter(
            filter,
            diaryCards,
            conversationCards,
          )

          if (cards.length === 0) {
            return null
          }

          const firstDiaryEmotionKey = mapEmotionIconToKey(
            diaryCards[0]?.emotionIcon,
          )

          return {
            emotionKey:
              filter !== 'conversation' ? firstDiaryEmotionKey : undefined,
            hasConversation:
              filter !== 'diary' ? conversationCards.length > 0 : undefined,
            label: formatWeekdayLabel(group.date),
            value: getCardsAverageValue(cards),
          }
        })
        .filter((point): point is DashboardMetricPoint => point !== null)

      return nextTrend
    },
    {
      all: [],
      conversation: [],
      diary: [],
    },
  )

  let entryId = 0
  const days = dailyGroups
    .map<TimelineDay>((group, index) => {
      const diaryEntries = (group.diaryList ?? []).map<TimelineEntry>(
        (diary) => {
          entryId += 1

          return {
            content:
              diary.embeddingText ??
              diary.prediction ??
              '표현 분석 내용이 없습니다.',
            emotionKey: mapEmotionIconToKey(diary.emotionIcon),
            id: entryId,
            tags: diary.keywords ?? [],
            type: 'diary',
          }
        },
      )
      const conversationEntries = (
        group.conversationList ?? []
      ).map<TimelineEntry>((conversation) => {
        entryId += 1

        return {
          content:
            conversation.embeddingText ??
            conversation.prediction ??
            '대화 분석 내용이 없습니다.',
          id: entryId,
          tags: conversation.keywords ?? [],
          time: formatTimelineTimeRange(
            conversation.startedAt,
            conversation.endedAt,
          ),
          type: 'conversation',
        }
      })

      return {
        date: formatTimelineDate(group.date),
        entries: [...diaryEntries, ...conversationEntries],
        id: index + 1,
      }
    })
    .filter((day) => day.entries.length > 0)

  return {
    days,
    insight: response.summary ?? '',
    trend,
  }
}

function useCounselorDashboardState() {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useCounselorMockMode()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getInitialSidebarCollapsed,
  )
  const [childItems, setChildItems] = useState<ChildListItem[]>(() =>
    isMockMode ? initialChildList : [],
  )
  const [selectedChildId, setSelectedChildId] = useState<string | null>(() =>
    isMockMode ? (initialChildList[0]?.id ?? null) : null,
  )
  const [isLoadingChildItems, setIsLoadingChildItems] = useState(!isMockMode)
  const [childItemsError, setChildItemsError] = useState<string>()
  const [connectionRequests, setConnectionRequests] = useState(() =>
    isMockMode ? initialConnectionRequests : [],
  )
  const [isLoadingConnectionRequests, setIsLoadingConnectionRequests] =
    useState(!isMockMode)
  const [connectionRequestsError, setConnectionRequestsError] =
    useState<string>()
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [weekOffsets, setWeekOffsets] = useState<DashboardWeekOffsets>(
    INITIAL_DASHBOARD_WEEK_OFFSETS,
  )
  const [sleepScoreData, setSleepScoreData] = useState<DashboardMetricPoint[]>(
    () =>
      isMockMode
        ? getWeekAdjustedLineData(
            sleepScoreBars,
            DEFAULT_EXPRESSION_WEEK_INDEX,
            initialChildList[0]?.id,
          )
        : [],
  )
  const [sleepEfficiencyData, setSleepEfficiencyData] = useState<
    DashboardMetricPoint[]
  >(() =>
    isMockMode
      ? getWeekAdjustedLineData(
          sleepEfficiency,
          DEFAULT_EXPRESSION_WEEK_INDEX,
          initialChildList[0]?.id,
        )
      : [],
  )
  const [biometricRatioData, setBiometricRatioData] = useState<
    DashboardMetricPoint[]
  >(() =>
    isMockMode
      ? getWeekAdjustedLineData(
          biometricRatio,
          DEFAULT_EXPRESSION_WEEK_INDEX,
          initialChildList[0]?.id,
        )
      : [],
  )
  const [autonomicData, setAutonomicData] = useState<DashboardMetricPoint[]>(
    () =>
      isMockMode
        ? getWeekAdjustedLineData(
            hrvTrend,
            DEFAULT_EXPRESSION_WEEK_INDEX,
            initialChildList[0]?.id,
          )
        : [],
  )
  const [dashboardExpressionAnalysis, setDashboardExpressionAnalysis] =
    useState<DashboardExpressionAnalysis>(() =>
      isMockMode
        ? createMockExpressionAnalysis(
            DEFAULT_EXPRESSION_WEEK_INDEX,
            initialChildList[0]?.id ?? 'mock-child-1',
          )
        : createEmptyExpressionAnalysis(),
    )
  const [isLoadingDashboardMetrics, setIsLoadingDashboardMetrics] =
    useState(!isMockMode)
  const [dashboardMetricsError, setDashboardMetricsError] = useState<string>()
  const [analysisCardHeight, setAnalysisCardHeight] = useState<number>()
  const [selectedObservation, setSelectedObservation] =
    useState<ObservationRecord | null>(null)
  const [observationRecords, setObservationRecords] = useState<
    ObservationRecord[]
  >(() => observationRecordsByWeek[expressionWeeks[DEFAULT_EXPRESSION_WEEK_INDEX]?.id] ?? [])
  const [observationComments, setObservationComments] = useState(
    initialObservationComments,
  )
  const [isLoadingObservationRecords, setIsLoadingObservationRecords] =
    useState(!isMockMode)
  const [observationRecordsError, setObservationRecordsError] =
    useState<string>()
  const [isLoadingObservationComment, setIsLoadingObservationComment] =
    useState(false)
  const [isSubmittingObservationComment, setIsSubmittingObservationComment] =
    useState(false)
  const [observationCommentError, setObservationCommentError] =
    useState<string>()
  const [mainColumnElement, setMainColumnElement] =
    useState<HTMLDivElement | null>(null)
  const mainColumnRef = useCallback((node: HTMLDivElement | null) => {
    setMainColumnElement(node)
  }, [])

  const getWeekControls = (section: DashboardWeekSection) => {
    const weekOffset = weekOffsets[section]
    const mockWeekIndex = getMockWeekIndex(weekOffset)
    const weekRange = getWeekRangeByOffset(weekOffset, {
      baseDateStrategy: 'end',
      clampEndDateToToday: true,
    })
    const currentWeek = isMockMode ? expressionWeeks[mockWeekIndex] : weekRange
    const minMockWeekOffset = -DEFAULT_EXPRESSION_WEEK_INDEX
    const maxMockWeekOffset =
      expressionWeeks.length - 1 - DEFAULT_EXPRESSION_WEEK_INDEX

    return {
      weekIndex: isMockMode ? mockWeekIndex : weekOffset,
      currentWeek,
      isFirstWeek: isMockMode ? mockWeekIndex === 0 : false,
      isLastWeek: isMockMode
        ? mockWeekIndex === expressionWeeks.length - 1
        : weekOffset >= 0,
      goPrevWeek: () => {
        setWeekOffsets((current) => ({
          ...current,
          [section]: isMockMode
            ? Math.max(minMockWeekOffset, current[section] - 1)
            : current[section] - 1,
        }))
      },
      goNextWeek: () => {
        setWeekOffsets((current) => ({
          ...current,
          [section]: isMockMode
            ? Math.min(maxMockWeekOffset, current[section] + 1)
            : Math.min(0, current[section] + 1),
        }))
      },
    }
  }

  const observationWeek = getWeekControls('observation')
  const sleepScoreWeek = getWeekControls('sleepScore')
  const sleepEfficiencyWeek = getWeekControls('sleepEfficiency')
  const expressionWeek = getWeekControls('expression')
  const biometricRatioWeek = getWeekControls('biometricRatio')
  const autonomicWeek = getWeekControls('autonomic')
  const currentObservationRecords = selectedChildId ? observationRecords : []
  const selectedChildProfile =
    childItems.find((child) => child.id === selectedChildId) ??
    childItems[0] ??
    null
  const selectedObservationComment = selectedObservation
    ? (observationComments[selectedObservation.reportId] ??
      selectedObservation.comment ??
      null)
    : null

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId)
    setSelectedObservation(null)
    setWeekOffsets(INITIAL_DASHBOARD_WEEK_OFFSETS)
  }

  const handleSaveObservationComment = async (
    record: ObservationRecord,
    context: string,
  ) => {
    if (isMockMode) {
      const nextComment = createMockComment(
        record.id,
        context,
        new Date().toISOString(),
      )

      setObservationComments((current) => ({
        ...current,
        [record.reportId]: nextComment,
      }))
      setObservationRecords((current) =>
        updateObservationRecordComment(current, record.reportId, nextComment),
      )
      return true
    }

    if (!accessToken || !selectedChildId) {
      setObservationCommentError('로그인이 필요합니다.')
      return false
    }

    try {
      setIsSubmittingObservationComment(true)
      setObservationCommentError(undefined)

      const nextComment = await createCounselorComment({
        accessToken,
        childrenId: record.childrenId || selectedChildId,
        context,
        reportId: record.reportId,
      })

      setObservationComments((current) => ({
        ...current,
        [record.reportId]: nextComment,
      }))
      setObservationRecords((current) =>
        updateObservationRecordComment(current, record.reportId, nextComment),
      )
      setSelectedObservation((current) =>
        current?.reportId === record.reportId
          ? {
              ...current,
              comment: nextComment,
              hasComment: true,
            }
          : current,
      )
      return true
    } catch (error) {
      console.error(error)
      setObservationCommentError(
        error instanceof Error
          ? error.message
          : '상담사 코멘트를 작성하지 못했습니다.',
      )
      return false
    } finally {
      setIsSubmittingObservationComment(false)
    }
  }

  const handleDeleteObservationComment = async (
    reportId: string,
    commentId: string,
  ) => {
    if (isMockMode) {
      setObservationComments((current) => ({
        ...current,
        [reportId]: null,
      }))
      setObservationRecords((current) =>
        updateObservationRecordComment(current, reportId, null),
      )
      return true
    }

    if (!accessToken || !selectedChildId) {
      setObservationCommentError('로그인이 필요합니다.')
      return false
    }

    try {
      setIsSubmittingObservationComment(true)
      setObservationCommentError(undefined)

      await deleteCounselorComment({
        accessToken,
        childrenId: selectedObservation?.childrenId || selectedChildId,
        commentId,
        reportId,
      })

      setObservationComments((current) => ({
        ...current,
        [reportId]: null,
      }))
      setObservationRecords((current) =>
        updateObservationRecordComment(current, reportId, null),
      )
      setSelectedObservation((current) =>
        current?.reportId === reportId
          ? {
              ...current,
              comment: null,
              hasComment: false,
            }
          : current,
      )
      return true
    } catch (error) {
      console.error(error)
      setObservationCommentError(
        error instanceof Error
          ? error.message
          : '상담사 코멘트를 삭제하지 못했습니다.',
      )
      return false
    } finally {
      setIsSubmittingObservationComment(false)
    }
  }

  const handleSelectObservation = (record: ObservationRecord | null) => {
    setSelectedObservation(record)
    setObservationCommentError(undefined)
    setIsLoadingObservationComment(false)
    setIsSubmittingObservationComment(false)
  }

  const loadChildItems = useCallback(async () => {
    if (isMockMode) {
      setChildItems(initialChildList)
      setSelectedChildId(initialChildList[0]?.id ?? null)
      setSelectedObservation(null)
      setChildItemsError(undefined)
      setIsLoadingChildItems(false)
      return
    }

    if (!accessToken) {
      setChildItems([])
      setSelectedChildId(null)
      setSelectedObservation(null)
      setChildItemsError(undefined)
      setIsLoadingChildItems(false)
      return
    }

    try {
      setIsLoadingChildItems(true)
      setChildItemsError(undefined)

      const children = await getCounselorChildren(accessToken)
      const nextChildItems = children.map(mapCounselorChildToListItem)

      setChildItems(nextChildItems)
      setSelectedChildId((current) =>
        current && nextChildItems.some((child) => child.id === current)
          ? current
          : (nextChildItems[0]?.id ?? null),
      )
      setSelectedObservation(null)
    } catch (error) {
      console.error(error)
      setChildItems([])
      setSelectedChildId(null)
      setSelectedObservation(null)
      setChildItemsError(
        error instanceof Error
          ? error.message
          : '상담 아동 목록을 불러오지 못했습니다.',
      )
    } finally {
      setIsLoadingChildItems(false)
    }
  }, [accessToken, isMockMode])

  const loadConnectionRequests = useCallback(async () => {
    if (isMockMode) {
      setConnectionRequests(initialConnectionRequests)
      setConnectionRequestsError(undefined)
      setIsLoadingConnectionRequests(false)
      return
    }

    if (!accessToken) {
      setConnectionRequests([])
      setConnectionRequestsError(undefined)
      setIsLoadingConnectionRequests(false)
      return
    }

    try {
      setIsLoadingConnectionRequests(true)
      setConnectionRequestsError(undefined)

      const relations = await getCounselorParentRelations(accessToken)
      const pendingRequests = relations
        .filter((relation) => relation.relationStatus === 'PENDING')
        .map(mapParentRelationToConnectionRequest)

      setConnectionRequests(pendingRequests)
    } catch (error) {
      console.error(error)
      setConnectionRequests([])
      setConnectionRequestsError(
        error instanceof Error
          ? error.message
          : '상담사 연결 요청을 불러오지 못했습니다.',
      )
    } finally {
      setIsLoadingConnectionRequests(false)
    }
  }, [accessToken, isMockMode])

  const loadObservationRecords = useCallback(async () => {
    if (isMockMode) {
      const mockWeekId = expressionWeeks[getMockWeekIndex(weekOffsets.observation)]?.id
      const nextRecords = mockWeekId ? observationRecordsByWeek[mockWeekId] ?? [] : []

      setObservationRecords(nextRecords)
      setSelectedObservation((current) =>
        current && nextRecords.some((record) => record.reportId === current.reportId)
          ? current
          : null,
      )
      setObservationComments(initialObservationComments)
      setObservationRecordsError(undefined)
      setIsLoadingObservationRecords(false)
      return
    }

    if (!accessToken || !selectedChildId) {
      setObservationRecords([])
      setObservationRecordsError(undefined)
      setIsLoadingObservationRecords(false)
      return
    }

    const observationRange = getWeekRangeByOffset(weekOffsets.observation, {
      baseDateStrategy: 'end',
      clampEndDateToToday: true,
    })

    try {
      setIsLoadingObservationRecords(true)
      setObservationRecordsError(undefined)

      const nextRecords = await getCounselorObservationRecords({
        accessToken,
        childrenId: selectedChildId,
        endDate: observationRange.endDate,
        startDate: observationRange.startDate,
      })

      setObservationRecords(nextRecords)
      setSelectedObservation((current) =>
        current && nextRecords.some((record) => record.reportId === current.reportId)
          ? current
          : null,
      )
      setObservationComments((current) => {
        const nextComments = { ...current }

        nextRecords.forEach((record) => {
          if (!record.hasComment) {
            nextComments[record.reportId] = null
          }
        })

        return nextComments
      })
    } catch (error) {
      console.error(error)
      setObservationRecords([])
      setObservationRecordsError(
        error instanceof Error
          ? error.message
          : '상담 아동 관찰 기록을 불러오지 못했습니다.',
      )
    } finally {
      setIsLoadingObservationRecords(false)
    }
  }, [accessToken, isMockMode, selectedChildId, weekOffsets.observation])

  const loadDashboardMetrics = useCallback(async () => {
    const currentChildId =
      selectedChildId ?? initialChildList[0]?.id ?? 'mock-child-1'

    if (isMockMode) {
      setSleepScoreData(
        getWeekAdjustedLineData(
          sleepScoreBars,
          getMockWeekIndex(weekOffsets.sleepScore),
          currentChildId,
        ),
      )
      setSleepEfficiencyData(
        getWeekAdjustedLineData(
          sleepEfficiency,
          getMockWeekIndex(weekOffsets.sleepEfficiency),
          currentChildId,
        ),
      )
      setBiometricRatioData(
        getWeekAdjustedLineData(
          biometricRatio,
          getMockWeekIndex(weekOffsets.biometricRatio),
          currentChildId,
        ),
      )
      setAutonomicData(
        getWeekAdjustedLineData(
          hrvTrend,
          getMockWeekIndex(weekOffsets.autonomic),
          currentChildId,
        ),
      )
      setDashboardExpressionAnalysis(
        createMockExpressionAnalysis(
          getMockWeekIndex(weekOffsets.expression),
          currentChildId,
        ),
      )
      setDashboardMetricsError(undefined)
      setIsLoadingDashboardMetrics(false)
      return
    }

    if (!accessToken || !selectedChildId) {
      setSleepScoreData([])
      setSleepEfficiencyData([])
      setBiometricRatioData([])
      setAutonomicData([])
      setDashboardExpressionAnalysis(createEmptyExpressionAnalysis())
      setDashboardMetricsError(undefined)
      setIsLoadingDashboardMetrics(false)
      return
    }

    const weekRangeOptions = {
      baseDateStrategy: 'end' as const,
      clampEndDateToToday: true,
    }
    const sleepScoreRange = getWeekRangeByOffset(
      weekOffsets.sleepScore,
      weekRangeOptions,
    )
    const sleepEfficiencyRange = getWeekRangeByOffset(
      weekOffsets.sleepEfficiency,
      weekRangeOptions,
    )
    const biometricRatioRange = getWeekRangeByOffset(
      weekOffsets.biometricRatio,
      weekRangeOptions,
    )
    const autonomicRange = getWeekRangeByOffset(
      weekOffsets.autonomic,
      weekRangeOptions,
    )
    const expressionRange = getWeekRangeByOffset(
      weekOffsets.expression,
      weekRangeOptions,
    )

    try {
      setIsLoadingDashboardMetrics(true)
      setDashboardMetricsError(undefined)

      const [
        sleepScores,
        sleepEfficiencies,
        hrAccRatios,
        rmssds,
        analysisContent,
      ] = await Promise.all([
        getChildSleepScores({
          accessToken,
          baseDate: sleepScoreRange.baseDate,
          childrenId: selectedChildId,
        }),
        getChildSleepEfficiencies({
          accessToken,
          baseDate: sleepEfficiencyRange.baseDate,
          childrenId: selectedChildId,
        }),
        getChildHrAccRatios({
          accessToken,
          baseDate: biometricRatioRange.baseDate,
          childrenId: selectedChildId,
        }),
        getChildRmssds({
          accessToken,
          baseDate: autonomicRange.baseDate,
          childrenId: selectedChildId,
        }),
        getCounselorAnalysisContent({
          accessToken,
          childId: selectedChildId,
          endDate: expressionRange.endDate,
          startDate: expressionRange.startDate,
        }),
      ])

      setSleepScoreData(mapDashboardChartPoints(sleepScores.contents ?? [], 60))
      setSleepEfficiencyData(
        mapDashboardChartPoints(sleepEfficiencies.contents ?? []),
      )
      setBiometricRatioData(mapDashboardChartPoints(hrAccRatios.contents ?? []))
      setAutonomicData(mapDashboardChartPoints(rmssds.contents ?? []))
      setDashboardExpressionAnalysis(
        mapAnalysisContentToExpressionAnalysis(analysisContent),
      )
    } catch (error) {
      console.error(error)
      setSleepScoreData([])
      setSleepEfficiencyData([])
      setBiometricRatioData([])
      setAutonomicData([])
      setDashboardExpressionAnalysis(createEmptyExpressionAnalysis())
      setDashboardMetricsError(
        error instanceof Error
          ? error.message
          : '상담사 대시보드 분석 데이터를 불러오지 못했습니다.',
      )
    } finally {
      setIsLoadingDashboardMetrics(false)
    }
  }, [accessToken, isMockMode, selectedChildId, weekOffsets])

  const handleAcceptConnectionRequest = async (
    request: CounselorConnectionRequest,
  ) => {
    if (isMockMode) {
      const acceptedChild = {
        ...request.child,
        registeredAt: new Date().toISOString(),
      }

      setChildItems((current) =>
        [
          acceptedChild,
          ...current.filter((child) => child.id !== acceptedChild.id),
        ].sort(
          (first, second) =>
            new Date(second.registeredAt).getTime() -
            new Date(first.registeredAt).getTime(),
        ),
      )
      setConnectionRequests((current) =>
        current.filter((candidate) => candidate.id !== request.id),
      )
      handleSelectChild(acceptedChild.id)
      return
    }

    if (!accessToken) {
      setConnectionRequestsError('로그인이 필요합니다.')
      return
    }

    try {
      setIsLoadingConnectionRequests(true)
      setConnectionRequestsError(undefined)

      const acceptedRelation = await acceptCounselorParentRelation(
        request.id,
        accessToken,
      )

      await Promise.all([loadChildItems(), loadConnectionRequests()])
      handleSelectChild(acceptedRelation.childrenId)
    } catch (error) {
      console.error(error)
      setConnectionRequestsError(
        error instanceof Error
          ? error.message
          : '상담사 연결 요청을 수락하지 못했습니다.',
      )
    } finally {
      setIsLoadingConnectionRequests(false)
    }
  }

  const handleRejectConnectionRequest = async (requestId: string) => {
    if (isMockMode) {
      setConnectionRequests((current) =>
        current.filter((request) => request.id !== requestId),
      )
      return
    }

    if (!accessToken) {
      setConnectionRequestsError('로그인이 필요합니다.')
      return
    }

    try {
      setIsLoadingConnectionRequests(true)
      setConnectionRequestsError(undefined)

      await rejectCounselorParentRelation(requestId, accessToken)
      await loadConnectionRequests()
    } catch (error) {
      console.error(error)
      setConnectionRequestsError(
        error instanceof Error
          ? error.message
          : '상담사 연결 요청을 거절하지 못했습니다.',
      )
    } finally {
      setIsLoadingConnectionRequests(false)
    }
  }


  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadChildItems()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadChildItems])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadConnectionRequests()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadConnectionRequests])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadObservationRecords()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadObservationRecords])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboardMetrics()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDashboardMetrics])

  useEffect(() => {
    if (!selectedObservation) {
      return undefined
    }

    if (isMockMode) {
      return undefined
    }

    if (!accessToken || !selectedChildId) {
      return undefined
    }

    if (!selectedObservation.hasComment) {
      return undefined
    }

    if (observationComments[selectedObservation.reportId] !== undefined) {
      return undefined
    }

    let isActive = true

    const loadSelectedObservationComment = async () => {
      try {
        setIsLoadingObservationComment(true)
        setObservationCommentError(undefined)

        const comment = await getCounselorComment({
          accessToken,
          childrenId: selectedObservation.childrenId || selectedChildId,
          reportId: selectedObservation.reportId,
        })

        if (!isActive) {
          return
        }

        setObservationComments((current) => ({
          ...current,
          [selectedObservation.reportId]: comment,
        }))
        setObservationRecords((current) =>
          updateObservationRecordComment(
            current,
            selectedObservation.reportId,
            comment,
          ),
        )
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error(error)
        setObservationCommentError(
          error instanceof Error
            ? error.message
            : '상담사 코멘트를 불러오지 못했습니다.',
        )
      } finally {
        if (isActive) {
          setIsLoadingObservationComment(false)
        }
      }
    }

    void loadSelectedObservationComment()

    return () => {
      isActive = false
    }
  }, [
    accessToken,
    isMockMode,
    observationComments,
    selectedChildId,
    selectedObservation,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    if (!mainColumnElement) return undefined

    const updateAnalysisHeight = () => {
      const shouldMatchColumns = window.matchMedia('(min-width: 901px)').matches

      if (!shouldMatchColumns) {
        setAnalysisCardHeight(undefined)
        return
      }

      setAnalysisCardHeight(
        Math.round(mainColumnElement.getBoundingClientRect().height),
      )
    }

    const animationFrameId = window.requestAnimationFrame(updateAnalysisHeight)

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateAnalysisHeight)
    resizeObserver?.observe(mainColumnElement)
    window.addEventListener('resize', updateAnalysisHeight)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateAnalysisHeight)
    }
  }, [mainColumnElement])

  return {
    analysisCardHeight,
    autonomicData,
    autonomicWeek,
    biometricRatioData,
    biometricRatioWeek,
    childItems,
    childItemsError,
    connectionRequests,
    connectionRequestsError,
    currentObservationRecords,
    dashboardExpressionAnalysis,
    dashboardMetricsError,
    expressionWeek,
    handleAcceptConnectionRequest,
    handleDeleteObservationComment,
    handleRejectConnectionRequest,
    handleSaveObservationComment,
    handleSelectChild,
    isLoadingObservationComment,
    isLoadingConnectionRequests,
    isLoadingDashboardMetrics,
    isConnectionModalOpen,
    isLoadingChildItems,
    isLoadingObservationRecords,
    isSubmittingObservationComment,
    isSidebarCollapsed,
    mainColumnRef,
    observationCommentError,
    observationComments,
    observationRecordsError,
    observationWeek,
    selectedChildId,
    selectedChildProfile,
    selectedObservation,
    selectedObservationComment,
    setIsConnectionModalOpen,
    setIsSidebarCollapsed,
    setSelectedObservation: handleSelectObservation,
    sleepEfficiencyData,
    sleepEfficiencyWeek,
    sleepScoreData,
    sleepScoreWeek,
    canRejectConnectionRequests: true,
  }
}

export default useCounselorDashboardState
export { mapAnalysisContentToExpressionAnalysis }
