import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getCounselorChildren,
  type CounselorChildResponseDto,
} from '../api/counselorChildrenApi'
import {
  acceptCounselorParentRelation,
  getCounselorParentRelations,
  type CounselorParentRelationResponseDto,
} from '../api/counselorParentRelationApi'
import {
  INITIAL_DASHBOARD_WEEK_INDEXES,
  createMockComment,
  expressionWeeks,
  initialChildList,
  initialConnectionRequests,
  initialObservationComments,
  observationRecordsByWeek,
} from '../mocks/dashboardMockData'
import type {
  ChildListItem,
  CounselorConnectionRequest,
  DashboardWeekIndexes,
  DashboardWeekSection,
  ObservationRecord,
} from '../types/dashboard'
import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
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

function mapCounselorChildToListItem(
  child: CounselorChildResponseDto,
): ChildListItem {
  const statusLabel = getCounselingStatusLabel(child.counselingStatus)

  return {
    id: child.childrenId,
    name: child.name,
    meta: statusLabel,
    subText: '연결된 상담 아동',
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

function useCounselorDashboardState() {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useCounselorMockMode()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [childItems, setChildItems] = useState<ChildListItem[]>(() =>
    isMockMode ? initialChildList : [],
  )
  const [selectedChildId, setSelectedChildId] = useState<string | null>(() =>
    isMockMode ? initialChildList[0]?.id ?? null : null,
  )
  const [isLoadingChildItems, setIsLoadingChildItems] = useState(!isMockMode)
  const [childItemsError, setChildItemsError] = useState<string>()
  const [connectionRequests, setConnectionRequests] = useState(() =>
    isMockMode ? initialConnectionRequests : [],
  )
  const [isLoadingConnectionRequests, setIsLoadingConnectionRequests] =
    useState(!isMockMode)
  const [connectionRequestsError, setConnectionRequestsError] = useState<string>()
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [weekIndexes, setWeekIndexes] = useState<DashboardWeekIndexes>(
    INITIAL_DASHBOARD_WEEK_INDEXES,
  )
  const [analysisCardHeight, setAnalysisCardHeight] = useState<number>()
  const [selectedObservation, setSelectedObservation] = useState<ObservationRecord | null>(null)
  const [observationComments, setObservationComments] = useState(initialObservationComments)
  const mainColumnRef = useRef<HTMLDivElement | null>(null)

  const getWeekControls = (section: DashboardWeekSection) => {
    const weekIndex = weekIndexes[section]
    const currentWeek = expressionWeeks[weekIndex]

    return {
      weekIndex,
      currentWeek,
      isFirstWeek: weekIndex === 0,
      isLastWeek: weekIndex === expressionWeeks.length - 1,
      goPrevWeek: () => {
        setWeekIndexes((current) => ({
          ...current,
          [section]: Math.max(0, current[section] - 1),
        }))
      },
      goNextWeek: () => {
        setWeekIndexes((current) => ({
          ...current,
          [section]: Math.min(expressionWeeks.length - 1, current[section] + 1),
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
  const currentObservationRecords =
    selectedChildId ? observationRecordsByWeek[observationWeek.currentWeek.id] ?? [] : []
  const selectedChildProfile =
    childItems.find((child) => child.id === selectedChildId) ?? childItems[0] ?? null
  const selectedObservationComment = selectedObservation
    ? observationComments[selectedObservation.reportId] ?? null
    : null

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId)
    setSelectedObservation(null)
    setWeekIndexes(INITIAL_DASHBOARD_WEEK_INDEXES)
  }

  const handleSaveObservationComment = (record: ObservationRecord, context: string) => {
    setObservationComments((current) => ({
      ...current,
      [record.reportId]: createMockComment(record.id, context, new Date().toISOString()),
    }))
  }

  const handleDeleteObservationComment = (reportId: string, commentId: string) => {
    void commentId

    setObservationComments((current) => ({
      ...current,
      [reportId]: null,
    }))
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
          : nextChildItems[0]?.id ?? null,
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

  const handleAcceptConnectionRequest = async (
    request: CounselorConnectionRequest,
  ) => {
    if (isMockMode) {
      const acceptedChild = {
        ...request.child,
        registeredAt: new Date().toISOString(),
      }

      setChildItems((current) =>
        [acceptedChild, ...current.filter((child) => child.id !== acceptedChild.id)].sort(
          (first, second) =>
            new Date(second.registeredAt).getTime() - new Date(first.registeredAt).getTime(),
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

  const handleRejectConnectionRequest = (requestId: string) => {
    setConnectionRequests((current) =>
      current.filter((request) => request.id !== requestId),
    )
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
    const columnElement = mainColumnRef.current

    if (!columnElement) return undefined

    const updateAnalysisHeight = () => {
      const shouldMatchColumns = window.matchMedia('(min-width: 901px)').matches

      if (!shouldMatchColumns) {
        setAnalysisCardHeight(undefined)
        return
      }

      setAnalysisCardHeight(Math.round(columnElement.getBoundingClientRect().height))
    }

    updateAnalysisHeight()

    const resizeObserver = new ResizeObserver(updateAnalysisHeight)
    resizeObserver.observe(columnElement)
    window.addEventListener('resize', updateAnalysisHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateAnalysisHeight)
    }
  }, [])

  return {
    analysisCardHeight,
    autonomicWeek,
    biometricRatioWeek,
    childItems,
    childItemsError,
    connectionRequests,
    connectionRequestsError,
    currentObservationRecords,
    expressionWeek,
    handleAcceptConnectionRequest,
    handleDeleteObservationComment,
    handleRejectConnectionRequest,
    handleSaveObservationComment,
    handleSelectChild,
    isLoadingConnectionRequests,
    isConnectionModalOpen,
    isLoadingChildItems,
    isSidebarCollapsed,
    mainColumnRef,
    observationComments,
    observationWeek,
    selectedChildId,
    selectedChildProfile,
    selectedObservation,
    selectedObservationComment,
    setIsConnectionModalOpen,
    setIsSidebarCollapsed,
    setSelectedObservation,
    sleepEfficiencyWeek,
    sleepScoreWeek,
    canRejectConnectionRequests: isMockMode,
  }
}

export default useCounselorDashboardState
