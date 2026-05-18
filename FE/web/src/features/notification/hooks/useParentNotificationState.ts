import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { useParentMockMode } from '../../guardian/hooks/useParentMockMode'
import type {
  ParentNotificationAction,
  ParentNotificationItem,
} from '../constants/parentNotifications'
import { isParentNotificationActionExpired } from '../constants/parentNotifications'
import { getParentNotificationApi } from '../services/parentNotificationService'
import { useParentRealtimeNotificationStore } from '../store/useParentRealtimeNotificationStore'
import type {
  ParentNotificationDto,
  ParentNotificationPayloadDto,
} from '../types/parentNotification'

type SelectedParentNotificationActions = Record<
  string,
  ParentNotificationAction['key']
>

type UseParentNotificationStateOptions = {
  requestMarkAllAsReadOnInitialLoad?: boolean
}

const SELECTED_PARENT_NOTIFICATION_ACTIONS_STORAGE_KEY =
  'rebloom-parent-notification-actions'

function useParentNotificationState(
  initialItems: ParentNotificationItem[] = [],
  options: UseParentNotificationStateOptions = {},
) {
  const [notifications, setNotifications] = useState<ParentNotificationItem[]>(
    () => initialItems,
  )
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const markAllAsReadOnInitialLoadRef = useRef(
    options.requestMarkAllAsReadOnInitialLoad ?? false,
  )
  const selectedActionNotificationIdsRef = useRef<Set<string>>(new Set())
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
      const selectedActions = readSelectedParentNotificationActions()
      const nextNotifications = (response.contents ?? []).map((notification) =>
        mapNotificationDtoToItem(
          notification,
          selectedActions[String(notification.id)],
        ),
      )
      const shouldMarkAllAsRead = markAllAsReadOnInitialLoadRef.current

      markAllAsReadOnInitialLoadRef.current = false
      setNotifications(nextNotifications)

      if (shouldMarkAllAsRead) {
        void parentNotificationApi
          .markAllParentNotificationsAsRead(accessToken)
          .catch((error: unknown) => {
            console.error(error)
          })
      }
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
      markParentNotificationItemsAsRead(currentItems),
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

      if (
        selectedActionNotificationIdsRef.current.has(notificationId) ||
        !canChooseParentNotificationAction(
          targetNotification,
          actionKey,
          Date.now(),
        )
      ) {
        return
      }

      selectedActionNotificationIdsRef.current.add(notificationId)
      writeSelectedParentNotificationAction(notificationId, actionKey)

      setNotifications((currentItems) =>
        currentItems.map((item) =>
          item.id === notificationId && !item.selectedActionKey
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

  const hasPendingAnomalyAction = notifications.some(
    (notification) =>
      Boolean(notification.actions?.length) &&
      !notification.selectedActionKey &&
      !isParentNotificationActionExpired(notification, currentTime),
  )

  useEffect(() => {
    if (!hasPendingAnomalyAction) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [hasPendingAnomalyAction])

  useEffect(() => {
    return useParentRealtimeNotificationStore.subscribe((state, previousState) => {
      if (
        state.latestNotificationSequence ===
          previousState.latestNotificationSequence ||
        !state.latestNotification
      ) {
        return
      }

      const storedActionKey = readSelectedParentNotificationAction(
        String(state.latestNotification.id),
      )
      const notificationItem = mapNotificationDtoToItem(
        state.latestNotification,
        storedActionKey,
      )

      setNotifications((currentItems) => {
        const currentItem = currentItems.find(
          (item) => item.id === notificationItem.id,
        )
        const nextNotificationItem = currentItem?.selectedActionKey
          ? {
              ...notificationItem,
              selectedActionKey: currentItem.selectedActionKey,
              unread: false,
            }
          : notificationItem

        return [
          nextNotificationItem,
          ...currentItems.filter((item) => item.id !== notificationItem.id),
        ]
      })
    })
  }, [])

  return {
    currentTime,
    notifications,
    markAsRead,
    markAllAsRead,
    chooseAction,
  }
}

function canChooseParentNotificationAction(
  notification: ParentNotificationItem | undefined,
  actionKey: string,
  now = Date.now(),
): actionKey is ParentNotificationAction['key'] {
  return Boolean(
    notification &&
      !notification.selectedActionKey &&
      !isParentNotificationActionExpired(notification, now) &&
      notification.actions?.some((action) => action.key === actionKey),
  )
}

function markParentNotificationItemsAsRead(
  notifications: ParentNotificationItem[],
) {
  return notifications.map((item) =>
    item.unread
      ? {
          ...item,
          unread: false,
        }
      : item,
  )
}

function isParentNotificationActionKey(
  value: unknown,
): value is ParentNotificationAction['key'] {
  return value === 'confirm' || value === 'reject'
}

function hasServerAnomalyActionStatus(
  payload: ParentNotificationPayloadDto | null | undefined,
) {
  return Boolean(
    payload &&
      Object.prototype.hasOwnProperty.call(payload, 'anomalyActionStatus'),
  )
}

function mapAnomalyActionStatusToActionKey(
  status: ParentNotificationPayloadDto['anomalyActionStatus'],
): ParentNotificationAction['key'] | undefined {
  if (status === 'CONFIRMED') {
    return 'confirm'
  }

  if (status === 'REJECTED') {
    return 'reject'
  }

  return undefined
}

function readSelectedParentNotificationActions(): SelectedParentNotificationActions {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(
      SELECTED_PARENT_NOTIFICATION_ACTIONS_STORAGE_KEY,
    )

    if (!rawValue) {
      return {}
    }

    const parsedValue = JSON.parse(rawValue) as Record<string, unknown>

    return Object.entries(parsedValue).reduce<SelectedParentNotificationActions>(
      (actions, [notificationId, actionKey]) => {
        if (isParentNotificationActionKey(actionKey)) {
          actions[notificationId] = actionKey
        }

        return actions
      },
      {},
    )
  } catch {
    return {}
  }
}

function readSelectedParentNotificationAction(
  notificationId: string,
): ParentNotificationAction['key'] | undefined {
  return readSelectedParentNotificationActions()[notificationId]
}

function writeSelectedParentNotificationAction(
  notificationId: string,
  actionKey: ParentNotificationAction['key'],
) {
  if (typeof window === 'undefined') {
    return
  }

  const selectedActions = readSelectedParentNotificationActions()

  selectedActions[notificationId] = actionKey
  try {
    window.localStorage.setItem(
      SELECTED_PARENT_NOTIFICATION_ACTIONS_STORAGE_KEY,
      JSON.stringify(selectedActions),
    )
  } catch {
    // Ignore storage failures; the in-memory lock still prevents immediate changes.
  }
}

function mapNotificationDtoToItem(
  notification: ParentNotificationDto,
  selectedActionKey?: ParentNotificationAction['key'],
): ParentNotificationItem {
  const typeMeta = getNotificationTypeMeta(notification.notificationType)
  const payload = notification.payload
  const title = payload?.title?.trim() || typeMeta.title
  const message = payload?.content?.trim() || `${title} 알림을 확인해 주세요.`
  const serverSelectedActionKey = mapAnomalyActionStatusToActionKey(
    payload?.anomalyActionStatus,
  )
  const fallbackSelectedActionKey =
    !hasServerAnomalyActionStatus(payload) &&
    isParentNotificationActionKey(selectedActionKey)
      ? selectedActionKey
      : undefined
  const resolvedSelectedActionKey = typeMeta.withActions
    ? (serverSelectedActionKey ?? fallbackSelectedActionKey)
    : undefined

  return {
    actions: typeMeta.withActions
      ? [
          { key: 'reject', label: '불가', tone: 'danger' },
          { key: 'confirm', label: '확인', tone: 'primary' },
        ]
      : undefined,
    childrenId: payload?.childrenId,
    createdAt: notification.createdAt,
    highlightLabel: getHighlightLabel(notification),
    icon: typeMeta.icon,
    id: String(notification.id),
    message,
    notificationType: notification.notificationType,
    timeLabel: formatRelativeTimeLabel(notification.createdAt),
    title,
    tone: typeMeta.tone,
    selectedActionKey: resolvedSelectedActionKey,
    unread: resolvedSelectedActionKey ? false : !notification.isRead,
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
export {
  canChooseParentNotificationAction,
  mapNotificationDtoToItem,
}
