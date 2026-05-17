import { useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { PARENT_OBSERVATION_DESCRIPTION_MAX_LENGTH } from '../constants/parentObservationLimits'
import type { ParentObservationMood } from '../constants/parentObservationMoods'
import { useParentObservationPreview } from '../hooks/useParentObservationPreview'
import { useParentMockMode } from '../hooks/useParentMockMode'
import { getParentObservationApi } from '../services/parentObservationService'
import ParentObservationDetailModal from './ParentObservationDetailModal'
import ParentObservationFormModal from './ParentObservationFormModal'
import ParentObservationListSection from './ParentObservationListSection'

type ParentObservationSectionProps = {
  childrenId?: string
  isConnectionLoading?: boolean
}

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function getTodayDateOnly() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function formatDateLabel(date: Date) {
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    weekday: 'short',
  }).format(date)

  return `${padNumber(date.getMonth() + 1)}/${padNumber(date.getDate())} ${weekday}`
}

function formatRecordDateLabel({
  date,
  weekday,
}: {
  date: string
  weekday: string
}) {
  return `${date} ${weekday}`
}

function formatReportDateTime(date: Date) {
  const now = new Date()

  return [
    `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
      date.getDate(),
    )}`,
    `${padNumber(now.getHours())}:${padNumber(now.getMinutes())}:00`,
  ].join('T')
}

function ParentObservationSection({
  childrenId,
  isConnectionLoading = false,
}: ParentObservationSectionProps) {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useParentMockMode()
  const parentObservationApi = useMemo(
    () => getParentObservationApi(isMockMode),
    [isMockMode],
  )
  const { records, isLoading, isError, refetch } =
    useParentObservationPreview(childrenId)
  const hasConnectedChild = Boolean(childrenId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [draftDate, setDraftDate] = useState(getTodayDateOnly)
  const [draftMood, setDraftMood] = useState<ParentObservationMood | null>(null)
  const [draftDescription, setDraftDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<
    (typeof records)[number] | null
  >(null)

  const selectedRecord = useMemo(() => {
    if (selectedRecordDetail?.id === selectedRecordId) {
      return selectedRecordDetail
    }

    return records.find((record) => record.id === selectedRecordId) ?? null
  }, [records, selectedRecordDetail, selectedRecordId])

  const selectedRecordIndex = useMemo(() => {
    if (!selectedRecordId) {
      return -1
    }

    return records.findIndex((record) => record.id === selectedRecordId)
  }, [records, selectedRecordId])

  const handleOpenCreate = () => {
    if (!hasConnectedChild) {
      return
    }

    setDraftDate(getTodayDateOnly())
    setDraftMood(null)
    setDraftDescription('')
    setIsCreateModalOpen(true)
  }

  const handleCloseCreate = () => {
    if (isSubmitting) {
      return
    }

    setIsCreateModalOpen(false)
  }

  const handleSubmitCreate = async () => {
    const nextDescription = draftDescription.trim()

    if (
      !childrenId ||
      !draftMood ||
      nextDescription.length === 0 ||
      draftDescription.length > PARENT_OBSERVATION_DESCRIPTION_MAX_LENGTH ||
      isSubmitting
    ) {
      return
    }

    try {
      setIsSubmitting(true)
      await parentObservationApi.createParentObservationReport({
        accessToken,
        childrenId,
        payload: {
          context: nextDescription,
          emotionTag: draftMood,
          reportDate: formatReportDateTime(draftDate),
        },
      })
      setIsCreateModalOpen(false)
      refetch()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectRecord = (recordId: string) => {
    if (!childrenId) {
      return
    }

    const fallbackRecord = records.find((record) => record.id === recordId)

    if (!fallbackRecord) {
      return
    }

    setSelectedRecordId(recordId)
    setSelectedRecordDetail(fallbackRecord)

    void parentObservationApi
      .getParentObservationDetail({
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

  const handleCloseDetail = () => {
    setSelectedRecordId(null)
    setSelectedRecordDetail(null)
  }

  const handleNavigateDetailRecord = (direction: -1 | 1) => {
    if (selectedRecordIndex < 0) {
      return
    }

    const nextRecord = records[selectedRecordIndex + direction]

    if (!nextRecord) {
      return
    }

    handleSelectRecord(nextRecord.id)
  }

  return (
    <>
      <ParentObservationListSection
        records={records}
        currentMonthLabel="최근 일주일"
        emptyDescription={
          hasConnectedChild
            ? undefined
            : '아이 계정 회원가입 시 부모 정보를 입력하면 관찰 기록을 입력할 수 있어요.'
        }
        emptyMessage={
          hasConnectedChild
            ? '최근 일주일간 작성한 기록이 없습니다.'
            : '아직 연결된 아이가 없습니다.'
        }
        isLoading={isConnectionLoading || isLoading}
        isError={isError}
        onAddRecord={hasConnectedChild ? handleOpenCreate : undefined}
        onSelectRecord={hasConnectedChild ? handleSelectRecord : undefined}
      />

      {selectedRecord ? (
        <ParentObservationDetailModal
          record={selectedRecord}
          dateLabel={formatRecordDateLabel(selectedRecord)}
          currentPosition={selectedRecordIndex + 1}
          totalCount={records.length}
          hasPrevious={selectedRecordIndex > 0}
          hasNext={
            selectedRecordIndex > -1 && selectedRecordIndex < records.length - 1
          }
          onClose={handleCloseDetail}
          onPrevious={() => handleNavigateDetailRecord(-1)}
          onNext={() => handleNavigateDetailRecord(1)}
        />
      ) : null}

      {isCreateModalOpen ? (
        <ParentObservationFormModal
          mode="create"
          dateLabel={formatDateLabel(draftDate)}
          selectedMood={draftMood}
          content={draftDescription}
          canGoNextDate={false}
          canGoPreviousDate={false}
          isSubmitDisabled={
            isSubmitting ||
            !draftMood ||
            draftDescription.trim().length === 0 ||
            draftDescription.length > PARENT_OBSERVATION_DESCRIPTION_MAX_LENGTH
          }
          onClose={handleCloseCreate}
          onSelectMood={setDraftMood}
          onContentChange={setDraftDescription}
          onSubmit={handleSubmitCreate}
        />
      ) : null}
    </>
  )
}

export default ParentObservationSection
