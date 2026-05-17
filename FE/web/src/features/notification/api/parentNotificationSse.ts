import { API_BASE_URL } from '../../../shared/api/client'
import type {
  ParentNotificationDto,
  ParentNotificationPayloadDto,
} from '../types/parentNotification'

type ParentRealtimeNotificationMessageDto = {
  createdAt?: string | null
  id?: number | string | null
  isRead?: boolean | null
  notificationId?: number | string | null
  notificationType?: string | null
  payload?: ParentNotificationPayloadDto | null
}

type ParentNotificationSseHandlers = {
  onError?: (error: unknown) => void
  onNotification: (notification: ParentNotificationDto) => void
}

type ParentNotificationSseRequest = ParentNotificationSseHandlers & {
  accessToken?: string | null
}

type ParsedSseEvent = {
  data: string
  event: string
}

const PARENT_NOTIFICATION_SUBSCRIBE_PATH =
  '/notification/api/v1/notifications/subscribe'

function buildNotificationSseUrl() {
  return `${API_BASE_URL}${PARENT_NOTIFICATION_SUBSCRIBE_PATH}`
}

function parseSseEvent(rawEvent: string): ParsedSseEvent | null {
  let event = 'message'
  const dataLines: string[] = []

  rawEvent.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith(':')) {
      return
    }

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const rawValue = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)
    const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue

    if (field === 'event') {
      event = value || 'message'
      return
    }

    if (field === 'data') {
      dataLines.push(value)
    }
  })

  if (dataLines.length === 0) {
    return null
  }

  return {
    data: dataLines.join('\n'),
    event,
  }
}

function mapRealtimeParentNotificationToDto(
  message: ParentRealtimeNotificationMessageDto,
): ParentNotificationDto | null {
  const rawNotificationId = message.notificationId ?? message.id
  const notificationId = Number(rawNotificationId)

  if (
    Number.isNaN(notificationId) ||
    !message.notificationType ||
    !message.createdAt
  ) {
    return null
  }

  return {
    createdAt: message.createdAt,
    id: notificationId,
    isRead: message.isRead ?? false,
    notificationType: message.notificationType,
    payload: message.payload ?? null,
  }
}

function parseParentNotificationSseEvent(rawEvent: string): ParentNotificationDto | null {
  const parsedEvent = parseSseEvent(rawEvent)

  if (!parsedEvent || parsedEvent.event !== 'notification') {
    return null
  }

  try {
    return mapRealtimeParentNotificationToDto(
      JSON.parse(parsedEvent.data) as ParentRealtimeNotificationMessageDto,
    )
  } catch {
    return null
  }
}

function handleSseChunk(
  chunk: string,
  onNotification: (notification: ParentNotificationDto) => void,
) {
  const notification = parseParentNotificationSseEvent(chunk)

  if (notification) {
    onNotification(notification)
  }
}

function subscribeParentNotifications({
  accessToken,
  onError,
  onNotification,
}: ParentNotificationSseRequest) {
  if (!accessToken || typeof fetch === 'undefined') {
    return () => undefined
  }

  const abortController = new AbortController()
  const decoder = new TextDecoder()
  let isClosed = false

  async function connect() {
    const response = await fetch(buildNotificationSseUrl(), {
      credentials: 'include',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${accessToken}`,
      },
      signal: abortController.signal,
    })

    if (!response.ok || !response.body) {
      throw new Error('부모 알림 실시간 구독에 실패했습니다.')
    }

    const reader = response.body.getReader()
    let buffer = ''

    while (!isClosed) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() ?? ''
      events.forEach((event) => handleSseChunk(event, onNotification))
    }

    if (buffer) {
      handleSseChunk(buffer, onNotification)
    }
  }

  void connect().catch((error: unknown) => {
    if (!isClosed && error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    if (!isClosed) {
      onError?.(error)
    }
  })

  return () => {
    isClosed = true
    abortController.abort()
  }
}

export {
  PARENT_NOTIFICATION_SUBSCRIBE_PATH,
  buildNotificationSseUrl,
  mapRealtimeParentNotificationToDto,
  parseParentNotificationSseEvent,
  parseSseEvent,
  subscribeParentNotifications,
}
export type {
  ParentNotificationSseHandlers,
  ParentNotificationSseRequest,
  ParentRealtimeNotificationMessageDto,
}
