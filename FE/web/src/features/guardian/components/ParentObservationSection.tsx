import { useParentObservationPreview } from '../hooks/useParentObservationPreview'
import ParentObservationListSection from './ParentObservationListSection'

function ParentObservationSection() {
  const { records, isLoading, isError } = useParentObservationPreview()

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
