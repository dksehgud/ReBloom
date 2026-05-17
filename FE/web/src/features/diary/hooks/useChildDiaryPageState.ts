import { useEffect, useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { requestDiaryAnalysis } from '../api/diaryAnalysisApi'
import { diaryBridge, type NativeDiary } from '../bridge/diaryBridge'
import type { DiaryCalendarEntry } from '../components/DiaryCalendar'
import type { DiaryListItem } from '../components/DiaryListView'
import { DIARY_CONTENT_MAX_LENGTH } from '../constants/diaryLimits'
import { preloadDiaryEmotionAssets, type DiaryEmotionKey } from '../constants/diaryEmotions'
import type {
  DiaryRecord,
  DiaryRecordsByMonth,
  DiaryViewMode,
  MainDiaryViewMode,
} from '../types/diary'

const SAMPLE_RECORDS_BY_MONTH: DiaryRecordsByMonth = {
  '2026-03': [
    {
      id: '2026-03-04',
      day: 4,
      summary: '블록 탑이 무너지지 않아 기뻤어요.',
      content:
        '오늘은 블록 탑이 무너지지 않아 기뻤어요. 마지막 블록까지 무너지지 않아서 정말 뿌듯했어요.',
      emotionKey: 'happy',
    },
    {
      id: '2026-03-08',
      day: 8,
      summary: '밖에서 오래 뛰어서 기분이 좋았어요.',
      content:
        '친구들과 밖에서 뛰면서 숨바꼭질도 하고 미끄럼틀도 탔어요. 오늘은 하루가 금방 지나간 것 같아요.',
      emotionKey: 'excited',
    },
    {
      id: '2026-03-17',
      day: 17,
      summary: '친구가 놀려서 조금 속상했어요.',
      content:
        '같이 놀던 친구가 내 장난감을 먼저 집어서 속상했어요. 조금 속상했지만 내일 다시 이야기하고 싶어요.',
      emotionKey: 'sad',
    },
    {
      id: '2026-03-25',
      day: 25,
      summary: '엄마와 같이 그림책을 읽었어요.',
      content:
        '엄마와 소파에 앉아 그림책을 읽었어요. 재미있는 그림이 많아서 계속 보고 싶었어요.',
      emotionKey: 'calm',
    },
  ],
  '2026-04': [
    {
      id: '2026-04-03',
      day: 3,
      summary: '오늘은 수업 시간에 발표를 했어요.',
      content:
        '선생님이 질문했을 때 손을 들고 크게 말했어요. 친구들이 쳐다봐서 조금 부담됐어요.',
      emotionKey: 'happy',
    },
    {
      id: '2026-04-07',
      day: 7,
      summary: '간식으로 좋아하는 과일을 먹었어요.',
      content:
        '간식 시간에 사과와 과일을 먹었어요. 친구와 반씩 나눠 먹어서 더 맛있게 느껴졌어요.',
      emotionKey: 'calm',
    },
    {
      id: '2026-04-14',
      day: 14,
      summary: '비가 와서 밖에 못 가 조금 아쉬웠어요.',
      content:
        '비가 많이 와서 놀이터에 가지 못했어요. 창문으로 비를 보고 있으니 밖에 가고 싶다는 생각이 들었어요.',
      emotionKey: 'sad',
    },
    {
      id: '2026-04-15',
      day: 15,
      summary: '선생님께 칭찬을 받아 기뻤어요.',
      content:
        '정리 정돈을 잘했더니 선생님이 칭찬해줬어요. 오늘 하루가 아주 기분 좋게 느껴졌어요.',
      emotionKey: 'happy',
    },
    {
      id: '2026-04-16',
      day: 16,
      summary: '친구들과 역할 놀이를 하고 많이 웃었어요.',
      content:
        '친구와 병원 놀이를 하면서 서로 역할도 바꿔가며 놀았어요. 시간이 길게 간 줄 몰랐어요.',
      emotionKey: 'excited',
    },
    {
      id: '2026-04-21',
      day: 21,
      summary: '오늘은 가족과 함께 공원을 산책했어요.',
      content:
        '저녁을 먹고 가족과 천천히 산책했어요. 바람이 시원해서 기분이 편안하고, 같이 걷는 시간이 즐거웠어요.',
      emotionKey: 'calm',
    },
  ],
  '2026-05': [
    {
      id: '2026-05-02',
      day: 2,
      summary: '주말이라 집에서 편안했어요.',
      content:
        '평소보다 늦게 일어나서 몸이 가벼웠어요. 아침을 먹고 자유롭게 준비했어요.',
      emotionKey: 'calm',
    },
    {
      id: '2026-05-05',
      day: 5,
      summary: '어린이날 선물을 받아 정말 신났어요.',
      content:
        '기다리던 선물을 받고 너무 기뻤어요. 하루 종일 안고 다니면서 자랑하고 싶었어요.',
      emotionKey: 'excited',
    },
    {
      id: '2026-05-11',
      day: 11,
      summary: '실수해서 마음이 조금 무거웠어요.',
      content:
        '준비하던 걸 실수해서 마음이 조금 무거웠어요. 속상했지만 금방 괜찮아졌어요.',
      emotionKey: 'tired',
    },
    {
      id: '2026-05-22',
      day: 22,
      summary: '체육 시간에 달리기를 끝까지 했어요.',
      content:
        '친구들과 같이 달리기를 하는데 끝까지 포기하지 않고 뛰었어요. 스스로 뿌듯했어요.',
      emotionKey: 'happy',
    },
    {
      id: '2026-05-27',
      day: 27,
      summary: '친구와 종이접기를 만들어 즐거웠어요.',
      content:
        '친구와 여러 색종이로 종이접기를 만들었어요. 완성하고 나니 정말 멋져 보여서 기분이 좋았어요.',
      emotionKey: 'calm',
    },
  ],
  '2026-06': [],
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function createDiaryRecordId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16)
    const nextValue = token === 'x' ? value : (value & 0x3) | 0x8

    return nextValue.toString(16)
  })
}

