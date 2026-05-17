export type ParentNotificationActionTone = 'primary' | 'danger'

export type ParentNotificationAction = {
  key: 'confirm' | 'reject'
  label: string
  tone: ParentNotificationActionTone
}

export type ParentNotificationItem = {
  id: string
  childrenId?: string | null
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
