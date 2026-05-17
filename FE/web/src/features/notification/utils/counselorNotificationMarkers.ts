import type { ChildListItem } from '../../counselor/types/dashboard'
import type { ParentNotificationDto } from '../types/parentNotification'

function getUnreadParentReportChildIds(
  notifications: ParentNotificationDto[],
): Set<string> {
  return new Set(
    getUnreadParentReportNotificationIdsByChildId(notifications).keys(),
  )
}

function getUnreadParentReportNotificationIdsByChildId(
  notifications: ParentNotificationDto[],
): Map<string, number[]> {
  return notifications.reduce<Map<string, number[]>>(
    (notificationIdsByChildId, notification) => {
      const childrenId = notification.payload?.childrenId

      if (
        notification.isRead ||
        notification.notificationType !== 'PARENT_REPORT_NEW' ||
        !childrenId
      ) {
        return notificationIdsByChildId
      }

      const notificationIds = notificationIdsByChildId.get(childrenId) ?? []

      notificationIdsByChildId.set(childrenId, [
        ...notificationIds,
        notification.id,
      ])
      return notificationIdsByChildId
    },
    new Map(),
  )
}

function withUnreadParentObservationMarkers(
  childItems: ChildListItem[],
  unreadParentReportChildIds: Set<string>,
): ChildListItem[] {
  return childItems.map((child) => ({
    ...child,
    hasUnreadParentObservation: unreadParentReportChildIds.has(child.id),
  }))
}

export {
  getUnreadParentReportChildIds,
  getUnreadParentReportNotificationIdsByChildId,
  withUnreadParentObservationMarkers,
}
