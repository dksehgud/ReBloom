export type ParentNotificationActionTone = 'primary' | 'danger'

const PARENT_ANOMALY_ACTION_WINDOW_MS = 5 * 60 * 1000
const PARENT_ANOMALY_ACTION_EXPIRED_LABEL = '시간초과'

export type ParentNotificationAction = {
  key: 'confirm' | 'reject'
  label: string
  tone: ParentNotificationActionTone
}

export type ParentNotificationItem = {
  id: string
  childrenId?: string | null
  childrenReportId?: string | null
  createdAt?: string | null
  notificationType?: string
  tone: 'pink' | 'orange'
  icon: 'alert' | 'response'
  title: string
  timeLabel: string
  message: string
  unread: boolean
  highlightLabel?: string
  actions?: ParentNotificationAction[]
  selectedActionKey?: string
}

function isParentNotificationActionExpired(
  notification: ParentNotificationItem | undefined,
  now = Date.now(),
) {
  if (
    !notification?.actions?.length ||
    notification.selectedActionKey ||
    !notification.createdAt
  ) {
    return false
  }

  const createdAtTime = new Date(notification.createdAt).getTime()

  if (Number.isNaN(createdAtTime)) {
    return false
  }

  return now - createdAtTime >= PARENT_ANOMALY_ACTION_WINDOW_MS
}

export {
  PARENT_ANOMALY_ACTION_EXPIRED_LABEL,
  PARENT_ANOMALY_ACTION_WINDOW_MS,
  isParentNotificationActionExpired,
}
