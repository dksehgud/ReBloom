import type { ParentObservationRecord } from '../types/parentObservation'
import ParentObservationModalFrame from './ParentObservationModalFrame'

type ParentObservationDetailModalProps = {
  record: ParentObservationRecord
  dateLabel: string
  onClose?: () => void
}

function ParentObservationDetailModal({
  record,
  dateLabel,
  onClose,
}: ParentObservationDetailModalProps) {
  return (
    <ParentObservationModalFrame
      className="parent-observation-detail-modal"
      onClose={onClose}
    >
      <div className="parent-observation-detail-modal__header-row">
        <p className="parent-observation-detail-modal__date-label">{dateLabel}</p>
      </div>

      <div className="parent-observation-detail-modal__content-card">
        <p className="parent-observation-detail-modal__content-text">
          {record.description}
        </p>
      </div>

      <span className="parent-observation-detail-modal__mood-chip">
        {record.mood}
      </span>
    </ParentObservationModalFrame>
  )
}

export default ParentObservationDetailModal
