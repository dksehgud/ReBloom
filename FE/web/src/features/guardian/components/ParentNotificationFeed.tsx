import type { ParentNotificationItem } from '../constants/parentNotifications'

type ParentNotificationFeedProps = {
  items: ParentNotificationItem[]
  onCardClick: (notificationId: string) => void
  onActionClick: (notificationId: string, actionKey: string) => void
}

function NotificationCardIcon({ tone }: { tone: ParentNotificationItem['tone'] }) {
  return (
    <span
      className={`parent-notification-card__icon-wrap parent-notification-card__icon-wrap--${tone}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path
          d="M13.726 20.994C13.5502 21.297 13.298 21.5485 12.9944 21.7233C12.6908 21.8981 12.3467 21.9901 11.9964 21.9901C11.6461 21.9901 11.302 21.8981 10.9985 21.7233C10.695 21.5485 10.4427 21.297 10.267 20.994M17.9947 7.99771C17.9947 6.40687 17.3628 4.88119 16.2378 3.75629C15.1129 2.6314 13.5872 1.99944 11.9964 1.99944C10.4056 1.99944 8.87991 2.6314 7.75501 3.75629C6.63012 4.88119 5.99816 6.40687 5.99816 7.99771C5.99816 14.9958 2.99902 16.9952 2.99902 16.9952H20.9938C20.9938 16.9952 17.9947 14.9958 17.9947 7.99771Z"
          stroke="currentColor"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function ParentNotificationFeed({
  items,
  onCardClick,
  onActionClick,
}: ParentNotificationFeedProps) {
  return (
    <div className="parent-notifications-page__feed" aria-label="보호자 알림 리스트">
      {items.map((item) => (
        <article
          key={item.id}
          className={`parent-notification-card parent-notification-card--${item.tone} parent-notification-card--interactive${item.unread ? '' : ' is-read'}`}
          onClick={() => onCardClick(item.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onCardClick(item.id)
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="parent-notification-card__content">
            <NotificationCardIcon tone={item.tone} />

            <div className="parent-notification-card__copy">
              <div className="parent-notification-card__top">
                <div className="parent-notification-card__title-row">
                  <h2 className="parent-notification-card__title">{item.title}</h2>
                  {item.unread ? <span className="parent-notification-card__dot" aria-hidden="true" /> : null}
                </div>
                <span className="parent-notification-card__time">{item.timeLabel}</span>
              </div>

              <p className="parent-notification-card__message">{item.message}</p>

              {item.highlightLabel ? (
                <span className="parent-notification-card__highlight">{item.highlightLabel}</span>
              ) : null}

              {item.actions ? (
                <div className="parent-notification-card__actions">
                  {item.actions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      className={`parent-notification-card__action-button parent-notification-card__action-button--${action.tone}${item.selectedActionKey === action.key ? ' is-selected' : ''}${item.selectedActionKey && item.selectedActionKey !== action.key ? ' is-muted' : ''}`}
                      aria-pressed={item.selectedActionKey === action.key}
                      onClick={(event) => {
                        event.stopPropagation()
                        onActionClick(item.id, action.key)
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ParentNotificationFeed
