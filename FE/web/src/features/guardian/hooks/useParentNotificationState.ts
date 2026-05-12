import { useCallback, useEffect, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import {
  getParentNotifications,
  markParentNotificationAsRead,
} from '../api/parentNotificationApi'
import {
  parentNotifications,
  type ParentNotificationItem,
} from '../constants/parentNotifications'
import type { ParentNotificationDto } from '../types/parentNotification'

function useParentNotificationState(initialItems: ParentNotificationItem[] = parentNotifications) {
  const [notifications, setNotifications] = useState<ParentNotificationItem[]>(() => initialItems)
  const accessToken = useAppSessionStore((state) => state.accessToken)

  const loadNotifications = useCallback(async () => {
    if (!accessToken) {
      setNotifications(initialItems)
      return
    }

    try {
      const response = await getParentNotifications({ accessToken })
      setNotifications((response.contents ?? []).map(mapNotificationDtoToItem))
    } catch (error) {
      console.error(error)
      setNotifications(initialItems)
    }
  }, [accessToken, initialItems])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((currentItems) =>
      currentItems.map((item) =>
        item.id === notificationId && item.unread ? { ...item, unread: false } : item
      ),
    )

    const apiNotificationId = Number(notificationId)

    if (!accessToken || Number.isNaN(apiNotificationId)) {
      return
    }

    void markParentNotificationAsRead({
      accessToken,
      notificationId: apiNotificationId,
    }).catch((error: unknown) => {
      console.error(error)
    })
  }, [accessToken])

  const chooseAction = useCallback((notificationId: string, actionKey: string) => {
    setNotifications((currentItems) =>
      currentItems.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              unread: false,
              selectedActionKey: actionKey,
            }
          : item
      ),
    )

    markAsRead(notificationId)
  }, [markAsRead])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadNotifications])

  return {
    notifications,
    markAsRead,
    chooseAction,
  }
}

function mapNotificationDtoToItem(notification: ParentNotificationDto): ParentNotificationItem {
  const typeMeta = getNotificationTypeMeta(notification.notificationType)
  const payload = notification.payload
  const title = payload?.title?.trim() || typeMeta.title
  const message = payload?.content?.trim() || `${title} 알림을 확인해 주세요.`

  return {
    actions: typeMeta.withActions
      ? [
          { key: 'decline', label: '불가', tone: 'danger' },
          { key: 'confirm', label: '확인', tone: 'primary' },
        ]
      : undefined,
    highlightLabel: getHighlightLabel(notification),
    icon: typeMeta.icon,
    id: String(notification.id),
    message,
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
    case 'RISK_ALERT':
      return {
        icon: 'alert',
        title: '주의 필요',
        tone: 'pink',
        withActions: false,
      }
    case 'CONVERSATION_ALERT':
      return {
        icon: 'response',
        title: '응답 요청',
        tone: 'orange',
        withActions: true,
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
