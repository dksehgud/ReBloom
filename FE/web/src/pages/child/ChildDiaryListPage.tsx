import { useEffect, useMemo, useState } from 'react'

import ChildFloatingActionButton from '../../components/organisms/FloatingActionButton/ChildFloatingActionButton'
import ChildHeader from '../../components/organisms/Header/ChildHeader'
import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import DiaryCalendar from '../../features/diary/components/DiaryCalendar'
import type { DiaryCalendarEntry } from '../../features/diary/components/DiaryCalendar'
import DiaryDetailView from '../../features/diary/components/DiaryDetailView'
import DiaryDeleteConfirmModal from '../../features/diary/components/DiaryDeleteConfirmModal'
import DiaryEmotionSelectModal, {
  type DiaryEmotionKey,
} from '../../features/diary/components/DiaryEmotionSelectModal'
import DiaryListView from '../../features/diary/components/DiaryListView'
import type { DiaryListItem } from '../../features/diary/components/DiaryListView'
import DiaryWriteView from '../../features/diary/components/DiaryWriteView'
import { preloadDiaryEmotionAssets } from '../../features/diary/constants/diaryEmotions'

type DiaryRecord = {
  id: string
  day: number
  summary: string
  content: string
  emotionKey: DiaryEmotionKey
}

type ViewMode = 'calendar' | 'list' | 'detail' | 'write'
type MainViewMode = 'calendar' | 'list' | 'detail'
type ChildDiaryListPageProps = {
  onOpenSettings?: () => void
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 7H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5 12H16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5 17H14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.9 4.5H13.1L13.6 6.3C14 6.5 14.4 6.7 14.8 7L16.6 6.3L18.1 7.8L17.4 9.6C17.7 10 17.9 10.4 18.1 10.8L19.9 11.3V13.5L18.1 14C17.9 14.4 17.7 14.8 17.4 15.2L18.1 17L16.6 18.5L14.8 17.8C14.4 18.1 14 18.3 13.6 18.5L13.1 20.3H10.9L10.4 18.5C10 18.3 9.6 18.1 9.2 17.8L7.4 18.5L5.9 17L6.6 15.2C6.3 14.8 6.1 14.4 5.9 14L4.1 13.5V11.3L5.9 10.8C6.1 10.4 6.3 10 6.6 9.6L5.9 7.8L7.4 6.3L9.2 7C9.6 6.7 10 6.5 10.4 6.3L10.9 4.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12.4" r="2.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

const SAMPLE_RECORDS_BY_MONTH: Record<string, DiaryRecord[]> = {
  '2026-03': [
    {
      id: '2026-03-04',
      day: 4,
      summary: '블록 놀이가 무너지지 않아서 기뻤어요.',
      content:
        '오늘은 블록 놀이가 무너지지 않아서 기뻤어요. 맨 위 블록까지 무너지지 않아서 정말 뿌듯했어요.',
      emotionKey: 'happy',
    },
    {
      id: '2026-03-08',
      day: 8,
      summary: '밖에서 오래 놀아서 기분이 좋았어요.',
      content:
        '친구랑 오래 놀면서 달리기도 하고 미끄럼틀도 탔어요. 오늘은 하루가 금방 지나간 것 같아요.',
      emotionKey: 'excited',
    },
    {
      id: '2026-03-17',
      day: 17,
      summary: '친구가 장난을 해서 조금 속상했어요.',
      content:
        '같이 놀던 친구가 내 장난감을 먼저 집어서 속상했어요. 조금 속상했지만 내일 다시 이야기하고 싶어요.',
      emotionKey: 'sad',
    },
    {
      id: '2026-03-25',
      day: 25,
      summary: '엄마랑 같이 그림책을 읽었어요.',
      content:
        '엄마랑 소파에 앉아 그림책을 읽었어요. 재미있는 그림이 많아서 계속 보고 싶었어요.',
      emotionKey: 'calm',
    },
  ],
  '2026-04': [
    {
      id: '2026-04-03',
      day: 3,
      summary: '오늘은 수업 시간에 발표를 했어요.',
      content:
        '선생님이 질문했을 때 손을 들고 크게 말했어요. 친구들이 잘했다고 해서 조금 뿌듯했어요.',
      emotionKey: 'happy',
    },
    {
      id: '2026-04-07',
      day: 7,
      summary: '간식으로 좋아하는 과일을 먹었어요.',
      content:
        '간식 시간에 사과랑 과일을 먹었어요. 친구랑 반씩 나눠 먹으니까 더 맛있게 느껴졌어요.',
      emotionKey: 'calm',
    },
    {
      id: '2026-04-14',
      day: 14,
      summary: '비가 와서 밖에 못 나가 조금 아쉬웠어요.',
      content:
        '비가 많이 와서 놀이터에 가지 못했어요. 창문으로 비를 보고 있으니 밖에 가고 싶다고 생각했어요.',
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
      summary: '친구랑 역할놀이를 하고 많이 웃었어요.',
      content:
        '친구랑 병원 놀이를 하면서 서로 역할을 바꿔 가며 놀았어요. 시간이 길게 가는 줄 몰랐어요.',
      emotionKey: 'excited',
    },
    {
      id: '2026-04-21',
      day: 21,
      summary: '오늘은 가족과 함께 공원을 산책했어요.',
      content:
        '저녁을 먹고 가족과 천천히 산책했어요. 바람이 시원해서 기분이 편안했고, 같이 걷는 시간이 즐거웠어요.',
      emotionKey: 'calm',
    },
  ],
  '2026-05': [
    {
      id: '2026-05-02',
      day: 2,
      summary: '주말이라 더 자서 편안했어요.',
      content:
        '평소보다 늦게 일어나서 몸이 가벼웠어요. 아침도 먹고 여유롭게 준비했어요.',
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
        '친구와 예쁜 색종이로 종이접기를 만들었어요. 완성하고 나니 정말 멋져 보여서 기분이 좋았어요.',
      emotionKey: 'calm',
    },
  ],
  '2026-06': [],
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function getRecordId(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function createSummary(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 28) {
    return normalized
  }

  return `${normalized.slice(0, 28)}...`
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

function ChildDiaryListPage({ onOpenSettings }: ChildDiaryListPageProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 3, 1))
  const [recordsByMonth, setRecordsByMonth] = useState<Record<string, DiaryRecord[]>>(() =>
    Object.fromEntries(
      Object.entries(SAMPLE_RECORDS_BY_MONTH).map(([monthKey, records]) => [
        monthKey,
        records.map((record) => ({ ...record })),
      ]),
    ),
  )
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [previousViewMode, setPreviousViewMode] = useState<MainViewMode>('calendar')
  const [writePreviousViewMode, setWritePreviousViewMode] = useState<MainViewMode>('calendar')
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null)
  const [editingDiaryId, setEditingDiaryId] = useState<string | null>(null)
  const [draftEmotionKey, setDraftEmotionKey] = useState<DiaryEmotionKey | null>(null)
  const [draftContent, setDraftContent] = useState('')
  const [isEmotionModalOpen, setIsEmotionModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    preloadDiaryEmotionAssets()
  }, [])

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const records = useMemo(
    () => recordsByMonth[getMonthKey(currentYear, currentMonth)] ?? [],
    [currentMonth, currentYear, recordsByMonth],
  )

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedDiaryId) ?? null,
    [records, selectedDiaryId],
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

  const editingRecord = useMemo(
    () => records.find((record) => record.id === editingDiaryId) ?? null,
    [editingDiaryId, records],
  )

  const writeDateLabel = useMemo(() => {
    if (editingRecord) {
      return formatDetailDateLabel(currentYear, currentMonth, editingRecord.day)
    }

    return formatWriteDateLabel(today)
  }, [currentMonth, currentYear, editingRecord, today])

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'calendar' ? 'list' : 'calendar'))
  }

  const openDetail = (recordId: string, source: MainViewMode) => {
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

  const handleListItemClick = (item: DiaryListItem) => {
    openDetail(item.id, 'list')
  }

  const handleBackFromDetail = () => {
    setViewMode(previousViewMode)
  }

  const handleOpenWrite = () => {
    setWritePreviousViewMode(viewMode === 'list' ? 'list' : 'calendar')
    setEditingDiaryId(null)
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

    const monthKey = getMonthKey(currentYear, currentMonth)

    setRecordsByMonth((prev) => {
      const existingRecords = prev[monthKey] ?? []
      const nextRecords = existingRecords.filter((record) => record.id !== selectedRecord.id)

      return {
        ...prev,
        [monthKey]: nextRecords,
      }
    })

    setIsDeleteModalOpen(false)
    setSelectedDiaryId(null)
    setViewMode(previousViewMode)
  }

  const handleSubmitWrite = () => {
    if (!draftEmotionKey || draftContent.trim().length === 0) {
      return
    }

    const isEditing = Boolean(editingDiaryId && editingRecord)
    const year = isEditing ? currentYear : today.getFullYear()
    const month = isEditing ? currentMonth : today.getMonth() + 1
    const day = isEditing && editingRecord ? editingRecord.day : today.getDate()
    const monthKey = getMonthKey(year, month)
    const recordId = editingDiaryId ?? getRecordId(year, month, day)
    const nextRecord: DiaryRecord = {
      id: recordId,
      day,
      summary: createSummary(draftContent),
      content: draftContent.trim(),
      emotionKey: draftEmotionKey,
    }

    setRecordsByMonth((prev) => {
      const existingRecords = prev[monthKey] ?? []
      const filteredRecords = existingRecords.filter((record) => record.id !== recordId)
      const nextRecords = [...filteredRecords, nextRecord].sort((a, b) => a.day - b.day)

      return {
        ...prev,
        [monthKey]: nextRecords,
      }
    })

    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDiaryId(recordId)
    setEditingDiaryId(null)
    setDraftEmotionKey(null)
    setDraftContent('')
    setIsEmotionModalOpen(false)
    setViewMode('detail')
  }

  const header =
    viewMode === 'detail' || viewMode === 'write' ? undefined : (
      <ChildHeader
        mode="brand"
        rightSlot={
          <>
            <button
              type="button"
              className="child-header-icon-button"
              aria-label={viewMode === 'calendar' ? '일기 목록 보기' : '캘린더 보기'}
              onClick={handleToggleViewMode}
            >
              <MenuIcon />
            </button>
            <button
              type="button"
              className="child-header-icon-button"
              aria-label="설정"
              onClick={onOpenSettings}
            >
              <SettingsIcon />
            </button>
          </>
        }
      />
    )

  return (
    <MobilePageLayout
      className="child-diary-list-page"
      contentClassName={`child-diary-list-page__content child-diary-list-page__content--${viewMode}`}
      header={header}
    >
      <div className={`child-diary-list-page__body child-diary-list-page__body--${viewMode}`}>
        {viewMode === 'calendar' ? (
          <>
            <DiaryCalendar
              year={currentYear}
              month={currentMonth}
              entries={calendarEntries}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              onEntryClick={handleCalendarEntryClick}
            />
            <ChildFloatingActionButton ariaLabel="일기 작성" onClick={handleOpenWrite} />
          </>
        ) : null}

        {viewMode === 'list' ? (
          <>
            <DiaryListView
              year={currentYear}
              month={currentMonth}
              items={listItems}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              onItemClick={handleListItemClick}
            />
            <ChildFloatingActionButton ariaLabel="일기 작성" onClick={handleOpenWrite} />
          </>
        ) : null}

        {viewMode === 'detail' && selectedRecord ? (
          <>
            <DiaryDetailView
              dateLabel={formatDetailDateLabel(currentYear, currentMonth, selectedRecord.day)}
              emotionKey={selectedRecord.emotionKey}
              content={selectedRecord.content}
              onBack={handleBackFromDetail}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDeleteModal}
            />
            {isDeleteModalOpen ? (
              <DiaryDeleteConfirmModal
                onCancel={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
              />
            ) : null}
          </>
        ) : null}

        {viewMode === 'write' ? (
          <>
            <DiaryWriteView
              dateLabel={writeDateLabel}
              content={draftContent}
              emotionKey={draftEmotionKey}
              isSubmitDisabled={!draftEmotionKey || draftContent.trim().length === 0}
              onBack={handleBackFromWrite}
              onMoodClick={handleOpenEmotionModal}
              onContentChange={(event) => setDraftContent(event.target.value)}
              onSubmit={handleSubmitWrite}
            />
            {isEmotionModalOpen ? (
              <DiaryEmotionSelectModal
                selectedEmotionKey={draftEmotionKey}
                onClose={handleCloseEmotionModal}
                onSelect={handleSelectEmotion}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </MobilePageLayout>
  )
}

export default ChildDiaryListPage
