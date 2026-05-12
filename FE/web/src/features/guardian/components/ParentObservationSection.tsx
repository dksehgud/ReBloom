import { useParentObservationPreview } from '../hooks/useParentObservationPreview'
import ParentObservationListSection from './ParentObservationListSection'

type ParentObservationSectionProps = {
  childrenId?: string
}

function ParentObservationSection({ childrenId }: ParentObservationSectionProps) {
  const { records, isLoading, isError } = useParentObservationPreview(childrenId)

  return (
    <ParentObservationListSection
      records={records}
      currentMonthLabel="이번 달"
      isLoading={isLoading}
      isError={isError}
    />
  )
}

export default ParentObservationSection
