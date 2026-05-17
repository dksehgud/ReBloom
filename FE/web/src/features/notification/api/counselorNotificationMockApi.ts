import type {
  ParentNotificationDto,
  ParentNotificationListDataDto,
  ParentNotificationListRequest,
  ParentNotificationReadRequest,
} from '../types/parentNotification'

let counselorNotificationDtos: ParentNotificationDto[] = [
  {
    createdAt: '2026-05-17T09:30:00',
    deliveryStatus: 'SENT',
    id: 101,
    isRead: false,
    notificationType: 'PARENT_REPORT_NEW',
    payload: {
      childrenId: 'mock-child-1',
      childrenName: 'Child One',
      content: '보호자가 새 보고서를 등록했습니다.',
      title: '새 부모 보고서',
    },
  },
  {
    createdAt: '2026-05-16T18:20:00',
    deliveryStatus: 'SENT',
    id: 102,
    isRead: false,
    notificationType: 'RISK_ALERT',
    payload: {
      childrenName: 'Child Two',
      content: '감정 변화 확인이 필요한 알림입니다.',
      title: '위험 감지 알림',
    },
  },
  {
    createdAt: '2026-05-15T12:10:00',
    deliveryStatus: 'SENT',
    id: 103,
    isRead: true,
    notificationType: 'CONVERSATION_ALERT',
    payload: {
      childrenName: 'Child Three',
      content: '아이의 IoT 대화 기록이 도착했습니다.',
      title: '대화 알림',
    },
  },
]

async function getCounselorNotifications({
  isRead,
  page = 0,
  size = 20,
}: ParentNotificationListRequest): Promise<ParentNotificationListDataDto> {
  const filteredNotifications =
    typeof isRead === 'boolean'
      ? counselorNotificationDtos.filter((notification) => notification.isRead === isRead)
      : counselorNotificationDtos
  const startIndex = page * size
  const contents = filteredNotifications.slice(startIndex, startIndex + size)

  return {
    contents,
    slice: {
      first: page === 0,
      hasNext: startIndex + size < filteredNotifications.length,
      last: startIndex + size >= filteredNotifications.length,
      number: page,
      numberOfElements: contents.length,
      size,
    },
  }
}

async function markCounselorNotificationAsRead({
  notificationId,
}: ParentNotificationReadRequest): Promise<void> {
  const normalizedId = Number(notificationId)

  counselorNotificationDtos = counselorNotificationDtos.map((notification) =>
    notification.id === normalizedId
      ? {
          ...notification,
          isRead: true,
        }
      : notification,
  )
}

const counselorNotificationMockApi = {
  getCounselorNotifications,
  markCounselorNotificationAsRead,
}

export {
  counselorNotificationMockApi,
  getCounselorNotifications,
  markCounselorNotificationAsRead,
}
