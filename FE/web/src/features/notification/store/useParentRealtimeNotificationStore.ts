import { create } from 'zustand'

import type { ParentNotificationDto } from '../types/parentNotification'

type ParentRealtimeNotificationState = {
  anomalyAlertPopup: ParentNotificationDto | null
  dismissAnomalyAlertPopup: (notificationId?: number | string) => void
  latestNotification: ParentNotificationDto | null
  latestNotificationSequence: number
  receiveNotification: (notification: ParentNotificationDto) => void
}

function isParentAnomalyAlertNotification(notification: ParentNotificationDto) {
  return notification.notificationType === 'RISK_ALERT'
}

const useParentRealtimeNotificationStore =
  create<ParentRealtimeNotificationState>((set) => ({
    anomalyAlertPopup: null,
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
    receiveNotification: (notification) =>
      set((state) => ({
        anomalyAlertPopup: isParentAnomalyAlertNotification(notification)
          ? notification
          : state.anomalyAlertPopup,
        latestNotification: notification,
        latestNotificationSequence: state.latestNotificationSequence + 1,
      })),
  }))

export { isParentAnomalyAlertNotification, useParentRealtimeNotificationStore }
