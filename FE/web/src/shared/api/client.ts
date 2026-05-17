import {
  clearStoredRoleSession,
  inferSessionRoleFromApiPath,
  readStoredActiveRole,
  readStoredAccessToken,
  type SessionRole,
  writeStoredActiveRole,
} from '../../features/auth/session/appSessionStorage'

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type ApiRequestOptions = {
  method?: ApiMethod
  accessToken?: string | null
  body?: unknown
  credentials?: RequestCredentials
  headers?: HeadersInit
  sessionRole?: SessionRole
  errorMessage?: string
  withAuth?: boolean
}

function isWebViewMode() {
  if (typeof window === 'undefined') return false

  const searchParams = new URLSearchParams(window.location.search)

  return (
    searchParams.get('mode') === 'webview' ||
    window.__REBLOOM_SHELL_MODE__ === 'webview'
  )
}

function resolveWebViewHostUrl(baseUrl: string) {
  if (typeof window === 'undefined' || !isWebViewMode()) {
    return baseUrl
  }

  const currentHost = window.location.hostname

  if (
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    currentHost === '::1'
  ) {
    return baseUrl
  }

  try {
    const url = new URL(baseUrl)

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = currentHost
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    return baseUrl
  }

  return baseUrl
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')

  if (configuredBaseUrl) {
    return resolveWebViewHostUrl(configuredBaseUrl)
  }

  if (!import.meta.env.DEV) {
    return ''
  }

  throw new Error('VITE_API_BASE_URL is required in development.')
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

function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function resolveSessionRole(path: string, sessionRole?: SessionRole) {
  return sessionRole ?? readStoredActiveRole() ?? inferSessionRoleFromApiPath(path)
}

function redirectToLoginForExpiredSession(role: SessionRole | null) {
  if (typeof window === 'undefined' || !role) {
    return
  }

  clearStoredRoleSession(role)

  if (readStoredActiveRole() === role) {
    writeStoredActiveRole(null)
  }

  const loginPath =
    role === 'counselor'
      ? '/counselor/login?sessionExpired=1'
      : '/login?sessionExpired=1'

  if (window.location.pathname !== loginPath.split('?')[0]) {
    window.location.replace(loginPath)
  }
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

function getErrorMessage(responseBody: unknown, fallback: string) {
  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody
  }

  if (
    responseBody &&
    typeof responseBody === 'object' &&
    'message' in responseBody &&
    typeof responseBody.message === 'string' &&
    responseBody.message.trim()
  ) {
    return responseBody.message
  }

  return fallback
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    accessToken: accessTokenOverride,
    body,
    credentials = 'include',
    errorMessage,
    headers,
    method = 'GET',
    sessionRole,
    withAuth = true,
  } = options
  const requestHeaders = new Headers(headers)
  const resolvedSessionRole = resolveSessionRole(path, sessionRole)

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const accessToken =
    accessTokenOverride !== undefined
      ? accessTokenOverride
      : withAuth
        ? readStoredAccessToken(resolvedSessionRole)
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
    if (withAuth && response.status === 401) {
      redirectToLoginForExpiredSession(resolvedSessionRole)
    }

    throw new ApiError(
      getErrorMessage(responseBody, errorMessage ?? 'API 요청에 실패했습니다.'),
      response.status,
      responseBody,
    )
  }

  return responseBody as T
}

export { API_BASE_URL, ApiError, apiRequest }
