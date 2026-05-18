import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/shared/api/client', () => ({
  API_BASE_URL: 'https://api.example.com',
}))

import {
  buildNotificationSseUrl,
  mapRealtimeParentNotificationToDto,
  parseParentNotificationSseEvent,
  parseSseEvent,
} from '../src/features/notification/api/parentNotificationSse'
import {
  isParentAnomalyAlertNotification,
  useParentRealtimeNotificationStore,
} from '../src/features/notification/store/useParentRealtimeNotificationStore'

beforeEach(() => {
  useParentRealtimeNotificationStore.setState({
    anomalyAlertPopup: null,
    latestNotification: null,
    latestNotificationSequence: 0,
    notificationBadgeCount: 0,
  })
})

describe('parent notification SSE helpers', () => {
  it('builds the subscribe endpoint from the configured API base URL', () => {
    expect(buildNotificationSseUrl()).toBe(
      'https://api.example.com/notification/api/v1/notifications/subscribe',
    )
  })

  it('parses named SSE notification events', () => {
    const rawEvent = [
      'event: notification',
      'data: {"notificationId":7,',
      'data: "notificationType":"RISK_ALERT",',
      'data: "isRead":false,',
      'data: "createdAt":"2026-05-17T09:00:00",',
      'data: "payload":{"title":"Risk","childrenId":"child-1"}}',
    ].join('\n')

    expect(parseSseEvent(rawEvent)).toEqual({
      data: [
        '{"notificationId":7,',
        '"notificationType":"RISK_ALERT",',
        '"isRead":false,',
        '"createdAt":"2026-05-17T09:00:00",',
        '"payload":{"title":"Risk","childrenId":"child-1"}}',
      ].join('\n'),
      event: 'notification',
    })
    expect(parseParentNotificationSseEvent(rawEvent)).toMatchObject({
      id: 7,
      isRead: false,
      notificationType: 'RISK_ALERT',
      payload: {
        childrenId: 'child-1',
        title: 'Risk',
      },
    })
  })

  it('ignores connect and ping events', () => {
    expect(parseParentNotificationSseEvent('event: connect\ndata: connected')).toBeNull()
    expect(parseParentNotificationSseEvent('event: ping\ndata: pong')).toBeNull()
  })

  it('maps realtime messages to parent notification list DTOs', () => {
    expect(
      mapRealtimeParentNotificationToDto({
        createdAt: '2026-05-17T10:00:00',
        isRead: null,
        notificationId: '11',
        notificationType: 'PARENT_REPORT_REPLY',
        payload: {
          content: 'A counselor reply arrived.',
          title: 'Reply',
        },
      }),
    ).toEqual({
      createdAt: '2026-05-17T10:00:00',
      id: 11,
      isRead: false,
      notificationType: 'PARENT_REPORT_REPLY',
      payload: {
        content: 'A counselor reply arrived.',
        title: 'Reply',
      },
    })
  })

  it('drops malformed realtime messages', () => {
    expect(
      mapRealtimeParentNotificationToDto({
        createdAt: '2026-05-17T10:00:00',
        notificationId: 'not-a-number',
        notificationType: 'RISK_ALERT',
      }),
    ).toBeNull()
  })

  it('stores only risk alert realtime notifications as parent popups', () => {
    const replyNotification = {
      createdAt: '2026-05-17T10:00:00',
      id: 11,
      isRead: false,
      notificationType: 'PARENT_REPORT_REPLY',
      payload: {
        content: 'A counselor reply arrived.',
        title: 'Reply',
      },
    }
    const riskNotification = {
      createdAt: '2026-05-17T10:01:00',
      id: 12,
      isRead: false,
      notificationType: 'RISK_ALERT',
      payload: {
        childrenId: 'child-1',
        content: 'Risk alert arrived.',
        title: 'Risk',
      },
    }
    const { receiveNotification, dismissAnomalyAlertPopup } =
      useParentRealtimeNotificationStore.getState()

    expect(isParentAnomalyAlertNotification(replyNotification)).toBe(false)
    receiveNotification(replyNotification)
    expect(useParentRealtimeNotificationStore.getState()).toMatchObject({
      anomalyAlertPopup: null,
      latestNotification: replyNotification,
      latestNotificationSequence: 1,
      notificationBadgeCount: 1,
    })

    expect(isParentAnomalyAlertNotification(riskNotification)).toBe(true)
    receiveNotification(riskNotification)
    expect(useParentRealtimeNotificationStore.getState()).toMatchObject({
      anomalyAlertPopup: riskNotification,
      latestNotification: riskNotification,
      latestNotificationSequence: 2,
      notificationBadgeCount: 2,
    })

    dismissAnomalyAlertPopup(riskNotification.id)
    expect(
      useParentRealtimeNotificationStore.getState().anomalyAlertPopup,
    ).toBeNull()
  })

  it('clears the parent notification navigation badge separately from popups', () => {
    const { clearNotificationBadge, receiveNotification } =
      useParentRealtimeNotificationStore.getState()
    const riskNotification = {
      createdAt: '2026-05-17T10:01:00',
      id: 12,
      isRead: false,
      notificationType: 'RISK_ALERT',
      payload: {
        childrenId: 'child-1',
        content: 'Risk alert arrived.',
        title: 'Risk',
      },
    }

    receiveNotification(riskNotification)
    expect(useParentRealtimeNotificationStore.getState()).toMatchObject({
      anomalyAlertPopup: riskNotification,
      notificationBadgeCount: 1,
    })

    clearNotificationBadge()
    expect(useParentRealtimeNotificationStore.getState()).toMatchObject({
      anomalyAlertPopup: riskNotification,
      notificationBadgeCount: 0,
    })
  })
})
