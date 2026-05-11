import { useEffect, useRef, useState } from 'react'

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
  CounselorConnectionRequest,
  DashboardWeekIndexes,
  DashboardWeekSection,
  ObservationRecord,
} from '../types/dashboard'

function useCounselorDashboardState() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [childItems, setChildItems] = useState(initialChildList)
  const [selectedChildId, setSelectedChildId] = useState(initialChildList[0].id)
  const [connectionRequests, setConnectionRequests] = useState(initialConnectionRequests)
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
    observationRecordsByWeek[observationWeek.currentWeek.id] ?? []
  const selectedChildProfile =
    childItems.find((child) => child.id === selectedChildId) ?? childItems[0]
  const selectedObservationComment = selectedObservation
    ? observationComments[selectedObservation.reportId] ?? null
    : null

  const handleSelectChild = (childId: number) => {
    setSelectedChildId(childId)
    setSelectedObservation(null)
    setWeekIndexes(INITIAL_DASHBOARD_WEEK_INDEXES)
  }

  const handleAcceptConnectionRequest = (request: CounselorConnectionRequest) => {
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
  }

  const handleRejectConnectionRequest = (requestId: number) => {
    setConnectionRequests((current) =>
      current.filter((request) => request.id !== requestId),
    )
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
    connectionRequests,
    currentObservationRecords,
    expressionWeek,
    handleAcceptConnectionRequest,
    handleDeleteObservationComment,
    handleRejectConnectionRequest,
    handleSaveObservationComment,
    handleSelectChild,
    isConnectionModalOpen,
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
  }
}

export default useCounselorDashboardState
