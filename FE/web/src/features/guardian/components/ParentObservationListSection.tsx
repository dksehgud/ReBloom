import { FiMessageSquare } from 'react-icons/fi'

import type { ParentObservationRecord } from '../types/parentObservation'

type ParentObservationListSectionProps = {
  records: ParentObservationRecord[]
  selectedDateLabel?: string | null
  currentMonthLabel: string
  emptyDescription?: string
  emptyMessage?: string
  isLoading?: boolean
  isError?: boolean
  onAddRecord?: () => void
  onSelectRecord?: (recordId: string) => void
}

function ObservationIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-home-page__records-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.99414 5.82996V17.4899"
        stroke="currentColor"
        strokeWidth="1.6657"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.49862 14.9913C2.27774 14.9913 2.0659 14.9035 1.90971 14.7473C1.75352 14.5912 1.66577 14.3793 1.66577 14.1584V3.33139C1.66577 3.1105 1.75352 2.89866 1.90971 2.74247C2.0659 2.58628 2.27774 2.49854 2.49862 2.49854H6.66287C7.54641 2.49854 8.39377 2.84952 9.01853 3.47428C9.64329 4.09904 9.99427 4.94639 9.99427 5.82994C9.99427 4.94639 10.3453 4.09904 10.97 3.47428C11.5948 2.84952 12.4421 2.49854 13.3257 2.49854H17.4899C17.7108 2.49854 17.9226 2.58628 18.0788 2.74247C18.235 2.89866 18.3228 3.1105 18.3228 3.33139V14.1584C18.3228 14.3793 18.235 14.5912 18.0788 14.7473C17.9226 14.9035 17.7108 14.9913 17.4899 14.9913H12.4928C11.8302 14.9913 11.1946 15.2545 10.7261 15.7231C10.2575 16.1917 9.99427 16.8272 9.99427 17.4898C9.99427 16.8272 9.73103 16.1917 9.26246 15.7231C8.79389 15.2545 8.15838 14.9913 7.49572 14.9913H2.49862Z"
        stroke="currentColor"
        strokeWidth="1.6657"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-home-page__add-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.16675 10H15.8334"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 4.16663V15.8333"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PromptIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-home-page__prompt-icon"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.99298 14.9864H15.7358M8.24156 3.74505L2.6209 9.3657C2.49645 9.49016 2.42749 9.66104 2.42749 9.83909C2.42749 10.0171 2.49645 10.1881 2.6209 10.3125L7.6735 15.3651C7.79795 15.4895 7.96884 15.5585 8.14688 15.5585C8.32492 15.5585 8.49581 15.4895 8.62026 15.3651L14.2409 9.74441C14.3653 9.61996 14.4344 9.44907 14.4344 9.27103C14.4344 9.09298 14.3653 8.92209 14.2409 8.79764L9.18833 3.74505C9.06387 3.62059 8.89298 3.55164 8.71494 3.55164C8.5369 3.55164 8.36601 3.62059 8.24156 3.74505Z"
        stroke="currentColor"
        strokeWidth="1.49884"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CounselorCommentIndicator() {
  return (
    <span
      className="parent-home-page__record-comment-indicator"
      aria-label="상담사 코멘트 있음"
      title="상담사 코멘트 있음"
    >
      <FiMessageSquare aria-hidden="true" />
    </span>
  )
}

function ParentObservationListSection({
  records,
  selectedDateLabel = null,
  currentMonthLabel,
  emptyDescription,
  emptyMessage,
  isLoading = false,
  isError = false,
  onAddRecord,
  onSelectRecord,
}: ParentObservationListSectionProps) {
  const showEmptyBanner = !isLoading && !isError && records.length === 0
  const defaultEmptyMessage = selectedDateLabel
    ? `${selectedDateLabel}에는 아직 기록된 관찰 내용이 없어요.`
    : `${currentMonthLabel}에는 아직 기록된 관찰 내용이 없어요.`
  const defaultEmptyDescription = selectedDateLabel
    ? '오늘 아이의 모습을 기록해보세요.'
    : null
  const emptyDescriptionText = emptyDescription ?? defaultEmptyDescription

  return (
    <section className="parent-home-page__records-card" aria-label="아이 관찰 기록 영역">
      <div className="parent-home-page__records-header">
        <div className="parent-home-page__records-title-group">
          <ObservationIcon />
          <h2 className="parent-home-page__records-heading">아이 관찰 기록</h2>
        </div>
        <button
          type="button"
          className="parent-home-page__add-button"
          aria-label="관찰 기록 추가"
          disabled={!onAddRecord}
          onClick={onAddRecord}
        >
          <AddIcon />
        </button>
      </div>

      {showEmptyBanner ? (
        <div className="parent-home-page__empty-banner" role="status">
          <div className="parent-home-page__empty-banner-row">
            <PromptIcon />
            <div className="parent-home-page__empty-copy">
              <p className="parent-home-page__empty-copy-line">
                {emptyMessage ?? defaultEmptyMessage}
              </p>
              {emptyDescriptionText ? (
                <p className="parent-home-page__empty-copy-line">
                  {emptyDescriptionText}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isError ? (
        <p className="parent-home-page__records-status">관찰 기록을 불러오지 못했어요.</p>
      ) : null}

      {isLoading ? (
        <div className="parent-home-page__preview-list" aria-hidden="true">
          <div className="parent-home-page__record-item" />
          <div className="parent-home-page__record-item" />
          <div className="parent-home-page__record-item" />
        </div>
      ) : (
        <div className="parent-home-page__preview-list">
          {records.map((record) => {
            const content = (
              <>
                <div className="parent-home-page__record-date-block">
                  <p className="parent-home-page__record-date">{record.date}</p>
                  <p className="parent-home-page__record-weekday">{record.weekday}</p>
                </div>

                <div className="parent-home-page__record-content">
                  <div className="parent-home-page__record-meta-row">
                    <span className="parent-home-page__record-badge">{record.mood}</span>
                    {record.hasCounselorComment ? (
                      <CounselorCommentIndicator />
                    ) : null}
                  </div>
                  <p className="parent-home-page__record-description">{record.description}</p>
                </div>
              </>
            )

            if (onSelectRecord) {
              return (
                <button
                  key={record.id}
                  type="button"
                  className="parent-home-page__record-item parent-home-page__record-item--button"
                  onClick={() => onSelectRecord(record.id)}
                >
                  {content}
                </button>
              )
            }

            return (
              <article key={record.id} className="parent-home-page__record-item">
                {content}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ParentObservationListSection
