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
import {
  getUnreadParentReportChildIds,
  getUnreadParentReportNotificationIdsByChildId,
  withUnreadParentObservationMarkers,
} from '../src/features/notification/utils/counselorNotificationMarkers'

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

describe('counselor notification sidebar markers', () => {
  it('extracts unread parent report child ids only', () => {
    const unreadChildIds = getUnreadParentReportChildIds([
      {
        createdAt: '2026-05-17T09:30:00',
        id: 3,
        isRead: false,
        notificationType: 'PARENT_REPORT_NEW',
        payload: {
          childrenId: 'child-1',
        },
      },
      {
        createdAt: '2026-05-17T09:31:00',
        id: 4,
        isRead: true,
        notificationType: 'PARENT_REPORT_NEW',
        payload: {
          childrenId: 'child-2',
        },
      },
      {
        createdAt: '2026-05-17T09:32:00',
        id: 5,
        isRead: false,
        notificationType: 'RISK_ALERT',
        payload: {
          childrenId: 'child-3',
        },
      },
    ])

    expect([...unreadChildIds]).toEqual(['child-1'])
  })

  it('groups unread parent report notification ids by child id', () => {
    const unreadNotificationIdsByChildId =
      getUnreadParentReportNotificationIdsByChildId([
        {
          createdAt: '2026-05-17T09:30:00',
          id: 3,
          isRead: false,
          notificationType: 'PARENT_REPORT_NEW',
          payload: {
            childrenId: 'child-1',
          },
        },
        {
          createdAt: '2026-05-17T09:31:00',
          id: 4,
          isRead: false,
          notificationType: 'PARENT_REPORT_NEW',
          payload: {
            childrenId: 'child-1',
          },
        },
        {
          createdAt: '2026-05-17T09:32:00',
          id: 5,
          isRead: false,
          notificationType: 'RISK_ALERT',
          payload: {
            childrenId: 'child-1',
          },
        },
      ])

    expect(unreadNotificationIdsByChildId.get('child-1')).toEqual([3, 4])
  })

  it('adds red-dot marker state to matching sidebar children', () => {
    expect(
      withUnreadParentObservationMarkers(
        [
          {
            id: 'child-1',
            meta: '13세',
            name: 'Child One',
            registeredAt: '2026-05-17T00:00:00',
            subText: '보호자: Parent One',
          },
          {
            id: 'child-2',
            meta: '12세',
            name: 'Child Two',
            registeredAt: '2026-05-17T00:00:00',
            subText: '보호자: Parent Two',
          },
        ],
        new Set(['child-2']),
      ),
    ).toMatchObject([
      { id: 'child-1', hasUnreadParentObservation: false },
      { id: 'child-2', hasUnreadParentObservation: true },
    ])
  })
})
