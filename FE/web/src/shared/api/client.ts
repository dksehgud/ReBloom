type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type ApiRequestOptions = {
  method?: ApiMethod
  accessToken?: string | null
  body?: unknown
  credentials?: RequestCredentials
  headers?: HeadersInit
  errorMessage?: string
  withAuth?: boolean
}

const SESSION_STORAGE_KEY = 'rebloom-app-session'

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')

  if (configuredBaseUrl) {
    if (
      import.meta.env.DEV &&
      configuredBaseUrl.includes('10.0.2.2') &&
      typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ) {
      return configuredBaseUrl.replace('10.0.2.2', window.location.hostname)
    }

    return configuredBaseUrl
  }

  if (!import.meta.env.DEV) {
    return ''
  }

  if (typeof window !== 'undefined' && window.location.hostname === '10.0.2.2') {
    return 'http://10.0.2.2:8080'
  }

  return 'http://localhost:8080'
}

const API_BASE_URL = resolveApiBaseUrl()

class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getStoredAccessToken() {
  if (typeof window === 'undefined') return null

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession) as {
      state?: {
        accessToken?: unknown
      }
    }
    const accessToken = session.state?.accessToken

    return typeof accessToken === 'string' ? accessToken : null
  } catch {
    return null
  }
}

function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

async function parseResponseBody(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    accessToken: accessTokenOverride,
    body,
    credentials = 'include',
    errorMessage,
    headers,
    method = 'GET',
    withAuth = true,
  } = options
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const accessToken =
    accessTokenOverride !== undefined
      ? accessTokenOverride
      : withAuth
        ? getStoredAccessToken()
        : null

  if (accessToken && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    credentials,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const responseBody = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiError(errorMessage ?? 'API 요청에 실패했습니다.', response.status, responseBody)
  }

  return responseBody as T
}

export { API_BASE_URL, ApiError, apiRequest }
