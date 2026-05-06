import type { ParentObservationRecord } from '../types/parentObservation'
import ParentObservationModalFrame from './ParentObservationModalFrame'

type ParentObservationDetailModalProps = {
  record: ParentObservationRecord
  dateLabel: string
  onClose?: () => void
  onEdit?: () => void
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-detail-modal__action-icon"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.66663 11.9999L4.99996 11.3333L11.6666 4.66659L9.33329 2.33325L2.66663 8.99992V11.9999Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.66663 3L11 5.33333"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ParentObservationDetailModal({
  record,
  dateLabel,
  onClose,
  onEdit,
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

      <div className="parent-observation-detail-modal__actions">
        <button
          type="button"
          className="parent-observation-detail-modal__action-button is-edit"
          onClick={onEdit}
        >
          <EditIcon />
          수정
        </button>
      </div>
    </ParentObservationModalFrame>
  )
}

export default ParentObservationDetailModal