function createSummary(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 28) {
    return normalized
  }

  return `${normalized.slice(0, 28)}...`
}

const DIARY_EMOTION_KEYS: DiaryEmotionKey[] = ['happy', 'calm', 'excited', 'sad', 'angry', 'tired']

function normalizeEmotionKey(value: DiaryEmotionKey | null): DiaryEmotionKey {
  return value && DIARY_EMOTION_KEYS.includes(value) ? value : 'calm'
}

function getDateText(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDayFromDateText(diaryDate: string) {
  return Number(diaryDate.slice(8, 10))
}

function nativeDiaryToRecord(diary: NativeDiary): DiaryRecord {
  return {
    id: diary.id,
    day: getDayFromDateText(diary.diaryDate),
    summary: createSummary(diary.content),
    content: diary.content,
    emotionKey: normalizeEmotionKey(diary.emotionKey),
  }
}

function formatDateLabel(year: number, month: number, day: number) {
  return `${year}. ${month}. ${day}.`
}

function formatDetailDateLabel(year: number, month: number, day: number) {
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']
  const weekDay = dayLabels[new Date(year, month - 1, day).getDay()]
  return `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')}. (${weekDay})`
}

function formatWriteDateLabel(date: Date) {
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']
  const weekDay = dayLabels[date.getDay()]
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(
    date.getDate(),
  ).padStart(2, '0')}. (${weekDay})`
}

function cloneSampleRecords() {
  void SAMPLE_RECORDS_BY_MONTH
  return {} satisfies DiaryRecordsByMonth
}

function useChildDiaryPageState() {
  const currentUserId = useAppSessionStore((state) => state.currentUser?.userId ?? null)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [recordsByMonth, setRecordsByMonth] = useState<DiaryRecordsByMonth>(() =>
    diaryBridge.isAvailable() ? {} : cloneSampleRecords(),
  )
  const [viewMode, setViewMode] = useState<DiaryViewMode>('calendar')
  const [previousViewMode, setPreviousViewMode] = useState<MainDiaryViewMode>('calendar')
  const [writePreviousViewMode, setWritePreviousViewMode] = useState<MainDiaryViewMode>('calendar')
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null)
  const [editingDiaryId, setEditingDiaryId] = useState<string | null>(null)
  const [draftDate, setDraftDate] = useState<Date>(() => new Date())
  const [draftEmotionKey, setDraftEmotionKey] = useState<DiaryEmotionKey | null>(null)
  const [draftContent, setDraftContent] = useState('')
  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    preloadDiaryEmotionAssets()
  }, [])

  useEffect(() => {
    setRecordsByMonth(diaryBridge.isAvailable() ? {} : cloneSampleRecords())
    setSelectedDiaryId(null)
    setEditingDiaryId(null)
    setViewMode('calendar')
  }, [currentUserId])

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const currentMonthKey = getMonthKey(currentYear, currentMonth)

  useEffect(() => {
    if (!diaryBridge.isAvailable() || !currentUserId) {
      return undefined
    }

    try {
      const nextRecords = diaryBridge
        .getDiariesByMonth(currentUserId, currentMonthKey)
        .map(nativeDiaryToRecord)

      setRecordsByMonth((prev) => ({
        ...prev,
        [currentMonthKey]: nextRecords,
      }))
    } catch (error) {
      console.error('Failed to load native diary records', error)
    }

    return undefined
  }, [currentMonthKey, currentUserId])

  const records = useMemo(
    () => recordsByMonth[currentMonthKey] ?? [],
    [currentMonthKey, recordsByMonth],
  )

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedDiaryId) ?? null,
    [records, selectedDiaryId],
  )

  const editingRecord = useMemo(
    () => records.find((record) => record.id === editingDiaryId) ?? null,
    [editingDiaryId, records],
  )

  const calendarEntries = useMemo<DiaryCalendarEntry[]>(
    () =>
      records.map((record) => ({
        day: record.day,
        emotionKey: record.emotionKey,
      })),
    [records],
  )

  const listItems = useMemo<DiaryListItem[]>(
    () =>
      records.map((record) => ({
        id: record.id,
        dateLabel: formatDateLabel(currentYear, currentMonth, record.day),
        summary: record.summary,
        emotionKey: record.emotionKey,
      })),
    [currentMonth, currentYear, records],
  )

  const detailDateLabel = useMemo(() => {
    if (!selectedRecord) {
      return ''
    }

    return formatDetailDateLabel(currentYear, currentMonth, selectedRecord.day)
  }, [currentMonth, currentYear, selectedRecord])

  const writeDateLabel = useMemo(() => {
    if (editingRecord) {
      return formatDetailDateLabel(currentYear, currentMonth, editingRecord.day)
    }

    return formatWriteDateLabel(draftDate)
  }, [currentMonth, currentYear, draftDate, editingRecord])
  const trimmedDraftContent = draftContent.trim()

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'calendar' ? 'list' : 'calendar'))
  }

  const openDetail = (recordId: string, source: MainDiaryViewMode) => {
    setSelectedDiaryId(recordId)
    setPreviousViewMode(source)
    setViewMode('detail')
  }

  const handleCalendarEntryClick = (entry: DiaryCalendarEntry) => {
    const matchedRecord = records.find((record) => record.day === entry.day)
    if (!matchedRecord) {
      return
    }

    openDetail(matchedRecord.id, 'calendar')
  }

  const handleCalendarDayClick = (day: number) => {
    setWritePreviousViewMode('calendar')
    setEditingDiaryId(null)
    setDraftDate(new Date(currentYear, currentMonth - 1, day))
    setDraftEmotionKey(null)
    setDraftContent('')
    setViewMode('write')
  }

  const handleListItemClick = (item: DiaryListItem) => {
    openDetail(item.id, 'list')
  }

  const handleBackFromDetail = () => {
    setViewMode(previousViewMode)
  }

  const handleOpenWrite = () => {
    setWritePreviousViewMode(viewMode === 'list' ? 'list' : 'calendar')

    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()
    const todayMonthKey = getMonthKey(todayYear, todayMonth)
    const todayDateText = getDateText(todayYear, todayMonth, todayDay)
    const currentTodayRecord = recordsByMonth[todayMonthKey]?.find(
      (record) => record.day === todayDay,
    )

    if (currentTodayRecord) {
      setCurrentDate(new Date(todayYear, todayMonth - 1, 1))
      setEditingDiaryId(currentTodayRecord.id)
      setDraftDate(today)
      setDraftEmotionKey(currentTodayRecord.emotionKey)
      setDraftContent(currentTodayRecord.content)
      setViewMode('write')
      return
    }

    if (diaryBridge.isAvailable() && currentUserId) {
      try {
        const nativeDiary = diaryBridge.getDiaryByDate(currentUserId, todayDateText)

        if (nativeDiary) {
          const todayRecord = nativeDiaryToRecord(nativeDiary)

          setRecordsByMonth((prev) => {
            const existingRecords = prev[todayMonthKey] ?? []
            const filteredRecords = existingRecords.filter((record) => record.id !== todayRecord.id)
            const nextRecords = [...filteredRecords, todayRecord].sort((a, b) => a.day - b.day)

            return {
              ...prev,
              [todayMonthKey]: nextRecords,
            }
          })
          setCurrentDate(new Date(todayYear, todayMonth - 1, 1))
          setEditingDiaryId(todayRecord.id)
          setDraftDate(today)
          setDraftEmotionKey(todayRecord.emotionKey)
          setDraftContent(todayRecord.content)
          setViewMode('write')
          return
        }
      } catch (error) {
        console.error('Failed to load native diary record by date', error)
      }
    }

    setEditingDiaryId(null)
    setDraftDate(today)
    setDraftEmotionKey(null)
    setDraftContent('')
    setViewMode('write')
  }

  const handleOpenEdit = () => {
    if (!selectedRecord) {
      return
    }

    setWritePreviousViewMode('detail')
    setEditingDiaryId(selectedRecord.id)
    setDraftEmotionKey(selectedRecord.emotionKey)
    setDraftContent(selectedRecord.content)
    setViewMode('write')
  }

  const handleBackFromWrite = () => {
    setIsEmotionModalOpen(false)
    setEditingDiaryId(null)
    setViewMode(writePreviousViewMode)
  }

  const handleOpenEmotionModal = () => {
    setIsEmotionModalOpen(true)
  }

  const handleCloseEmotionModal = () => {
    setIsEmotionModalOpen(false)
  }

  const handleSelectEmotion = (emotionKey: DiaryEmotionKey) => {
    setDraftEmotionKey(emotionKey)
    setIsEmotionModalOpen(false)
  }

  const handleOpenDeleteModal = () => {
    if (!selectedRecord) {
      return
    }

    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
  }

  const handleConfirmDelete = () => {
    if (!selectedRecord) {
      return
    }

    if (diaryBridge.isAvailable()) {
      if (!currentUserId) {
        console.error('Cannot delete native diary record without current user id')
        return
      }

      try {
        const deleted = diaryBridge.deleteDiary(currentUserId, selectedRecord.id)
        if (!deleted) {
          return
        }
      } catch (error) {
        console.error('Failed to delete native diary record', error)
        return
      }
    }

    setRecordsByMonth((prev) => {
      const existingRecords = prev[currentMonthKey] ?? []
      const nextRecords = existingRecords.filter((record) => record.id !== selectedRecord.id)

      return {
        ...prev,
        [currentMonthKey]: nextRecords,
      }
    })

    setIsDeleteModalOpen(false)
    setSelectedDiaryId(null)
    setViewMode(previousViewMode)
  }

  const handleSubmitWrite = () => {
    if (
      !draftEmotionKey ||
      trimmedDraftContent.length === 0 ||
      draftContent.length > DIARY_CONTENT_MAX_LENGTH
    ) {
      return
    }

    const isEditing = Boolean(editingDiaryId && editingRecord)
    const year = isEditing ? currentYear : draftDate.getFullYear()
    const month = isEditing ? currentMonth : draftDate.getMonth() + 1
    const day = isEditing && editingRecord ? editingRecord.day : draftDate.getDate()
    const monthKey = getMonthKey(year, month)
    const diaryDate = getDateText(year, month, day)
    const trimmedContent = trimmedDraftContent
    let nextRecord: DiaryRecord = {
      id: editingDiaryId ?? createDiaryRecordId(),
      day,
      summary: createSummary(trimmedContent),
      content: trimmedContent,
      emotionKey: draftEmotionKey,
    }

    if (diaryBridge.isAvailable()) {
      if (!currentUserId) {
        console.error('Cannot save native diary record without current user id')
        return
      }

      try {
        const savedDiary = diaryBridge.saveDiary({
          id: editingDiaryId ?? undefined,
          userId: currentUserId,
          diaryDate,
          content: trimmedContent,
          emotionKey: draftEmotionKey,
        })

        if (!savedDiary) {
          return
        }

        nextRecord = nativeDiaryToRecord(savedDiary)
      } catch (error) {
        console.error('Failed to save native diary record', error)
        return
      }
    } else if (currentUserId) {
      void requestDiaryAnalysis({
        diary_id: nextRecord.id,
        user_id: currentUserId,
        target_date: diaryDate,
        emotion_icon: draftEmotionKey,
        content: trimmedContent,
      }).catch((error) => {
        console.error('Failed to request diary analysis', error)
      })
    }

    setRecordsByMonth((prev) => {
      const existingRecords = prev[monthKey] ?? []
      const filteredRecords = existingRecords.filter((record) => record.id !== nextRecord.id)
      const nextRecords = [...filteredRecords, nextRecord].sort((a, b) => a.day - b.day)

      return {
        ...prev,
        [monthKey]: nextRecords,
      }
    })

    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDiaryId(nextRecord.id)
    setEditingDiaryId(null)
    setDraftEmotionKey(null)
    setDraftContent('')
    setIsEmotionModalOpen(false)
    setViewMode('detail')
  }

  return {
    currentMonth,
    currentYear,
    viewMode,
    calendarEntries,
    listItems,
    selectedRecord,
    detailDateLabel,
    writeDateLabel,
    draftContent,
    draftEmotionKey,
    isEmotionModalOpen,
    isDeleteModalOpen,
    isWriteSubmitDisabled:
      !draftEmotionKey ||
      trimmedDraftContent.length === 0 ||
      draftContent.length > DIARY_CONTENT_MAX_LENGTH,
    handlePreviousMonth,
    handleNextMonth,
    handleToggleViewMode,
    handleCalendarEntryClick,
    handleCalendarDayClick,
    handleListItemClick,
    handleBackFromDetail,
    handleOpenWrite,
    handleOpenEdit,
    handleBackFromWrite,
    handleOpenEmotionModal,
    handleCloseEmotionModal,
    handleSelectEmotion,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleSubmitWrite,
    setDraftContent,
  }
}

export { useChildDiaryPageState }
