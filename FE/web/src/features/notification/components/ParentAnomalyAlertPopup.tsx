import { BiError, BiX } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'

import { mapNotificationDtoToItem } from '../hooks/useParentNotificationState'
import { useParentRealtimeNotificationStore } from '../store/useParentRealtimeNotificationStore'

function ParentAnomalyAlertPopup() {
  const navigate = useNavigate()
  const anomalyAlertPopup = useParentRealtimeNotificationStore(
    (state) => state.anomalyAlertPopup,
  )
  const dismissAnomalyAlertPopup = useParentRealtimeNotificationStore(
    (state) => state.dismissAnomalyAlertPopup,
  )

  if (!anomalyAlertPopup) {
    return null
  }

  const notificationItem = mapNotificationDtoToItem(anomalyAlertPopup)

  const handleClose = () => {
    dismissAnomalyAlertPopup(anomalyAlertPopup.id)
  }

  const handleOpenNotifications = () => {
    dismissAnomalyAlertPopup(anomalyAlertPopup.id)
    navigate('/parent/notifications')
  }

  return (
    <div className="parent-anomaly-popup-overlay" role="presentation">
      <section
        className="parent-anomaly-popup"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="parent-anomaly-popup-title"
        aria-describedby="parent-anomaly-popup-message"
      >
        <button
          type="button"
          className="parent-anomaly-popup__close-button"
          aria-label="팝업 닫기"
          onClick={handleClose}
        >
          <BiX aria-hidden="true" />
        </button>

        <div className="parent-anomaly-popup__icon" aria-hidden="true">
          <BiError />
        </div>

        <div className="parent-anomaly-popup__copy">
          <p className="parent-anomaly-popup__eyebrow">이상치 알림</p>
          <h2
            className="parent-anomaly-popup__title"
            id="parent-anomaly-popup-title"
          >
            {notificationItem.title}
          </h2>
          <p
            className="parent-anomaly-popup__message"
            id="parent-anomaly-popup-message"
          >
            {notificationItem.message}
          </p>
          {notificationItem.highlightLabel ? (
            <span className="parent-anomaly-popup__highlight">
              {notificationItem.highlightLabel}
            </span>
          ) : null}
        </div>

        <div className="parent-anomaly-popup__actions">
          <button
            type="button"
            className="parent-anomaly-popup__button is-secondary"
            onClick={handleClose}
          >
            닫기
          </button>
          <button
            type="button"
            className="parent-anomaly-popup__button is-primary"
            onClick={handleOpenNotifications}
          >
            알림탭에서 확인
          </button>
        </div>
      </section>
    </div>
  )
}

export default ParentAnomalyAlertPopup
