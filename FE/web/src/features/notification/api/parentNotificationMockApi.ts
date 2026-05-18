import { parentNotificationsMock } from '../mocks/parentNotifications'
import type {
  ParentNotificationAnomalyActionRequest,
  ParentNotificationDto,
  ParentNotificationListDataDto,
  ParentNotificationListRequest,
  ParentNotificationReadRequest,
} from '../types/parentNotification'

const mockNotificationCreatedAtOffsets = [
  2 * 60 * 1000,
  24 * 60 * 60 * 1000,
]

function getMockNotificationCreatedAt(index: number) {
  const offset =
    mockNotificationCreatedAtOffsets[index] ??
    (index + 2) * 24 * 60 * 60 * 1000

  return new Date(Date.now() - offset).toISOString()
}

function createMockNotificationDto(
  notification: (typeof parentNotificationsMock)[number],
  index: number,
): ParentNotificationDto {
  return {
    createdAt: getMockNotificationCreatedAt(index),
    deliveryStatus: 'SENT',
    id: index + 1,
    isRead: !notification.unread,
    notificationType: notification.notificationType ?? 'BIOMETRIC_ANOMALY',
    payload: {
      childrenId: notification.childrenId,
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

async function confirmParentAnomalyAlert({
  notificationId,
}: ParentNotificationAnomalyActionRequest): Promise<void> {
  await markParentNotificationAsRead({ notificationId })
}

async function rejectParentAnomalyAlert({
  notificationId,
}: ParentNotificationAnomalyActionRequest): Promise<void> {
  await markParentNotificationAsRead({ notificationId })
}

const parentNotificationMockApi = {
  confirmParentAnomalyAlert,
  getParentNotifications,
  markAllParentNotificationsAsRead,
  markParentNotificationAsRead,
  rejectParentAnomalyAlert,
}

export {
  confirmParentAnomalyAlert,
  getParentNotifications,
  markAllParentNotificationsAsRead,
  markParentNotificationAsRead,
  parentNotificationMockApi,
  rejectParentAnomalyAlert,
}
