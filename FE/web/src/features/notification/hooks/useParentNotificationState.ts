import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { useParentMockMode } from '../../guardian/hooks/useParentMockMode'
import { subscribeParentNotifications } from '../api/parentNotificationSse'
import type { ParentNotificationItem } from '../constants/parentNotifications'
import { getParentNotificationApi } from '../services/parentNotificationService'
import type { ParentNotificationDto } from '../types/parentNotification'

function useParentNotificationState(initialItems: ParentNotificationItem[] = []) {
  const [notifications, setNotifications] = useState<ParentNotificationItem[]>(
    () => initialItems,
  )
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useParentMockMode()
  const parentNotificationApi = useMemo(
    () => getParentNotificationApi(isMockMode),
    [isMockMode],
  )

  const loadNotifications = useCallback(async () => {
    try {
      const response = await parentNotificationApi.getParentNotifications({
        accessToken,
      })
      setNotifications((response.contents ?? []).map(mapNotificationDtoToItem))
    } catch (error) {
      console.error(error)
      setNotifications([])
    }
  }, [accessToken, parentNotificationApi])

  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((currentItems) =>
        currentItems.map((item) =>
          item.id === notificationId && item.unread
            ? { ...item, unread: false }
            : item,
        ),
      )

      const apiNotificationId = Number(notificationId)

      if (Number.isNaN(apiNotificationId)) {
        return
      }

      void parentNotificationApi
        .markParentNotificationAsRead({
          accessToken,
          notificationId: apiNotificationId,
        })
        .catch((error: unknown) => {
          console.error(error)
        })
    },
    [accessToken, parentNotificationApi],
  )

  const markAllAsRead = useCallback(() => {
    setNotifications((currentItems) =>
      currentItems.map((item) =>
        item.unread
          ? {
              ...item,
              unread: false,
            }
          : item,
      ),
    )

    void parentNotificationApi
      .markAllParentNotificationsAsRead(accessToken)
      .catch((error: unknown) => {
        console.error(error)
      })
  }, [accessToken, parentNotificationApi])

  const chooseAction = useCallback(
    (notificationId: string, actionKey: string) => {
      const targetNotification = notifications.find(
        (item) => item.id === notificationId,
      )

      setNotifications((currentItems) =>
        currentItems.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                unread: false,
                selectedActionKey: actionKey,
              }
            : item,
        ),
      )

      const apiNotificationId = Number(notificationId)

      if (
        targetNotification?.notificationType !== 'RISK_ALERT' ||
        !targetNotification.childrenId ||
        Number.isNaN(apiNotificationId)
      ) {
        markAsRead(notificationId)
        return
      }

      const actionRequest = {
        accessToken,
        childrenId: targetNotification.childrenId,
        notificationId: apiNotificationId,
      }
      const actionPromise =
        actionKey === 'confirm'
          ? parentNotificationApi.confirmParentAnomalyAlert(actionRequest)
          : actionKey === 'reject'
            ? parentNotificationApi.rejectParentAnomalyAlert(actionRequest)
            : null

      if (!actionPromise) {
        markAsRead(notificationId)
        return
      }

      void actionPromise
        .then(() => {
          markAsRead(notificationId)
        })
        .catch((error: unknown) => {
          console.error(error)
        })
    },
    [accessToken, markAsRead, notifications, parentNotificationApi],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadNotifications])

  useEffect(() => {
    if (isMockMode || !accessToken) {
      return undefined
    }

    return subscribeParentNotifications({
      accessToken,
      onError: (error) => {
        console.error(error)
      },
      onNotification: (notification) => {
        const notificationItem = mapNotificationDtoToItem(notification)

        setNotifications((currentItems) => [
          notificationItem,
          ...currentItems.filter((item) => item.id !== notificationItem.id),
        ])
      },
    })
  }, [accessToken, isMockMode])

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    chooseAction,
  }
}

function mapNotificationDtoToItem(
  notification: ParentNotificationDto,
): ParentNotificationItem {
  const typeMeta = getNotificationTypeMeta(notification.notificationType)
  const payload = notification.payload
  const title = payload?.title?.trim() || typeMeta.title
  const message = payload?.content?.trim() || `${title} 알림을 확인해 주세요.`

  return {
    actions: typeMeta.withActions
      ? [
          { key: 'reject', label: '불가', tone: 'danger' },
          { key: 'confirm', label: '확인', tone: 'primary' },
        ]
      : undefined,
    childrenId: payload?.childrenId,
    highlightLabel: getHighlightLabel(notification),
    icon: typeMeta.icon,
    id: String(notification.id),
    message,
    notificationType: notification.notificationType,
    timeLabel: formatRelativeTimeLabel(notification.createdAt),
    title,
    tone: typeMeta.tone,
    unread: !notification.isRead,
  }
}

function getNotificationTypeMeta(notificationType: string): Pick<
  ParentNotificationItem,
  'icon' | 'title' | 'tone'
> & {
  withActions: boolean
} {
  switch (notificationType) {
    case 'PARENT_REPORT_REPLY':
      return {
        icon: 'response',
        title: '응답 도착',
        tone: 'orange',
        withActions: false,
      }
    case 'BIOMETRIC_ANOMALY':
      return {
        icon: 'alert',
        title: '주의 필요',
        tone: 'pink',
        withActions: false,
      }
    case 'RISK_ALERT':
      return {
        icon: 'alert',
        title: '주의 필요',
        tone: 'pink',
        withActions: true,
      }
    case 'CONVERSATION_ALERT':
      return {
        icon: 'response',
        title: '응답 요청',
        tone: 'orange',
        withActions: false,
      }
    default:
      return {
        icon: 'alert',
        title: '주의 필요',
        tone: 'pink',
        withActions: false,
      }
  }
}

function getHighlightLabel(notification: ParentNotificationDto) {
  const payload = notification.payload

  if (payload?.depressionScoreText) {
    return payload.depressionScoreText
  }

  if (typeof payload?.depressionScore === 'number') {
    return `우울점수 : ${payload.depressionScore}점`
  }

  return undefined
}

function formatRelativeTimeLabel(createdAt?: string | null) {
  if (!createdAt) {
    return '방금 전'
  }

  const createdAtTime = new Date(createdAt).getTime()

  if (Number.isNaN(createdAtTime)) {
    return '방금 전'
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAtTime) / 1000 / 60),
  )

  if (diffMinutes < 1) {
    return '방금 전'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}시간 전`
  }

  const diffDays = Math.floor(diffHours / 24)

  return `${diffDays}일 전`
}

export default useParentNotificationState
export { mapNotificationDtoToItem }
