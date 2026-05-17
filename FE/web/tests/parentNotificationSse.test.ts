import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/shared/api/client', () => ({
  API_BASE_URL: 'https://api.example.com',
}))

import {
  buildNotificationSseUrl,
  mapRealtimeParentNotificationToDto,
  parseParentNotificationSseEvent,
  parseSseEvent,
} from '../src/features/notification/api/parentNotificationSse'

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
})
