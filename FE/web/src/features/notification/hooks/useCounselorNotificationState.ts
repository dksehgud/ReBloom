import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { useCounselorMockMode } from '../../counselor/hooks/useCounselorMockMode'
import { getCounselorNotificationApi } from '../services/counselorNotificationService'
import type { ParentNotificationDto } from '../types/parentNotification'

type CounselorNotificationItemTone = 'blue' | 'orange' | 'pink'

type CounselorNotificationItem = {
  id: string
  childName?: string | null
  message: string
  notificationType: string
  timeLabel: string
  title: string
  tone: CounselorNotificationItemTone
  typeLabel: string
  unread: boolean
}

function useCounselorNotificationState() {
  const [notifications, setNotifications] = useState<CounselorNotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useCounselorMockMode()
  const counselorNotificationApi = useMemo(
    () => getCounselorNotificationApi(isMockMode),
    [isMockMode],
  )

  const loadNotifications = useCallback(async () => {
    if (!isMockMode && !accessToken) {
      setError('로그인이 필요합니다.')
      setNotifications([])
      return
    }

    try {
      setIsLoading(true)
      const response = await counselorNotificationApi.getCounselorNotifications({
        accessToken,
      })

      setNotifications((response.contents ?? []).map(mapCounselorNotificationDtoToItem))
      setError(undefined)
    } catch (loadError) {
      console.error(loadError)
      setError(
        loadError instanceof Error
          ? loadError.message
          : '상담사 알림 목록을 불러오지 못했습니다.',
      )
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, counselorNotificationApi, isMockMode])

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

      void counselorNotificationApi
        .markCounselorNotificationAsRead({
          accessToken,
          notificationId: apiNotificationId,
        })
        .catch((readError: unknown) => {
          console.error(readError)
        })
    },
    [accessToken, counselorNotificationApi],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadNotifications])

  return {
    error,
    isLoading,
    markAsRead,
    notifications,
    reload: loadNotifications,
  }
}

function mapCounselorNotificationDtoToItem(
  notification: ParentNotificationDto,
): CounselorNotificationItem {
  const typeMeta = getCounselorNotificationTypeMeta(notification.notificationType)
  const payload = notification.payload
  const title = payload?.title?.trim() || typeMeta.title
  const message = payload?.content?.trim() || `${title} 알림을 확인해주세요.`

  return {
    childName: payload?.childrenName,
    id: String(notification.id),
    message,
    notificationType: notification.notificationType,
    timeLabel: formatRelativeTimeLabel(notification.createdAt),
    title,
    tone: typeMeta.tone,
    typeLabel: typeMeta.typeLabel,
    unread: !notification.isRead,
  }
}

function getCounselorNotificationTypeMeta(notificationType: string): {
  title: string
  tone: CounselorNotificationItemTone
  typeLabel: string
} {
  switch (notificationType) {
    case 'PARENT_REPORT_NEW':
      return {
        title: '새 부모 보고서',
        tone: 'orange',
        typeLabel: '부모 보고서',
      }
    case 'PARENT_REPORT_REPLY':
      return {
        title: '부모 보고서 답변',
        tone: 'orange',
        typeLabel: '보고서 답변',
      }
    case 'RISK_ALERT':
      return {
        title: '위험 감지 알림',
        tone: 'pink',
        typeLabel: '위험 감지',
      }
    case 'CONVERSATION_ALERT':
      return {
        title: '대화 알림',
        tone: 'blue',
        typeLabel: 'IoT 대화',
      }
    case 'DIARY_REMINDER':
      return {
        title: '일기 리마인더',
        tone: 'blue',
        typeLabel: '일기',
      }
    default:
      return {
        title: '상담사 알림',
        tone: 'blue',
        typeLabel: '알림',
      }
  }
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

  if (diffDays < 7) {
    return `${diffDays}일 전`
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(createdAtTime))
}

export { mapCounselorNotificationDtoToItem }
export type { CounselorNotificationItem }
export default useCounselorNotificationState
