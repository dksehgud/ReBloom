import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'
import DiaryEmotionIcon from './DiaryEmotionIcon'
import {
  DIARY_EMOTION_OPTIONS,
  type DiaryEmotionKey,
  type DiaryEmotionOption,
} from '../constants/diaryEmotions'

type DiaryEmotionSelectModalProps = {
  selectedEmotionKey?: DiaryEmotionKey | null
  onClose?: () => void
  onSelect?: (emotionKey: DiaryEmotionKey) => void
}

function DiaryEmotionSelectModal({
  selectedEmotionKey = null,
  onClose,
  onSelect,
}: DiaryEmotionSelectModalProps) {
  return (
    <CommonModalLayout
      title="오늘 하루는 어땠나요?"
      className="diary-emotion-modal"
      overlayClassName="diary-emotion-modal-overlay"
      bodyClassName="diary-emotion-modal__body"
      onClose={onClose}
      titleAlign="center"
    >
      <p className="diary-emotion-modal__subtitle">
        오늘 느낀 감정을 하나 골라보세요
      </p>

      <div className="diary-emotion-modal__panel">
        <div className="diary-emotion-modal__grid">
          {DIARY_EMOTION_OPTIONS.map((option) => {
            const isSelected = option.key === selectedEmotionKey

            return (
              <button
                key={option.key}
                type="button"
                className={`diary-emotion-modal__option diary-emotion-modal__option--${option.key}${
                  isSelected ? ' is-selected' : ''
                }`}
                aria-label={option.label}
                onClick={() => onSelect?.(option.key)}
              >
                <DiaryEmotionIcon
                  emotionKey={option.key}
                  size={50}
                  className="diary-emotion-modal__option-image"
                />
              </button>
            )
          })}
        </div>
      </div>
    </CommonModalLayout>
  )
}

export { DIARY_EMOTION_OPTIONS }
export type { DiaryEmotionKey, DiaryEmotionOption, DiaryEmotionSelectModalProps }

export default DiaryEmotionSelectModal
