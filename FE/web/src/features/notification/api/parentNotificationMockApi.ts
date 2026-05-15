import { parentNotificationsMock } from '../mocks/parentNotifications'
import type {
  ParentNotificationDto,
  ParentNotificationListDataDto,
  ParentNotificationListRequest,
  ParentNotificationReadRequest,
} from '../types/parentNotification'

const mockNotificationCreatedAts = [
  '2026-05-14T08:00:00',
  '2026-05-13T20:00:00',
]

function createMockNotificationDto(
  notification: (typeof parentNotificationsMock)[number],
  index: number,
): ParentNotificationDto {
  return {
    createdAt:
      mockNotificationCreatedAts[index] ?? `2026-05-${String(12 - index).padStart(2, '0')}T09:00:00`,
    deliveryStatus: 'SENT',
    id: index + 1,
    isRead: !notification.unread,
    notificationType: notification.actions
      ? 'CONVERSATION_ALERT'
      : 'BIOMETRIC_ANOMALY',
    payload: {
      content: notification.message,
      depressionScoreText: notification.highlightLabel,
      title: notification.title,
    },
  }
}

let notificationDtos = parentNotificationsMock.map(createMockNotificationDto)

async function getParentNotifications({
  isRead,
  page = 0,
  size = 20,
}: ParentNotificationListRequest): Promise<ParentNotificationListDataDto> {
  const filteredNotifications =
    typeof isRead === 'boolean'
      ? notificationDtos.filter((notification) => notification.isRead === isRead)
      : notificationDtos
  const startIndex = page * size
  const contents = filteredNotifications.slice(startIndex, startIndex + size)

  return {
    contents,
    slice: {
      first: page === 0,
      hasNext: startIndex + size < filteredNotifications.length,
      last: startIndex + size >= filteredNotifications.length,
      number: page,
      numberOfElements: contents.length,
      size,
    },
    sort: {
      empty: false,
      sorted: true,
      unsorted: false,
    },
  }
}

async function markParentNotificationAsRead({
  notificationId,
}: ParentNotificationReadRequest): Promise<void> {
  const normalizedId = Number(notificationId)

  notificationDtos = notificationDtos.map((notification) =>
    notification.id === normalizedId
      ? {
          ...notification,
          isRead: true,
        }
      : notification,
  )
}

async function markAllParentNotificationsAsRead(): Promise<void> {
  notificationDtos = notificationDtos.map((notification) => ({
    ...notification,
    isRead: true,
  }))
}

const parentNotificationMockApi = {
  getParentNotifications,
  markAllParentNotificationsAsRead,
  markParentNotificationAsRead,
}

export {
  getParentNotifications,
  markAllParentNotificationsAsRead,
  markParentNotificationAsRead,
  parentNotificationMockApi,
}
