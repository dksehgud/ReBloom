import { FiArrowLeft, FiBell, FiRefreshCw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

import useCounselorNotificationState from '../hooks/useCounselorNotificationState'
import type { CounselorNotificationItem } from '../hooks/useCounselorNotificationState'

function CounselorNotificationIcon({ tone }: { tone: CounselorNotificationItem['tone'] }) {
  return (
    <span
      aria-hidden="true"
      className={`counselor-notification-card__icon counselor-notification-card__icon--${tone}`}
    >
      <FiBell />
    </span>
  )
}

function CounselorNotificationsScreen() {
  const navigate = useNavigate()
  const { error, isLoading, markAsRead, notifications, reload } =
    useCounselorNotificationState()

  return (
    <main className="counselor-notifications-page">
      <section className="counselor-notifications-page__main">
        <div className="counselor-notifications-page__content">
          <header className="counselor-notifications-page__header">
            <button
              type="button"
              className="counselor-notifications-page__back"
              aria-label="상담사 대시보드로 돌아가기"
              onClick={() => navigate('/counselor/dashboard')}
            >
              <FiArrowLeft aria-hidden="true" />
            </button>
            <div className="counselor-notifications-page__heading">
              <span>알림</span>
              <h1>상담사 알림</h1>
              <p>부모 보고서, 위험 감지, 아이 기록 관련 소식을 확인하세요.</p>
            </div>
            <button
              type="button"
              className="counselor-notifications-page__refresh"
              aria-label="상담사 알림 새로고침"
              onClick={() => void reload()}
            >
              <FiRefreshCw aria-hidden="true" />
            </button>
          </header>

          <section
            className="counselor-notifications-page__list"
            aria-label="상담사 알림 목록"
          >
            {isLoading ? (
              <p className="counselor-notifications-page__state">
                알림을 불러오는 중입니다.
              </p>
            ) : null}

            {!isLoading && error ? (
              <p className="counselor-notifications-page__state is-error">{error}</p>
            ) : null}

            {!isLoading && !error && notifications.length === 0 ? (
              <p className="counselor-notifications-page__state">
                확인할 알림이 없습니다.
              </p>
            ) : null}

            {!isLoading && !error
              ? notifications.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`counselor-notification-card${
                      item.unread ? '' : ' is-read'
                    }`}
                    onClick={() => markAsRead(item.id)}
                  >
                    <CounselorNotificationIcon tone={item.tone} />
                    <span className="counselor-notification-card__copy">
                      <span className="counselor-notification-card__top">
                        <span className="counselor-notification-card__title-row">
                          <strong>{item.title}</strong>
                          {item.unread ? (
                            <span
                              className="counselor-notification-card__dot"
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                        <span className="counselor-notification-card__time">
                          {item.timeLabel}
                        </span>
                      </span>
                      <span className="counselor-notification-card__message">
                        {item.message}
                      </span>
                      <span className="counselor-notification-card__meta">
                        <span>{item.typeLabel}</span>
                        {item.childName ? <span>{item.childName}</span> : null}
                      </span>
                    </span>
                  </button>
                ))
              : null}
          </section>
        </div>
      </section>
    </main>
  )
}

export default CounselorNotificationsScreen
