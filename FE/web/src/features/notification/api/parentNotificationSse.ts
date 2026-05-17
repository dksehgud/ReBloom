import {
  EventStreamContentType,
  fetchEventSource,
  type EventSourceMessage,
} from '@microsoft/fetch-event-source'

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

type ParentNotificationSseTokens = {
  accessToken: string
  refreshToken: string
}

type ParentNotificationSseHandlers = {
  onAuthExpired?: () => void
  onError?: (error: unknown) => void
  onNotification: (notification: ParentNotificationDto) => void
  onTokenRefresh?: (tokens: ParentNotificationSseTokens) => void
}

type ParentNotificationSseRequest = ParentNotificationSseHandlers & {
  accessToken?: string | null
  refreshToken?: string | null
  reissueAccessToken?: (
    refreshToken?: string | null,
  ) => Promise<ParentNotificationSseTokens>
}

type ParsedSseEvent = {
  data: string
  event: string
}

const PARENT_NOTIFICATION_SUBSCRIBE_PATH =
  '/notification/api/v1/notifications/subscribe'
const SSE_BASE_RETRY_DELAY_MS = 1000
const SSE_MAX_RETRY_DELAY_MS = 30000

class ParentNotificationSseRetriableError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ParentNotificationSseRetriableError'
    this.status = status
  }
}

class ParentNotificationSseFatalError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ParentNotificationSseFatalError'
    this.status = status
  }
}

class ParentNotificationSseTokenRefreshedError extends Error {
  constructor() {
    super('Parent notification SSE token refreshed.')
    this.name = 'ParentNotificationSseTokenRefreshedError'
  }
}

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

function parseParentNotificationSseMessage(
  message: Pick<EventSourceMessage, 'data' | 'event'>,
): ParentNotificationDto | null {
  if (message.event !== 'notification') {
    return null
  }

  try {
    return mapRealtimeParentNotificationToDto(
      JSON.parse(message.data) as ParentRealtimeNotificationMessageDto,
    )
  } catch {
    return null
  }
}

function parseParentNotificationSseEvent(
  rawEvent: string,
): ParentNotificationDto | null {
  const parsedEvent = parseSseEvent(rawEvent)

  if (!parsedEvent) {
    return null
  }

  return parseParentNotificationSseMessage(parsedEvent)
}

function subscribeParentNotifications({
  accessToken,
  onAuthExpired,
  onError,
  onNotification,
  onTokenRefresh,
  refreshToken,
  reissueAccessToken,
}: ParentNotificationSseRequest) {
  if (!accessToken || typeof fetch === 'undefined') {
    return () => undefined
  }

  const abortController = new AbortController()
  let currentAccessToken = accessToken
  let currentRefreshToken = refreshToken ?? null
  let isClosed = false
  let retryAttempt = 0

  const getRetryDelay = () => {
    const retryDelay = Math.min(
      SSE_MAX_RETRY_DELAY_MS,
      SSE_BASE_RETRY_DELAY_MS * 2 ** retryAttempt,
    )

    retryAttempt += 1
    return retryDelay
  }

  const requestTokenRefresh = async () => {
    if (!currentRefreshToken || !reissueAccessToken) {
      onAuthExpired?.()
      throw new ParentNotificationSseFatalError(
        'Parent notification SSE authentication expired.',
        401,
      )
    }

    try {
      const tokens = await reissueAccessToken(currentRefreshToken)

      currentAccessToken = tokens.accessToken
      currentRefreshToken = tokens.refreshToken
      retryAttempt = 0
      onTokenRefresh?.(tokens)
      throw new ParentNotificationSseTokenRefreshedError()
    } catch (error) {
      if (error instanceof ParentNotificationSseTokenRefreshedError) {
        throw error
      }

      onAuthExpired?.()
      throw new ParentNotificationSseFatalError(
        'Parent notification SSE token refresh failed.',
        401,
      )
    }
  }

  const openSseConnection = async (response: Response) => {
    if (response.status === 401 || response.status === 403) {
      await requestTokenRefresh()
    }

    if (response.status >= 400 && response.status < 500) {
      throw new ParentNotificationSseFatalError(
        'Parent notification SSE request was rejected.',
        response.status,
      )
    }

    if (!response.ok) {
      throw new ParentNotificationSseRetriableError(
        'Parent notification SSE request failed.',
        response.status,
      )
    }

    const contentType = response.headers.get('content-type')

    if (!contentType?.startsWith(EventStreamContentType)) {
      throw new ParentNotificationSseRetriableError(
        'Parent notification SSE response was not an event stream.',
      )
    }

    retryAttempt = 0
  }

  const handleMessage = (message: EventSourceMessage) => {
    if (message.event === 'ping' || message.event === 'connect') {
      return
    }

    const notification = parseParentNotificationSseMessage(message)

    if (notification) {
      retryAttempt = 0
      onNotification(notification)
    }
  }

  void fetchEventSource(buildNotificationSseUrl(), {
    credentials: 'include',
    fetch: (input, init) => {
      const headers = new Headers(init?.headers)

      headers.set('Accept', EventStreamContentType)
      headers.set('Authorization', `Bearer ${currentAccessToken}`)

      return fetch(input, {
        ...init,
        headers,
      })
    },
    headers: {
      Accept: EventStreamContentType,
      Authorization: `Bearer ${currentAccessToken}`,
    },
    onclose: () => {
      if (!isClosed) {
        throw new ParentNotificationSseRetriableError(
          'Parent notification SSE connection closed.',
        )
      }
    },
    onerror: (error: unknown) => {
      if (isClosed) {
        return undefined
      }

      if (error instanceof ParentNotificationSseTokenRefreshedError) {
        return 0
      }

      if (error instanceof ParentNotificationSseFatalError) {
        throw error
      }

      onError?.(error)
      return getRetryDelay()
    },
    onmessage: handleMessage,
    onopen: openSseConnection,
    openWhenHidden: true,
    signal: abortController.signal,
  }).catch((error: unknown) => {
    if (isClosed) {
      return
    }

    onError?.(error)
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
  parseParentNotificationSseMessage,
  parseSseEvent,
  subscribeParentNotifications,
}
export type {
  ParentNotificationSseHandlers,
  ParentNotificationSseRequest,
  ParentNotificationSseTokens,
  ParentRealtimeNotificationMessageDto,
}
