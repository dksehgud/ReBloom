import { useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import {
  createParentObservationReport,
  deleteParentObservationReport,
  getParentObservationDetail,
  updateParentObservationReport,
} from '../api/parentObservationApi'
import { type ParentObservationMood } from '../constants/parentObservationMoods'
import type { ParentObservationRecord } from '../types/parentObservation'
import { useParentObservationList } from './useParentObservationList'

type ParentObservationModalMode = 'detail' | 'create' | 'edit' | 'delete' | null

type DraftDate = {
  year: number
  month: number
  day: number
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getMaxSelectableDay(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month)
  const today = new Date()

  if (year === today.getFullYear() && month === today.getMonth() + 1) {
    return Math.min(daysInMonth, today.getDate())
  }

  return daysInMonth
}

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function formatBannerDateLabel(month: number, day: number) {
  return `${month}월 ${day}일`
}

function formatModalDateLabel(month: number, day: number, weekday: string) {
  return `${padNumber(month)}/${padNumber(day)} ${weekday}`
}

function createRecordId({
  year,
  month,
  day,
  recordedAt,
}: DraftDate & { recordedAt: string }) {
  return `observation-${year}-${padNumber(month)}-${padNumber(day)}-${recordedAt.replace(':', '')}`
}

function getCurrentTimeLabel() {
  const now = new Date()
  return `${padNumber(now.getHours())}:${padNumber(now.getMinutes())}`
}

function createReportDateTime(
  { year, month, day }: DraftDate,
  recordedAt: string,
) {
  const timeWithSeconds =
    recordedAt.split(':').length === 2 ? `${recordedAt}:00` : recordedAt

  return `${year}-${padNumber(month)}-${padNumber(day)}T${timeWithSeconds}`
}

function getMonthKey(year: number, month: number) {
  return `${year}-${padNumber(month)}`
}

function sortRecords(records: ParentObservationRecord[]) {
  return [...records].sort((left, right) => {
    const leftKey = `${left.reportDate}T${left.recordedAt}`
    const rightKey = `${right.reportDate}T${right.recordedAt}`
    return rightKey.localeCompare(leftKey)
  })
}

export function useParentObservationPageState(childrenId?: string) {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const {
    currentYear,
    currentMonth,
    records,
    isLoading,
    isError,
    refetch: refetchRecords,
    handlePreviousMonth,
    handleNextMonth,
  } = useParentObservationList(childrenId)

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [recordsOverrideByMonth, setRecordsOverrideByMonth] = useState<
    Record<string, ParentObservationRecord[]>
  >({})
  const [modalMode, setModalMode] = useState<ParentObservationModalMode>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [selectedRecordDetail, setSelectedRecordDetail] =
    useState<ParentObservationRecord | null>(null)
  const [draftDate, setDraftDate] = useState<DraftDate>({
    year: currentYear,
    month: currentMonth,
    day: 1,
  })
  const [draftMood, setDraftMood] = useState<ParentObservationMood | null>(null)
  const [draftDescription, setDraftDescription] = useState('')
  const [isMutating, setIsMutating] = useState(false)

  const monthKey = getMonthKey(currentYear, currentMonth)
  const canUseObservationApi = Boolean(accessToken && childrenId)

  const clearCurrentMonthOverride = () => {
    setRecordsOverrideByMonth((previous) => {
      if (!previous[monthKey]) {
        return previous
      }

      const next = { ...previous }
      delete next[monthKey]
      return next
    })
  }

  const localRecords = useMemo(
    () => recordsOverrideByMonth[monthKey] ?? sortRecords(records),
    [monthKey, records, recordsOverrideByMonth],
  )

  const markedDays = useMemo(
    () =>
      Array.from(new Set(localRecords.map((record) => record.day))).sort(
        (left, right) => left - right,
      ),
    [localRecords],
  )

  const selectedDateRecords = useMemo(() => {
    if (selectedDay === null) {
      return localRecords
    }

    return localRecords.filter((record) => record.day === selectedDay)
  }, [localRecords, selectedDay])

  const selectedDateLabel = useMemo(() => {
    if (selectedDay === null) {
      return null
    }

    return formatBannerDateLabel(currentMonth, selectedDay)
  }, [currentMonth, selectedDay])

  const selectedRecord = useMemo(() => {
    if (selectedRecordDetail?.id === selectedRecordId) {
      return selectedRecordDetail
    }

    return localRecords.find((record) => record.id === selectedRecordId) ?? null
  }, [localRecords, selectedRecordDetail, selectedRecordId])

  const detailRecords = useMemo(() => {
    if (!selectedRecord) {
      return []
    }

    return localRecords.filter((record) => record.day === selectedRecord.day)
  }, [localRecords, selectedRecord])

  const selectedRecordIndex = useMemo(() => {
    if (!selectedRecordId) {
      return -1
    }

    return detailRecords.findIndex((record) => record.id === selectedRecordId)
  }, [detailRecords, selectedRecordId])

  const detailDateLabel = useMemo(() => {
    if (!selectedRecord) {
      return ''
    }

    return formatModalDateLabel(
      currentMonth,
      selectedRecord.day,
      selectedRecord.weekday,
    )
  }, [currentMonth, selectedRecord])

  const draftDateLabel = useMemo(() => {
    const draftWeekday = ['일', '월', '화', '수', '목', '금', '토'][
      new Date(draftDate.year, draftDate.month - 1, draftDate.day).getDay()
    ]

    return formatModalDateLabel(draftDate.month, draftDate.day, draftWeekday)
  }, [draftDate])

  const handleSelectDay = (day: number) => {
    setSelectedDay((previousDay) => (previousDay === day ? null : day))
  }

  const handleObservationPreviousMonth = () => {
    setSelectedDay(null)
    setModalMode(null)
    setSelectedRecordId(null)
    setSelectedRecordDetail(null)
    handlePreviousMonth()
  }

  const handleObservationNextMonth = () => {
    setSelectedDay(null)
    setModalMode(null)
    setSelectedRecordId(null)
    setSelectedRecordDetail(null)
    handleNextMonth()
  }

  const handleSelectRecord = (recordId: string) => {
    const fallbackRecord =
      localRecords.find((record) => record.id === recordId) ?? null

    setSelectedRecordId(recordId)
    setSelectedRecordDetail(fallbackRecord)
    setModalMode('detail')

    if (!accessToken || !childrenId) {
      return
    }

    void getParentObservationDetail({
      accessToken,
      childrenId,
      reportId: recordId,
    })
      .then((record) => {
        setSelectedRecordDetail((currentRecord) =>
          currentRecord?.id === recordId ? record : currentRecord,
        )
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const handleCloseModal = () => {
    setModalMode(null)
  }

  const handleOpenDelete = () => {
    if (!selectedRecord) {
      return
    }

    setModalMode('delete')
  }

  const handleConfirmDelete = async () => {
    if (!selectedRecord) {
      return
    }

    if (canUseObservationApi && accessToken && childrenId) {
      try {
        setIsMutating(true)
        await deleteParentObservationReport({
          accessToken,
          childrenId,
          reportId: selectedRecord.id,
        })
        clearCurrentMonthOverride()
        refetchRecords()
        setModalMode(null)
        setSelectedRecordId(null)
        setSelectedRecordDetail(null)
      } catch (error) {
        console.error(error)
      } finally {
        setIsMutating(false)
      }

      return
    }

    setRecordsOverrideByMonth((previous) => {
      const previousMonthRecords = previous[monthKey] ?? localRecords

      return {
        ...previous,
        [monthKey]: previousMonthRecords.filter(
          (record) => record.id !== selectedRecord.id,
        ),
      }
    })
    setModalMode(null)
    setSelectedRecordId(null)
    setSelectedRecordDetail(null)
  }

  const handleOpenEdit = () => {
    if (!selectedRecord) {
      return
    }

    setDraftDate({
      year: currentYear,
      month: currentMonth,
      day: selectedRecord.day,
    })
    setDraftMood(selectedRecord.mood as ParentObservationMood)
    setDraftDescription(selectedRecord.description)
    setModalMode('edit')
  }

  const handleNavigateVisibleRecord = (direction: -1 | 1) => {
    if (selectedRecordIndex < 0) {
      return
    }

    const nextRecord = detailRecords[selectedRecordIndex + direction]

    if (!nextRecord) {
      return
    }

    handleSelectRecord(nextRecord.id)
  }

  const handleOpenCreate = () => {
    const today = new Date()
    const isViewingTodayMonth =
      currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1
    const fallbackDay =
      selectedDay ??
      (isViewingTodayMonth ? today.getDate() : localRecords[0]?.day ?? 1)

    setDraftDate({
      year: currentYear,
      month: currentMonth,
      day: fallbackDay,
    })
    setDraftMood(null)
    setDraftDescription('')
    setModalMode('create')
  }

  const handleShiftDraftDate = (diff: -1 | 1) => {
    setDraftDate((previousDate) => {
      const maxSelectableDay = getMaxSelectableDay(
        previousDate.year,
        previousDate.month,
      )
      const nextDay = Math.min(
        maxSelectableDay,
        Math.max(1, previousDate.day + diff),
      )

      return {
        ...previousDate,
        day: nextDay,
      }
    })
  }

  const applyLocalDraft = (
    recordedAt: string,
    nextDescription: string,
    nextMood: ParentObservationMood,
  ) => {
    const nextRecord: ParentObservationRecord = {
      id:
        modalMode === 'edit' && selectedRecord
          ? selectedRecord.id
          : createRecordId({ ...draftDate, recordedAt }),
      reportDate: `${draftDate.year}-${padNumber(draftDate.month)}-${padNumber(draftDate.day)}`,
      recordedAt,
      date: `${padNumber(draftDate.month)}/${padNumber(draftDate.day)}`,
      day: draftDate.day,
      weekday: ['일', '월', '화', '수', '목', '금', '토'][
        new Date(draftDate.year, draftDate.month - 1, draftDate.day).getDay()
      ],
      mood: nextMood,
      description: nextDescription,
      counselorComment:
        modalMode === 'edit' && selectedRecord
          ? selectedRecord.counselorComment ?? null
          : null,
    }

    setRecordsOverrideByMonth((previous) => {
      const previousMonthRecords = previous[monthKey] ?? localRecords
      const filteredRecords =
        modalMode === 'edit' && selectedRecord
          ? previousMonthRecords.filter((record) => record.id !== selectedRecord.id)
          : previousMonthRecords

      return {
        ...previous,
        [monthKey]: sortRecords([...filteredRecords, nextRecord]),
      }
    })
    setSelectedDay(draftDate.day)
    setSelectedRecordId(nextRecord.id)
    setSelectedRecordDetail(nextRecord)
    setModalMode('detail')
  }

  const handleSubmitDraft = async () => {
    const nextDescription = draftDescription.trim()

    if (!draftMood || nextDescription.length === 0) {
      return
    }

    const recordedAt =
      modalMode === 'edit' && selectedRecord
        ? selectedRecord.recordedAt
        : getCurrentTimeLabel()

    if (canUseObservationApi && accessToken && childrenId) {
      const payload = {
        context: nextDescription,
        emotionTag: draftMood,
        reportDate: createReportDateTime(draftDate, recordedAt),
      }

      try {
        setIsMutating(true)

        if (modalMode === 'edit' && selectedRecord) {
          await updateParentObservationReport({
            accessToken,
            childrenId,
            reportId: selectedRecord.id,
            payload,
          })
          setSelectedRecordId(selectedRecord.id)
          setModalMode('detail')
        } else {
          await createParentObservationReport({
            accessToken,
            childrenId,
            payload,
          })
          setSelectedRecordId(null)
          setSelectedRecordDetail(null)
          setModalMode(null)
        }

        clearCurrentMonthOverride()
        setSelectedDay(draftDate.day)
        refetchRecords()
      } catch (error) {
        console.error(error)
      } finally {
        setIsMutating(false)
      }

      return
    }

    applyLocalDraft(recordedAt, nextDescription, draftMood)
  }

  return {
    currentYear,
    currentMonth,
    markedDays,
    selectedDay,
    selectedDateLabel,
    selectedDateRecords,
    selectedRecord,
    detailDateLabel,
    detailRecordPosition: selectedRecordIndex > -1 ? selectedRecordIndex + 1 : 0,
    detailRecordCount: detailRecords.length,
    draftDateLabel,
    draftMood,
    draftDescription,
    modalMode,
    isLoading,
    isError,
    hasPreviousDetailRecord: selectedRecordIndex > 0,
    hasNextDetailRecord:
      selectedRecordIndex > -1 && selectedRecordIndex < detailRecords.length - 1,
    isDraftSubmitDisabled:
      isMutating || !draftMood || draftDescription.trim().length === 0,
    handlePreviousMonth: handleObservationPreviousMonth,
    handleNextMonth: handleObservationNextMonth,
    handleSelectDay,
    handleSelectRecord,
    handleCloseModal,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDelete,
    handleConfirmDelete,
    handleViewPreviousRecord: () => handleNavigateVisibleRecord(-1),
    handleViewNextRecord: () => handleNavigateVisibleRecord(1),
    handleDraftPreviousDate: () => handleShiftDraftDate(-1),
    handleDraftNextDate: () => handleShiftDraftDate(1),
    handleSelectDraftMood: setDraftMood,
    handleDraftDescriptionChange: setDraftDescription,
    handleSubmitDraft,
  }
}
