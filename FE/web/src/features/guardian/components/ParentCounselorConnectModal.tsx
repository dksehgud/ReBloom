import { useState, type ReactNode } from 'react'

import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'
import type { ParentCounselorCandidate } from '../constants/parentSettings'

type ParentCounselorConnectModalProps = {
  candidate: ParentCounselorCandidate
  onClose: () => void
  onComplete: () => void
}

type ModalStep = 1 | 2 | 3

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M6.5 12.5L10.1 16.1L17.5 8.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 7.75C4 6.78 4.78 6 5.75 6H18.25C19.22 6 20 6.78 20 7.75V16.25C20 17.22 19.22 18 18.25 18H5.75C4.78 18 4 17.22 4 16.25V7.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 8L12 13.25L19 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ClinicIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 19V8.5C7 7.67 7.67 7 8.5 7H15.5C16.33 7 17 7.67 17 8.5V19"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 11H14M10 14H14M12 7V5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 19H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function StepIndicator({ step }: { step: ModalStep }) {
  const nodes = [1, 2, 3] as const

  return (
    <div className="parent-counselor-modal__steps" aria-hidden="true">
      {nodes.map((node, index) => {
        const isActive = node === step
        const isCompleted = node < step

        return (
          <div key={node} className="parent-counselor-modal__step-wrap">
            <span
              className={`parent-counselor-modal__step${
                isActive ? ' is-active' : ''
              }${isCompleted ? ' is-complete' : ''}`}
            >
              {isCompleted ? <CheckIcon /> : node}
            </span>
            {index < nodes.length - 1 ? (
              <span className="parent-counselor-modal__connector" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function ReadonlyField({
  icon,
  value,
}: {
  icon: ReactNode
  value: string
}) {
  return (
    <div className="parent-counselor-modal__field is-readonly">
      <span className="parent-counselor-modal__field-icon">{icon}</span>
      <span className="parent-counselor-modal__field-value">{value}</span>
    </div>
  )
}

function ParentCounselorConnectModal({
  candidate,
  onClose,
  onComplete,
}: ParentCounselorConnectModalProps) {
  const [step, setStep] = useState<ModalStep>(1)
  const [email, setEmail] = useState('')

  const canSearch = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const actions =
    step === 1 ? (
      <button
        type="button"
        className={`parent-counselor-modal__button is-primary${
          canSearch ? '' : ' is-disabled'
        }`}
        disabled={!canSearch}
        onClick={() => setStep(2)}
      >
        조회
      </button>
    ) : step === 2 ? (
      <>
        <button
          type="button"
          className="parent-counselor-modal__button is-secondary"
          onClick={() => setStep(1)}
        >
          이전
        </button>
        <button
          type="button"
          className="parent-counselor-modal__button is-primary"
          onClick={() => setStep(3)}
        >
          다음
        </button>
      </>
    ) : (
      <button
        type="button"
        className="parent-counselor-modal__button is-primary"
        onClick={onComplete}
      >
        신청 완료
      </button>
    )

  return (
    <CommonModalLayout
      title="상담사 연결"
      onClose={onClose}
      showDivider
      overlayClassName="parent-counselor-modal-overlay"
      className="parent-counselor-modal"
      bodyClassName="parent-counselor-modal__body"
      actionsClassName={`parent-counselor-modal__actions${
        step === 2 ? '' : ' is-single'
      }`}
      headerContent={<StepIndicator step={step} />}
      actions={actions}
    >
      {step === 1 ? (
        <div className="parent-counselor-modal__section">
          <div className="parent-counselor-modal__intro">
            <h3 className="parent-counselor-modal__headline">상담사 조회</h3>
            <p className="parent-counselor-modal__description">
              상담사의 이메일을 입력하여 검색해 주세요.
            </p>
          </div>
          <label className="parent-counselor-modal__field">
            <span className="parent-counselor-modal__field-icon">
              <EmailIcon />
            </span>
            <input
              className="parent-counselor-modal__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@clinic.com"
            />
          </label>
        </div>
      ) : step === 2 ? (
        <div className="parent-counselor-modal__section">
          <div className="parent-counselor-modal__intro">
            <h3 className="parent-counselor-modal__headline">{candidate.name}</h3>
          </div>
          <ReadonlyField icon={<EmailIcon />} value={candidate.email} />
          <ReadonlyField icon={<ClinicIcon />} value={candidate.clinicName} />
        </div>
      ) : (
        <div className="parent-counselor-modal__section">
          <div className="parent-counselor-modal__intro">
            <h3 className="parent-counselor-modal__headline">연결 신청 완료</h3>
            <p className="parent-counselor-modal__description">
              상담사에게 연결을 신청했습니다.
            </p>
          </div>
        </div>
      )}
    </CommonModalLayout>
  )
}

export default ParentCounselorConnectModal
