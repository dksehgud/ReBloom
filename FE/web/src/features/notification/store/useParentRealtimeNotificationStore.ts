import { create } from 'zustand'

import type { ParentNotificationDto } from '../types/parentNotification'

type ParentRealtimeNotificationState = {
  anomalyAlertPopup: ParentNotificationDto | null
  clearNotificationBadge: () => void
  dismissAnomalyAlertPopup: (notificationId?: number | string) => void
  latestNotification: ParentNotificationDto | null
  latestNotificationSequence: number
  notificationBadgeCount: number
  receiveNotification: (notification: ParentNotificationDto) => void
}

function isParentAnomalyAlertNotification(notification: ParentNotificationDto) {
  return notification.notificationType === 'RISK_ALERT'
}

const useParentRealtimeNotificationStore =
  create<ParentRealtimeNotificationState>((set) => ({
    anomalyAlertPopup: null,
    clearNotificationBadge: () =>
      set({
        notificationBadgeCount: 0,
      }),
    dismissAnomalyAlertPopup: (notificationId) =>
      set((state) => {
        if (
          notificationId !== undefined &&
          state.anomalyAlertPopup &&
          String(state.anomalyAlertPopup.id) !== String(notificationId)
        ) {
          return state
        }

        return {
          anomalyAlertPopup: null,
        }
      }),
    latestNotification: null,
    latestNotificationSequence: 0,
    notificationBadgeCount: 0,
    receiveNotification: (notification) =>
      set((state) => ({
        anomalyAlertPopup: isParentAnomalyAlertNotification(notification)
          ? notification
          : state.anomalyAlertPopup,
        latestNotification: notification,
        latestNotificationSequence: state.latestNotificationSequence + 1,
        notificationBadgeCount: state.notificationBadgeCount + 1,
      })),
  }))

export { isParentAnomalyAlertNotification, useParentRealtimeNotificationStore }
