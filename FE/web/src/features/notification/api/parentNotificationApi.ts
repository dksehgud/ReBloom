import { apiRequest } from '../../../shared/api/client'
import type {
  ParentNotificationAnomalyActionRequest,
  ParentNotificationBaseResponseDto,
  ParentNotificationListDataDto,
  ParentNotificationListRequest,
  ParentNotificationReadRequest,
} from '../types/parentNotification'

const NOTIFICATION_API_PREFIX = '/notification/api/v1/notifications'

const parentNotificationApiPaths = {
  confirmAnomalyAlert: `${NOTIFICATION_API_PREFIX}/anomaly-alert/confirm`,
  list: NOTIFICATION_API_PREFIX,
  markAllAsRead: `${NOTIFICATION_API_PREFIX}/read-all`,
  markAsRead: (notificationId: number | string) =>
    `${NOTIFICATION_API_PREFIX}/${notificationId}/read`,
  rejectAnomalyAlert: `${NOTIFICATION_API_PREFIX}/anomaly-alert/reject`,
}

function isBaseResponse<T>(
  body: ParentNotificationBaseResponseDto<T> | T,
): body is ParentNotificationBaseResponseDto<T> {
  return typeof body === 'object' && body !== null && 'data' in body
}

function unwrapBaseResponse<T>(body: ParentNotificationBaseResponseDto<T> | T | null): T | null {
  if (!body) {
    return null
  }

  if (isBaseResponse(body)) {
    return body.data ?? null
  }

  return body
}

function createQueryString(params: Record<string, boolean | number | string | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()

  return queryString ? `?${queryString}` : ''
}

function createAnomalyActionBody({
  childrenId,
  notificationId,
}: ParentNotificationAnomalyActionRequest) {
  const normalizedNotificationId = Number(notificationId)

  return {
    childrenId,
    notificationId: Number.isNaN(normalizedNotificationId)
      ? undefined
      : normalizedNotificationId,
  }
}

async function getParentNotifications({
  accessToken,
  isRead,
  page = 0,
  size = 20,
}: ParentNotificationListRequest) {
  const body = await apiRequest<
    | ParentNotificationBaseResponseDto<ParentNotificationListDataDto>
    | ParentNotificationListDataDto
    | null
  >(
    `${parentNotificationApiPaths.list}${createQueryString({
      isRead,
      page,
      size,
    })}`,
    {
      accessToken,
      errorMessage: '알림 목록을 불러오지 못했습니다.',
    },
  )

  return unwrapBaseResponse(body) ?? { contents: [] }
}

async function markParentNotificationAsRead({
  accessToken,
  notificationId,
}: ParentNotificationReadRequest) {
  await apiRequest<ParentNotificationBaseResponseDto<null> | null>(
    parentNotificationApiPaths.markAsRead(notificationId),
    {
      accessToken,
      errorMessage: '알림 읽음 처리에 실패했습니다.',
      method: 'PATCH',
    },
  )
}

async function markAllParentNotificationsAsRead(accessToken?: string | null) {
  await apiRequest<ParentNotificationBaseResponseDto<number> | null>(
    parentNotificationApiPaths.markAllAsRead,
    {
      accessToken,
      errorMessage: '전체 알림 읽음 처리에 실패했습니다.',
      method: 'PATCH',
    },
  )
}

async function confirmParentAnomalyAlert(
  request: ParentNotificationAnomalyActionRequest,
) {
  await apiRequest<ParentNotificationBaseResponseDto<null> | null>(
    parentNotificationApiPaths.confirmAnomalyAlert,
    {
      accessToken: request.accessToken,
      body: createAnomalyActionBody(request),
      errorMessage: '이상치 알림 확인 처리에 실패했습니다.',
      method: 'POST',
    },
  )
}

async function rejectParentAnomalyAlert(
  request: ParentNotificationAnomalyActionRequest,
) {
  await apiRequest<ParentNotificationBaseResponseDto<null> | null>(
    parentNotificationApiPaths.rejectAnomalyAlert,
    {
      accessToken: request.accessToken,
      body: createAnomalyActionBody(request),
      errorMessage: '이상치 알림 불가 처리에 실패했습니다.',
      method: 'POST',
    },
  )
}

const parentNotificationApi = {
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
  parentNotificationApi,
  parentNotificationApiPaths,
  rejectParentAnomalyAlert,
}
