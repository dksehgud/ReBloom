import { BiError, BiMessageDetail } from 'react-icons/bi'

import type { ParentNotificationItem } from '../constants/parentNotifications'

type ParentNotificationFeedProps = {
  items: ParentNotificationItem[]
  onCardClick: (notificationId: string) => void
  onActionClick: (notificationId: string, actionKey: string) => void
}

function NotificationCardIcon({
  tone,
  icon,
}: {
  tone: ParentNotificationItem['tone']
  icon: ParentNotificationItem['icon']
}) {
  const IconComponent = icon === 'alert' ? BiError : BiMessageDetail

  return (
    <span
      className={`parent-notification-card__icon-wrap parent-notification-card__icon-wrap--${tone}`}
    >
      <IconComponent aria-hidden="true" />
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
            <NotificationCardIcon tone={item.tone} icon={item.icon} />

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
                  {item.actions
                    .filter(
                      (action) =>
                        !item.selectedActionKey ||
                        item.selectedActionKey === action.key,
                    )
                    .map((action) => {
                      const isActionSelected = item.selectedActionKey === action.key
                      const isActionLocked = Boolean(item.selectedActionKey)

                      return (
                        <button
                          key={action.key}
                          type="button"
                          className={`parent-notification-card__action-button parent-notification-card__action-button--${action.tone}${isActionSelected ? ' is-selected' : ''}${isActionLocked && !isActionSelected ? ' is-muted' : ''}`}
                          aria-pressed={isActionSelected}
                          disabled={isActionLocked}
                          onClick={(event) => {
                            event.stopPropagation()

                            if (!isActionLocked) {
                              onActionClick(item.id, action.key)
                            }
                          }}
                        >
                          {action.label}
                        </button>
                      )
                    })}
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
