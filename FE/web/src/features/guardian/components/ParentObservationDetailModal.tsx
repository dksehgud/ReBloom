import type { ParentObservationRecord } from '../types/parentObservation'
import ParentObservationModalFrame from './ParentObservationModalFrame'

type ParentObservationDetailModalProps = {
  record: ParentObservationRecord
  dateLabel: string
  currentPosition?: number
  totalCount?: number
  onClose?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-detail-modal__nav-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 5L7.5 10L12.5 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-detail-modal__nav-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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

function DeleteIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-detail-modal__action-icon"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.33337 4.00008H12.6667"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.33337 4.00008V2.66675H10.6667V4.00008"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.66663 4.00008L5.33329 12.6667H10.6666L11.3333 4.00008"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-detail-modal__comment-icon"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 10.5C10.1333 9.75 10.4667 9.225 11 8.625C11.6667 7.95 12 6.975 12 6C12 4.80653 11.5786 3.66193 10.8284 2.81802C10.0783 1.97411 9.06087 1.5 8 1.5C6.93913 1.5 5.92172 1.97411 5.17157 2.81802C4.42143 3.66193 4 4.80653 4 6C4 6.75 4.13333 7.65 5 8.625C5.46667 9.15 5.86667 9.75 6 10.5"
        stroke="currentColor"
        strokeWidth="1.16609"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 13.5H10"
        stroke="currentColor"
        strokeWidth="1.16609"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66675 16.5H9.33341"
        stroke="currentColor"
        strokeWidth="1.16609"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ParentObservationDetailModal({
  record,
  dateLabel,
  currentPosition = 1,
  totalCount = 1,
  onClose,
  onEdit,
  onDelete,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: ParentObservationDetailModalProps) {
  const shouldShowRecordNavigation = totalCount > 1
  const shouldShowActions = Boolean(onEdit || onDelete)

  return (
    <ParentObservationModalFrame
      className="parent-observation-detail-modal"
      onClose={onClose}
    >
      <div className="parent-observation-detail-modal__header-row">
        <p className="parent-observation-detail-modal__date-label">
          {dateLabel}
        </p>
      </div>

      <div className="parent-observation-detail-modal__content-card">
        <p className="parent-observation-detail-modal__content-text">
          {record.description}
        </p>
      </div>

      <span className="parent-observation-detail-modal__mood-chip">
        {record.mood}
      </span>

      {shouldShowRecordNavigation ? (
        <div className="parent-observation-detail-modal__pager">
          <button
            type="button"
            className="parent-observation-detail-modal__pager-button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="이전 기록 보기"
          >
            <ChevronLeftIcon />
          </button>
          <p className="parent-observation-detail-modal__record-count">
            {currentPosition} / {totalCount}
          </p>
          <button
            type="button"
            className="parent-observation-detail-modal__pager-button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="다음 기록 보기"
          >
            <ChevronRightIcon />
          </button>
        </div>
      ) : null}

      {record.counselorComment ? (
        <section
          className="parent-observation-detail-modal__comment-card"
          aria-label="상담사의 코멘트"
        >
          <div className="parent-observation-detail-modal__comment-header">
            <div className="parent-observation-detail-modal__comment-title-wrap">
              <CommentIcon />
              <strong className="parent-observation-detail-modal__comment-title">
                상담사의 코멘트
              </strong>
            </div>
            <span className="parent-observation-detail-modal__comment-time">
              {record.counselorComment.relativeTimeLabel}
            </span>
          </div>
          <div className="parent-observation-detail-modal__comment-body">
            <span
              className="parent-observation-detail-modal__comment-dot"
              aria-hidden="true"
            />
            <p className="parent-observation-detail-modal__comment-copy">
              {record.counselorComment.content}
            </p>
          </div>
        </section>
      ) : null}

      {shouldShowActions ? (
        <div className="parent-observation-detail-modal__actions">
          {onEdit ? (
            <button
              type="button"
              className="parent-observation-detail-modal__action-button is-edit"
              onClick={onEdit}
            >
              <EditIcon />
              수정
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="parent-observation-detail-modal__action-button is-delete"
              onClick={onDelete}
            >
              <DeleteIcon />
              삭제
            </button>
          ) : null}
        </div>
      ) : null}
    </ParentObservationModalFrame>
  )
}

export default ParentObservationDetailModal
