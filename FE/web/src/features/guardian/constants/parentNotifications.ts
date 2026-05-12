export type ParentNotificationActionTone = 'primary' | 'danger'

export type ParentNotificationAction = {
  key: string
  label: string
  tone: ParentNotificationActionTone
}

export type ParentNotificationItem = {
  id: string
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
