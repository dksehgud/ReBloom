import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMock = vi.hoisted(() => {
  class MockApiError extends Error {
    data: unknown
    status: number

    constructor(message: string, status: number, data: unknown = null) {
      super(message)
      this.name = 'ApiError'
      this.status = status
      this.data = data
    }
  }

  return {
    API_BASE_URL: '/api',
    ApiError: MockApiError,
    apiRequest: vi.fn(),
  }
})

vi.mock('../src/shared/api/client', () => apiClientMock)

import {
  changeParentPassword,
  parentAccountApi,
  verifyParentPassword,
} from '../src/features/guardian/api/parentAccountApi'
import {
  deleteParentDevice,
  getParentDeviceByType,
  getParentDevices,
  registerParentDevice,
} from '../src/features/guardian/api/parentDeviceApi'
import {
  createParentObservationReport,
  deleteParentObservationReport,
  getParentObservationCounselorComment,
  getParentObservationDetail,
  getParentObservationList,
  parentObservationApi,
  updateParentObservationReport,
} from '../src/features/guardian/api/parentObservationApi'
import {
  deleteParentCounselorRelation,
  getParentConnectedChild,
  getParentConnectedCounselor,
  parentRelationApi,
  requestParentCounselorRelation,
  searchParentCounselors,
} from '../src/features/guardian/api/parentRelationApi'
import { parentRelationMockApi } from '../src/features/guardian/api/parentRelationMockApi'
import {
  getParentMockSearch,
  isParentMockModeSearch,
} from '../src/features/guardian/hooks/useParentMockMode'
import { getParentAccountApi } from '../src/features/guardian/services/parentAccountService'
import { getParentObservationApi } from '../src/features/guardian/services/parentObservationService'
import { getParentRelationApi } from '../src/features/guardian/services/parentRelationService'
import {
  confirmParentAnomalyAlert,
  getParentNotifications,
  markAllParentNotificationsAsRead,
  markParentNotificationAsRead,
  parentNotificationApi,
  rejectParentAnomalyAlert,
} from '../src/features/notification/api/parentNotificationApi'
import {
  canChooseParentNotificationAction,
  mapNotificationDtoToItem,
} from '../src/features/notification/hooks/useParentNotificationState'
import {
  PARENT_ANOMALY_ACTION_WINDOW_MS,
  isParentNotificationActionExpired,
} from '../src/features/notification/constants/parentNotifications'
import { getParentNotificationApi } from '../src/features/notification/services/parentNotificationService'
import {
  getParentDiaryEmotions,
  getParentHrAccRatios,
  getParentRmssds,
  getParentSleepScores,
  parentReportApi,
} from '../src/features/report/api/parentReportApi'
import { getParentReportApi } from '../src/features/report/services/parentReportService'

const apiRequestMock = apiClientMock.apiRequest

beforeEach(() => {
  apiRequestMock.mockReset()
})

describe('parent mock mode routing', () => {
  it('blocks parent mock mode from URL queries', () => {
    expect(isParentMockModeSearch('')).toBe(false)
    expect(isParentMockModeSearch('?mock=1')).toBe(false)
    expect(isParentMockModeSearch('?mock=true')).toBe(false)
    expect(isParentMockModeSearch('?mode=mock')).toBe(false)
    expect(getParentMockSearch('')).toBe('')
    expect(getParentMockSearch('?mock=1')).toBe('')
    expect(getParentMockSearch('?mock=1&mode=webview')).toBe('?mode=webview')
    expect(getParentMockSearch('?mode=webview')).toBe('?mode=webview')
  })

  it('keeps parent API selection explicit at the service boundary', () => {
    expect(getParentAccountApi(false)).toBe(parentAccountApi)
    expect(getParentObservationApi(false)).toBe(parentObservationApi)
    expect(getParentRelationApi(false)).toBe(parentRelationApi)
    expect(getParentNotificationApi(false)).toBe(parentNotificationApi)
    expect(getParentReportApi(false)).toBe(parentReportApi)
    expect(getParentRelationApi(true)).toBe(parentRelationMockApi)
  })
})

