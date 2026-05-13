import { useParentObservationPreview } from '../hooks/useParentObservationPreview'
import ParentObservationListSection from './ParentObservationListSection'

type ParentObservationSectionProps = {
  childrenId?: string
  isConnectionLoading?: boolean
}

function ParentObservationSection({
  childrenId,
  isConnectionLoading = false,
}: ParentObservationSectionProps) {
  const { records, isLoading, isError } = useParentObservationPreview(childrenId)
  const hasConnectedChild = Boolean(childrenId)

  return (
    <ParentObservationListSection
      records={records}
      currentMonthLabel="이번 달"
      emptyDescription={
        hasConnectedChild
          ? undefined
          : '아이 계정 회원가입 시 부모 정보를 입력하면 관찰 기록을 입력할 수 있어요.'
      }
      emptyMessage={hasConnectedChild ? undefined : '아직 연결된 아이가 없습니다.'}
      isLoading={isConnectionLoading || isLoading}
      isError={isError}
    />
  )
}

export default ParentObservationSection
