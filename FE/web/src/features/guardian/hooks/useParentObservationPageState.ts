import { useMemo, useState } from 'react'

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

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function formatBannerDateLabel(month: number, day: number) {
  return `${month}월 ${day}일`
}

function formatModalDateLabel(month: number, day: number, weekday: string) {
  return `${padNumber(month)}/${padNumber(day)} ${weekday}`
}

function createRecordId({ year, month, day, recordedAt }: DraftDate & { recordedAt: string }) {
  return `observation-${year}-${padNumber(month)}-${padNumber(day)}-${recordedAt.replace(':', '')}`
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

export function useParentObservationPageState() {
  const {
    currentYear,
    currentMonth,
    records,
    isLoading,
    isError,
    handlePreviousMonth,
    handleNextMonth,
  } = useParentObservationList()

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [recordsOverrideByMonth, setRecordsOverrideByMonth] = useState<
    Record<string, ParentObservationRecord[]>
  >({})
  const [modalMode, setModalMode] = useState<ParentObservationModalMode>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [draftDate, setDraftDate] = useState<DraftDate>({
    year: currentYear,
    month: currentMonth,
    day: 1,
  })
  const [draftMood, setDraftMood] = useState<ParentObservationMood | null>(null)
  const [draftDescription, setDraftDescription] = useState('')

  const monthKey = getMonthKey(currentYear, currentMonth)

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

  const selectedRecord = useMemo(
    () => localRecords.find((record) => record.id === selectedRecordId) ?? null,
    [localRecords, selectedRecordId],
  )

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

  const openDetailModal = (recordId: string) => {
    setSelectedRecordId(recordId)
    setModalMode('detail')
  }

  const handleSelectDay = (day: number) => {
    setSelectedDay((previousDay) => (previousDay === day ? null : day))
  }

  const handleObservationPreviousMonth = () => {
    setSelectedDay(null)
    setModalMode(null)
    setSelectedRecordId(null)
    handlePreviousMonth()
  }

  const handleObservationNextMonth = () => {
    setSelectedDay(null)
    setModalMode(null)
    setSelectedRecordId(null)
    handleNextMonth()
  }

  const handleSelectRecord = (recordId: string) => {
    openDetailModal(recordId)
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

  const handleConfirmDelete = () => {
    if (!selectedRecord) {
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

    setSelectedRecordId(nextRecord.id)
  }

  const handleOpenCreate = () => {
    const today = new Date()
    const isViewingTodayMonth =
      currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1
    const fallbackDay = selectedDay ?? (isViewingTodayMonth ? today.getDate() : localRecords[0]?.day ?? 1)

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
      const daysInMonth = getDaysInMonth(previousDate.year, previousDate.month)
      const nextDay = Math.min(
        daysInMonth,
        Math.max(1, previousDate.day + diff),
      )

      return {
        ...previousDate,
        day: nextDay,
      }
    })
  }

  const handleSubmitDraft = () => {
    if (!draftMood || draftDescription.trim().length === 0) {
      return
    }

    const recordedAt =
      modalMode === 'edit' && selectedRecord ? selectedRecord.recordedAt : '21:00'
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
      mood: draftMood,
      description: draftDescription.trim(),
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
    setModalMode('detail')
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
      !draftMood || draftDescription.trim().length === 0,
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
