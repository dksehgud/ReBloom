import {
  PARENT_OBSERVATION_MOODS,
  type ParentObservationMood,
} from '../constants/parentObservationMoods'
import ParentObservationModalFrame from './ParentObservationModalFrame'

type ParentObservationFormModalProps = {
  mode: 'create' | 'edit'
  dateLabel: string
  selectedMood: string | null
  content: string
  isSubmitDisabled?: boolean
  onClose?: () => void
  onPreviousDate?: () => void
  onNextDate?: () => void
  onSelectMood?: (mood: ParentObservationMood) => void
  onContentChange?: (value: string) => void
  onSubmit?: () => void
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-observation-form-modal__nav-icon"
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
      className="parent-observation-form-modal__nav-icon"
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

function ParentObservationFormModal({
  mode,
  dateLabel,
  selectedMood,
  content,
  isSubmitDisabled = false,
  onClose,
  onPreviousDate,
  onNextDate,
  onSelectMood,
  onContentChange,
  onSubmit,
}: ParentObservationFormModalProps) {
  const submitLabel = mode === 'create' ? '작성하기' : '수정하기'
  const shouldShowDateNavigation = mode === 'create'

  return (
    <ParentObservationModalFrame
      className="parent-observation-form-modal"
      onClose={onClose}
    >
      <div className="parent-observation-form-modal__header-row">
        {shouldShowDateNavigation ? (
          <div className="parent-observation-form-modal__date-nav">
            <button
              type="button"
              className="parent-observation-form-modal__nav-button"
              aria-label="이전 날짜"
              onClick={onPreviousDate}
            >
              <ChevronLeftIcon />
            </button>
            <p className="parent-observation-form-modal__date-label">
              {dateLabel}
            </p>
            <button
              type="button"
              className="parent-observation-form-modal__nav-button"
              aria-label="다음 날짜"
              onClick={onNextDate}
            >
              <ChevronRightIcon />
            </button>
          </div>
        ) : (
          <div className="parent-observation-form-modal__date-nav is-static">
            <p className="parent-observation-form-modal__date-label">
              {dateLabel}
            </p>
          </div>
        )}
      </div>

      <div className="parent-observation-form-modal__textarea-wrap">
        <textarea
          className="parent-observation-form-modal__textarea"
          placeholder="오늘 아이의 모습을 자세히 기록해보세요..."
          value={content}
          onChange={(event) => onContentChange?.(event.target.value)}
        />
      </div>

      <div className="parent-observation-form-modal__mood-grid">
        {PARENT_OBSERVATION_MOODS.map((mood) => {
          const isSelected = selectedMood === mood

          return (
            <button
              key={mood}
              type="button"
              className={`parent-observation-form-modal__mood-button${
                isSelected ? ' is-selected' : ''
              }`}
              onClick={() => onSelectMood?.(mood)}
            >
              {mood}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="parent-observation-form-modal__submit-button"
        disabled={isSubmitDisabled}
        onClick={onSubmit}
      >
        {submitLabel}
      </button>
    </ParentObservationModalFrame>
  )
}

export default ParentObservationFormModal
