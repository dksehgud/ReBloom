import type { ChildListItem } from '../../counselor/types/dashboard'
import type { ParentNotificationDto } from '../types/parentNotification'

function getUnreadParentReportChildIds(
  notifications: ParentNotificationDto[],
): Set<string> {
  return new Set(
    notifications
      .filter(
        (notification) =>
          !notification.isRead &&
          notification.notificationType === 'PARENT_REPORT_NEW' &&
          notification.payload?.childrenId,
      )
      .map((notification) => notification.payload?.childrenId)
      .filter((childrenId): childrenId is string => Boolean(childrenId)),
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
  withUnreadParentObservationMarkers,
}