describe('parent relation API functions', () => {
  it('loads the connected child relation', async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: {
        age: 9,
        childrenId: 'child-1',
        connected: true,
        email: 'child@example.com',
        name: 'Child',
      },
    })

    await expect(getParentConnectedChild('token')).resolves.toMatchObject({
      age: 9,
      connected: true,
      id: 'child-1',
      name: 'Child',
    })
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/auth/api/v1/parents/children',
      expect.objectContaining({ accessToken: 'token' }),
    )
  })

  it('loads, searches, requests, and deletes counselor relations', async () => {
    apiRequestMock
      .mockResolvedValueOnce({
        data: {
          counselorId: 'counselor-1',
          email: 'counselor@example.com',
          hospitalName: 'Rebloom Clinic',
          name: 'Counselor',
          relationStatus: 'ACTIVE',
        },
      })
      .mockResolvedValueOnce({
        data: {
          contents: [
            {
              email: 'counselor@example.com',
              hospitalName: 'Rebloom Clinic',
              name: 'Counselor',
              userRole: 'COUNSELOR',
            },
          ],
          count: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          counselorId: 'counselor-1',
          relationStatus: 'PENDING',
        },
      })
      .mockResolvedValueOnce({ data: null })

    await expect(getParentConnectedCounselor('token')).resolves.toMatchObject({
      connected: true,
      hospitalName: 'Rebloom Clinic',
      id: 'counselor-1',
    })
    await expect(
      searchParentCounselors('counselor@example.com', 'token'),
    ).resolves.toMatchObject([{ hospitalName: 'Rebloom Clinic' }])
    await expect(
      requestParentCounselorRelation('counselor@example.com', 'token'),
    ).resolves.toMatchObject({ id: 'counselor-1', relationStatus: 'PENDING' })
    await expect(
      deleteParentCounselorRelation('counselor+1@example.com', 'token'),
    ).resolves.toBeUndefined()

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/auth/api/v1/parents/relations/counselors',
      expect.objectContaining({ accessToken: 'token' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/auth/api/v1/users/profiles?email=counselor%40example.com&role=COUNSELOR',
      expect.objectContaining({ accessToken: 'token' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      '/auth/api/v1/parents/relations/counselors',
      expect.objectContaining({
        body: { counselorEmail: 'counselor@example.com' },
        method: 'POST',
      }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      4,
      '/auth/api/v1/parents/relations/counselors?counselorEmail=counselor%2B1%40example.com',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

describe('parent observation API functions', () => {
  it('caps current-month observation list range at today', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 15, 12))
    apiRequestMock.mockResolvedValueOnce({ dailyReports: [] })

    try {
      await getParentObservationList({
        accessToken: 'token',
        childrenId: 'child-1',
        month: 5,
        year: 2026,
      })

      expect(apiRequestMock).toHaveBeenCalledWith(
        '/report/api/v1/children/child-1/reports?startDate=2026-05-01&endDate=2026-05-15',
        expect.objectContaining({ accessToken: 'token' }),
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('loads observation list, detail, and counselor comment', async () => {
    apiRequestMock
      .mockResolvedValueOnce({
        dailyReports: [
          {
            date: '2026-05-14',
            reportList: [
              {
                context: 'Calm evening',
                emotionTag: 'calm',
                hasCounselorComment: true,
                reportDate: '2026-05-14T18:30:00',
                reportId: 'report-1',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        context: 'Calm evening',
        emotionTag: 'calm',
        reportDate: '2026-05-14T18:30:00',
        reportId: 'report-1',
      })
      .mockResolvedValueOnce({
        commentId: 'comment-1',
        context: 'Looks stable',
        counselorId: 'counselor-1',
        createdAt: '2026-05-14T19:00:00',
        reportId: 'report-1',
      })

    const list = await getParentObservationList({
      accessToken: 'token',
      childrenId: 'child-1',
      endDate: '2026-05-14',
      startDate: '2026-05-01',
    })
    const detail = await getParentObservationDetail({
      accessToken: 'token',
      childrenId: 'child-1',
      reportId: 'report-1',
    })
    const comment = await getParentObservationCounselorComment({
      accessToken: 'token',
      childrenId: 'child-1',
      reportId: 'report-1',
    })

    expect(list.records).toHaveLength(1)
    expect(list.records[0]?.hasCounselorComment).toBe(true)
    expect(detail.id).toBe('report-1')
    expect(comment?.commentId).toBe('comment-1')
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/report/api/v1/children/child-1/reports?startDate=2026-05-01&endDate=2026-05-14',
      expect.objectContaining({ accessToken: 'token' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      '/report/api/v1/children/child-1/reports/report-1/comments',
      expect.objectContaining({ accessToken: 'token' }),
    )
  })

  it('creates, updates, and deletes observation reports', async () => {
    apiRequestMock
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null })

    const payload = {
      context: 'Observed calm behavior',
      emotionTag: 'calm',
      reportDate: '2026-05-14T18:30:00',
    }

    await createParentObservationReport({
      accessToken: 'token',
      childrenId: 'child-1',
      payload,
    })
    await updateParentObservationReport({
      accessToken: 'token',
      childrenId: 'child-1',
      payload,
      reportId: 'report-1',
    })
    await deleteParentObservationReport({
      accessToken: 'token',
      childrenId: 'child-1',
      reportId: 'report-1',
    })

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/report/api/v1/children/child-1/reports',
      expect.objectContaining({ body: payload, method: 'POST' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/report/api/v1/children/child-1/reports/report-1',
      expect.objectContaining({ body: payload, method: 'PATCH' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      '/report/api/v1/children/child-1/reports/report-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

describe('parent report API functions', () => {
  it('loads diary emotions and chart endpoints', async () => {
    apiRequestMock
      .mockResolvedValueOnce({ emotionList: [{ emotionIcon: 'happy', targetDate: '2026-05-14' }] })
      .mockResolvedValue({ contents: [{ date: '2026-05-14', value: 80 }], count: 1 })

    await expect(
      getParentDiaryEmotions({
        accessToken: 'token',
        childrenId: 'child-1',
        endDate: '2026-05-14',
        startDate: '2026-05-08',
      }),
    ).resolves.toMatchObject({ emotionList: expect.any(Array) })
    await expect(
      getParentSleepScores({
        accessToken: 'token',
        baseDate: '2026-05-14',
        childrenId: 'child-1',
      }),
    ).resolves.toMatchObject({ contents: expect.any(Array) })
    await getParentRmssds({
      accessToken: 'token',
      baseDate: '2026-05-14',
      childrenId: 'child-1',
    })
    await getParentHrAccRatios({
      accessToken: 'token',
      baseDate: '2026-05-14',
      childrenId: 'child-1',
    })

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/report/api/v1/children/child-1/diaries/emotions?startDate=2026-05-08&endDate=2026-05-14',
      expect.objectContaining({ accessToken: 'token' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      4,
      '/biometric/api/v1/children/child-1/charts/biometrics/hr-acc-ratios?baseDate=2026-05-14',
      expect.objectContaining({ accessToken: 'token' }),
    )
  })
})

describe('parent notification API functions', () => {
  const anomalyAlertCreatedAt = '2026-05-17T10:00:00'
  const anomalyAlertOpenTime = new Date('2026-05-17T10:04:59').getTime()
  const anomalyAlertExpiredTime =
    new Date(anomalyAlertCreatedAt).getTime() + PARENT_ANOMALY_ACTION_WINDOW_MS

  it('loads and marks parent notifications', async () => {
    apiRequestMock
      .mockResolvedValueOnce({ data: { contents: [{ id: 1, isRead: false }] } })
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: 3 })

    await expect(
      getParentNotifications({
        accessToken: 'token',
        isRead: false,
        page: 1,
        size: 5,
      }),
    ).resolves.toMatchObject({ contents: expect.any(Array) })
    await markParentNotificationAsRead({
      accessToken: 'token',
      notificationId: 1,
    })
    await markAllParentNotificationsAsRead('token')

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/notification/api/v1/notifications?isRead=false&page=1&size=5',
      expect.objectContaining({ accessToken: 'token' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/notification/api/v1/notifications/1/read',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      '/notification/api/v1/notifications/read-all',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('handles parent anomaly alert action requests', async () => {
    apiRequestMock.mockResolvedValue({ data: null })

    await confirmParentAnomalyAlert({
      accessToken: 'token',
      childrenId: 'child-1',
      notificationId: 1,
    })
    await rejectParentAnomalyAlert({
      accessToken: 'token',
      childrenId: 'child-1',
      notificationId: 1,
    })

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/notification/api/v1/notifications/anomaly-alert/confirm',
      expect.objectContaining({
        accessToken: 'token',
        body: { childrenId: 'child-1', notificationId: 1 },
        method: 'POST',
      }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/notification/api/v1/notifications/anomaly-alert/reject',
      expect.objectContaining({
        accessToken: 'token',
        body: { childrenId: 'child-1', notificationId: 1 },
        method: 'POST',
      }),
    )
  })

  it('maps action buttons only for risk alert notifications', () => {
    const riskAlert = mapNotificationDtoToItem({
      createdAt: anomalyAlertCreatedAt,
      id: 1,
      isRead: false,
      notificationType: 'RISK_ALERT',
      payload: {
        childrenId: 'child-1',
        content: '확인이 필요한 알림입니다.',
        title: '주의 필요',
      },
    })
    const conversationAlert = mapNotificationDtoToItem({
      createdAt: anomalyAlertCreatedAt,
      id: 2,
      isRead: false,
      notificationType: 'CONVERSATION_ALERT',
      payload: {
        childrenId: 'child-1',
        content: '대화 확인 결과 알림입니다.',
        title: '응답 요청',
      },
    })

    expect(riskAlert.childrenId).toBe('child-1')
    expect(riskAlert.createdAt).toBe(anomalyAlertCreatedAt)
    expect(riskAlert.notificationType).toBe('RISK_ALERT')
    expect(riskAlert.unread).toBe(true)
    expect(riskAlert.actions?.map((action) => action.key)).toEqual([
      'reject',
      'confirm',
    ])
    expect(conversationAlert.actions).toBeUndefined()
  })

  it('preserves parent report reply target ids for observation deep links', () => {
    const reportReply = mapNotificationDtoToItem({
      createdAt: '2026-05-17T10:00:00',
      id: 3,
      isRead: false,
      notificationType: 'PARENT_REPORT_REPLY',
      payload: {
        childrenId: 'child-1',
        childrenReportId: 'report-1',
        content: 'A counselor comment arrived.',
        title: 'Counselor comment',
      },
    })

    expect(reportReply.childrenId).toBe('child-1')
    expect(reportReply.childrenReportId).toBe('report-1')
    expect(reportReply.notificationType).toBe('PARENT_REPORT_REPLY')
    expect(reportReply.actions).toBeUndefined()
  })

  it('blocks changing an already selected parent anomaly alert action', () => {
    const riskAlert = mapNotificationDtoToItem({
      createdAt: anomalyAlertCreatedAt,
      id: 1,
      isRead: false,
      notificationType: 'RISK_ALERT',
      payload: {
        childrenId: 'child-1',
      },
    })

    expect(
      canChooseParentNotificationAction(
        riskAlert,
        'confirm',
        anomalyAlertOpenTime,
      ),
    ).toBe(true)
    expect(
      canChooseParentNotificationAction(
        { ...riskAlert, selectedActionKey: 'confirm' },
        'reject',
        anomalyAlertOpenTime,
      ),
    ).toBe(false)
  })

  it('blocks parent anomaly alert actions after five minutes', () => {
    const riskAlert = mapNotificationDtoToItem({
      createdAt: anomalyAlertCreatedAt,
      id: 1,
      isRead: false,
      notificationType: 'RISK_ALERT',
      payload: {
        childrenId: 'child-1',
      },
    })

    expect(
      isParentNotificationActionExpired(riskAlert, anomalyAlertExpiredTime),
    ).toBe(true)
    expect(
      canChooseParentNotificationAction(
        riskAlert,
        'confirm',
        anomalyAlertExpiredTime,
      ),
    ).toBe(false)
  })

  it('keeps a persisted parent anomaly alert action selected after remapping', () => {
    const riskAlert = mapNotificationDtoToItem(
      {
        createdAt: '2026-05-17T10:00:00',
        id: 1,
        isRead: false,
        notificationType: 'RISK_ALERT',
        payload: {
          childrenId: 'child-1',
        },
      },
      'reject',
    )

    expect(riskAlert.selectedActionKey).toBe('reject')
    expect(riskAlert.unread).toBe(false)
    expect(canChooseParentNotificationAction(riskAlert, 'confirm')).toBe(false)
  })

  it('uses anomaly action status from the parent notification payload first', () => {
    const confirmedAlert = mapNotificationDtoToItem(
      {
        createdAt: '2026-05-17T10:00:00',
        id: 1,
        isRead: false,
        notificationType: 'RISK_ALERT',
        payload: {
          anomalyActionStatus: 'CONFIRMED',
          childrenId: 'child-1',
        },
      },
      'reject',
    )
    const pendingAlert = mapNotificationDtoToItem(
      {
        createdAt: '2026-05-17T10:00:00',
        id: 2,
        isRead: false,
        notificationType: 'RISK_ALERT',
        payload: {
          anomalyActionStatus: 'NONE',
          childrenId: 'child-1',
        },
      },
      'reject',
    )

    expect(confirmedAlert.selectedActionKey).toBe('confirm')
    expect(confirmedAlert.unread).toBe(false)
    expect(pendingAlert.selectedActionKey).toBeUndefined()
    expect(
      canChooseParentNotificationAction(
        pendingAlert,
        'confirm',
        anomalyAlertOpenTime,
      ),
    ).toBe(true)
  })
})

describe('parent account API functions', () => {
  it('verifies and changes the parent password', async () => {
    apiRequestMock.mockResolvedValue({ data: null })

    await verifyParentPassword('current-password', 'token')
    await changeParentPassword(
      {
        currentPassword: 'current-password',
        newPassword: 'new-password',
        newPasswordConfirm: 'new-password',
      },
      'token',
    )

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/auth/api/v1/users/passwords/verifications',
      expect.objectContaining({
        body: { password: 'current-password' },
        method: 'POST',
      }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/auth/api/v1/users/passwords',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })
})

describe('parent device API functions', () => {
  it('loads, registers, reads by type, and deletes devices for a child', async () => {
    apiRequestMock
      .mockResolvedValueOnce({
        data: {
          contents: [
            {
              childrenId: 'child-1',
              deviceId: 1,
              deviceType: 'WATCH',
              serialNumber: 'WATCH-1',
            },
          ],
          count: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          childrenId: 'child-1',
          deviceId: 2,
          deviceType: 'IOT',
          serialNumber: 'IOT-1',
        },
      })
      .mockResolvedValueOnce({
        data: {
          childrenId: 'child-1',
          deviceId: 1,
          deviceType: 'WATCH',
          serialNumber: 'WATCH-1',
        },
      })
      .mockResolvedValueOnce({ data: null })

    await expect(
      getParentDevices({ accessToken: 'token', childrenId: 'child-1' }),
    ).resolves.toMatchObject({ count: 1 })
    await expect(
      registerParentDevice({
        accessToken: 'token',
        childrenId: 'child-1',
        payload: { deviceType: 'IOT', serialNumber: 'IOT-1' },
      }),
    ).resolves.toMatchObject({ deviceId: 2 })
    await expect(
      getParentDeviceByType({
        accessToken: 'token',
        childrenId: 'child-1',
        deviceType: 'WATCH',
      }),
    ).resolves.toMatchObject({ deviceType: 'WATCH' })
    await deleteParentDevice({
      accessToken: 'token',
      childrenId: 'child-1',
      serialNumber: 'WATCH-1',
    })

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/auth/api/v1/parents/devices/child-1/',
      expect.objectContaining({ accessToken: 'token' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/auth/api/v1/parents/devices/child-1',
      expect.objectContaining({
        body: { deviceType: 'IOT', serialNumber: 'IOT-1' },
        method: 'POST',
      }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      '/auth/api/v1/parents/devices/child-1/type/WATCH',
      expect.objectContaining({ accessToken: 'token' }),
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      4,
      '/auth/api/v1/parents/devices/child-1/serial/WATCH-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
