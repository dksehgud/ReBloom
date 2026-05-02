import { useState } from 'react'

import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'

type ChildDiaryNotificationToggleModalProps = {
  enabled: boolean
  onClose: () => void
  onSave: (enabled: boolean) => void
}

type NotificationSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
}

function NotificationSwitch({ checked, onChange }: NotificationSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`child-diary-notification-switch ${
        checked ? 'is-checked' : ''
      }`}
      onClick={() => onChange(!checked)}
    >
      <span className="child-diary-notification-switch__thumb" />
    </button>
  )
}

function ChildDiaryNotificationToggleModal({
  enabled,
  onClose,
  onSave,
}: ChildDiaryNotificationToggleModalProps) {
  const [draftEnabled, setDraftEnabled] = useState(enabled)

  return (
    <CommonModalLayout
      className="child-diary-notification-toggle-modal"
      bodyClassName="child-diary-notification-toggle-modal__body"
      actionsClassName="child-diary-notification-toggle-modal__actions"
      title="일기 작성 알림"
      titleAlign="center"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="auth-button is-secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="auth-button is-primary"
            onClick={() => onSave(draftEnabled)}
          >
            저장
          </button>
        </>
      }
    >
      <div className="child-diary-notification-toggle-modal__row">
        <div className="child-diary-notification-toggle-modal__copy">
          <strong>알림 켜기</strong>
          <span>원하는 시간에 일기 작성 알림을 받을 수 있어요.</span>
        </div>
        <NotificationSwitch checked={draftEnabled} onChange={setDraftEnabled} />
      </div>
    </CommonModalLayout>
  )
}

export default ChildDiaryNotificationToggleModal
