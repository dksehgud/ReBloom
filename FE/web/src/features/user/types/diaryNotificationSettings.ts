const DIARY_NOTIFICATION_DAYS = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
] as const

const DIARY_NOTIFICATION_FREQUENCIES = [1, 2, 3, 5] as const

type DiaryNotificationDay = (typeof DIARY_NOTIFICATION_DAYS)[number]
type DiaryNotificationQuickPreset = 'EVERYDAY' | 'WEEKDAYS' | 'WEEKENDS' | null
type DiaryNotificationTime = '' | `${string}:${string}`

type DiaryNotificationSettings = {
  enabled: boolean
  daysOfWeek: DiaryNotificationDay[]
  frequencyPerDay: (typeof DIARY_NOTIFICATION_FREQUENCIES)[number]
  times: DiaryNotificationTime[]
  quickPreset: DiaryNotificationQuickPreset
}

export { DIARY_NOTIFICATION_DAYS, DIARY_NOTIFICATION_FREQUENCIES }
export type {
  DiaryNotificationDay,
  DiaryNotificationQuickPreset,
  DiaryNotificationSettings,
  DiaryNotificationTime,
}
