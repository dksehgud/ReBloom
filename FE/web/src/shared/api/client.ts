type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type ApiRequestOptions = {
  method?: ApiMethod
  body?: unknown
  headers?: HeadersInit
  errorMessage?: string
  withAuth?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const ACCESS_TOKEN_STORAGE_KEY = 'rebloom.accessToken'

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

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
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
  const { method = 'GET', body, headers, errorMessage, withAuth = true } = options
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const accessToken = withAuth ? getStoredAccessToken() : null

  if (accessToken && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const responseBody = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiError(errorMessage ?? 'API 요청에 실패했습니다.', response.status, responseBody)
  }

  return responseBody as T
}

export { ACCESS_TOKEN_STORAGE_KEY, API_BASE_URL, ApiError, apiRequest }
