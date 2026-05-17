import { apiRequest } from '../../../shared/api/client'
import type {
  ParentNotificationBaseResponseDto,
  ParentNotificationDto,
  ParentNotificationListDataDto,
  ParentNotificationListRequest,
  ParentNotificationReadRequest,
} from '../types/parentNotification'

const NOTIFICATION_API_PREFIX = '/notification/api/v1/notifications'

const counselorNotificationApiPaths = {
  list: NOTIFICATION_API_PREFIX,
  markAsRead: (notificationId: number | string) =>
    `${NOTIFICATION_API_PREFIX}/${notificationId}/read`,
}

function isBaseResponse<T>(
  body: ParentNotificationBaseResponseDto<T> | T,
): body is ParentNotificationBaseResponseDto<T> {
  return typeof body === 'object' && body !== null && 'data' in body
}

function unwrapBaseResponse<T>(
  body: ParentNotificationBaseResponseDto<T> | T | null,
): T | null {
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

async function getCounselorNotifications({
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
    `${counselorNotificationApiPaths.list}${createQueryString({
      isRead,
      page,
      size,
    })}`,
    {
      accessToken,
      errorMessage: '상담사 알림 목록을 불러오지 못했습니다.',
      sessionRole: 'counselor',
    },
  )

  return unwrapBaseResponse(body) ?? { contents: [] }
}

async function markCounselorNotificationAsRead({
  accessToken,
  notificationId,
}: ParentNotificationReadRequest) {
  await apiRequest<ParentNotificationBaseResponseDto<null> | null>(
    counselorNotificationApiPaths.markAsRead(notificationId),
    {
      accessToken,
      errorMessage: '상담사 알림 읽음 처리에 실패했습니다.',
      method: 'PATCH',
      sessionRole: 'counselor',
    },
  )
}

const counselorNotificationApi = {
  getCounselorNotifications,
  markCounselorNotificationAsRead,
}

export {
  counselorNotificationApi,
  counselorNotificationApiPaths,
  getCounselorNotifications,
  markCounselorNotificationAsRead,
}
export type { ParentNotificationDto as CounselorNotificationDto }
