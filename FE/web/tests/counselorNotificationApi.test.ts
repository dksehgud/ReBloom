import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMock = vi.hoisted(() => ({
  API_BASE_URL: '/api',
  ApiError: class MockApiError extends Error {},
  apiRequest: vi.fn(),
}))

vi.mock('../src/shared/api/client', () => apiClientMock)

import {
  getCounselorNotifications,
  markCounselorNotificationAsRead,
} from '../src/features/notification/api/counselorNotificationApi'
import { mapCounselorNotificationDtoToItem } from '../src/features/notification/hooks/useCounselorNotificationState'

const apiRequestMock = apiClientMock.apiRequest

beforeEach(() => {
  apiRequestMock.mockReset()
})

describe('counselor notification API', () => {
  it('loads counselor notifications through the shared notification list endpoint', async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: {
        contents: [
          {
            createdAt: '2026-05-17T09:00:00',
            id: 1,
            isRead: false,
            notificationType: 'PARENT_REPORT_NEW',
            payload: {
              childrenName: 'Child One',
              content: 'New parent report arrived.',
              title: 'Parent report',
            },
          },
        ],
      },
    })

    await expect(
      getCounselorNotifications({
        accessToken: 'token',
        isRead: false,
        page: 1,
        size: 5,
      }),
    ).resolves.toMatchObject({
      contents: [{ id: 1, notificationType: 'PARENT_REPORT_NEW' }],
    })
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/notification/api/v1/notifications?isRead=false&page=1&size=5',
      expect.objectContaining({
        accessToken: 'token',
        sessionRole: 'counselor',
      }),
    )
  })

  it('marks counselor notifications as read through the shared read endpoint', async () => {
    apiRequestMock.mockResolvedValueOnce({ data: null })

    await expect(
      markCounselorNotificationAsRead({
        accessToken: 'token',
        notificationId: 12,
      }),
    ).resolves.toBeUndefined()
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/notification/api/v1/notifications/12/read',
      expect.objectContaining({
        accessToken: 'token',
        method: 'PATCH',
        sessionRole: 'counselor',
      }),
    )
  })
})

describe('counselor notification mapper', () => {
  it('maps notification DTOs to counselor list items', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T10:00:00'))

    try {
      expect(
        mapCounselorNotificationDtoToItem({
          createdAt: '2026-05-17T09:30:00',
          id: 3,
          isRead: false,
          notificationType: 'RISK_ALERT',
          payload: {
            childrenName: 'Child Two',
            content: 'Risk alert content',
            title: 'Risk title',
          },
        }),
      ).toEqual({
        childName: 'Child Two',
        id: '3',
        message: 'Risk alert content',
        notificationType: 'RISK_ALERT',
        timeLabel: '30분 전',
        title: 'Risk title',
        tone: 'pink',
        typeLabel: '위험 감지',
        unread: true,
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
