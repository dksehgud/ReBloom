import { useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import type { ParentObservationMood } from '../constants/parentObservationMoods'
import { useParentObservationPreview } from '../hooks/useParentObservationPreview'
import { useParentMockMode } from '../hooks/useParentMockMode'
import { getParentObservationApi } from '../services/parentObservationService'
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
      />

      {isCreateModalOpen ? (
        <ParentObservationFormModal
          mode="create"
          dateLabel={formatDateLabel(draftDate)}
          selectedMood={draftMood}
          content={draftDescription}
          canGoNextDate={false}
          canGoPreviousDate={false}
          isSubmitDisabled={
            isSubmitting || !draftMood || draftDescription.trim().length === 0
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
