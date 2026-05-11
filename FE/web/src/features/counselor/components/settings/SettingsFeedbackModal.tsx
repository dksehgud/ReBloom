import type { SettingsFeedback } from '../../types/settings'

type SettingsFeedbackModalProps = {
  feedback: Exclude<SettingsFeedback, null>
  onClose: () => void
}

function SettingsFeedbackModal({ feedback, onClose }: SettingsFeedbackModalProps) {
  return (
    <div className="counselor-settings-feedback-overlay" role="presentation">
      <section
        aria-labelledby="counselor-settings-feedback-title"
        aria-modal="true"
        className={`counselor-settings-feedback is-${feedback.tone}`}
        role="dialog"
      >
        <h2 id="counselor-settings-feedback-title">{feedback.title}</h2>
        <p>{feedback.message}</p>
        <button type="button" onClick={onClose}>
          확인
        </button>
      </section>
    </div>
  )
}

export default SettingsFeedbackModal
