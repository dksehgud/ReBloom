import type { AppRole } from '../../../shared/types/appRole'

type BaseResponse<T> = {
  code?: string | null
  message?: string | null
  data?: T | null
}

type LoginResponse = {
  accessToken: string
  refreshToken: string
}

type EmailDuplicateResponse = {
  isDuplicate: boolean
}

type EmailVerificationResponse = {
  isVerified: boolean
}

type BackendRole = 'CHILDREN' | 'PARENT' | 'COUNSELOR'
type BackendGender = 'MALE' | 'FEMALE'

type UserInfoResponse = {
  userId: string
  email: string
  name: string
  phone?: string
  role: BackendRole
  status: string
  parentCode?: string
  birth?: string
  gender?: BackendGender
  address?: string
  addressDetail?: string
  latitude?: number
  longitude?: number
}

type SignupRequest = {
  email: string
  password: string
  name: string
  phone?: string
  role: BackendRole
  parentEmail?: string
  birth?: string
  gender?: BackendGender
  address?: string
  addressDetail?: string
  latitude?: number
  longitude?: number
}

type UserUpdateRequest = {
  name?: string
  email?: string
  phone?: string
  hospitalName?: string
  hospitalAddress?: string
  address?: string
  addressDetail?: string
  latitude?: number
  longitude?: number
}

class AuthApiError extends Error {
  code?: string

  constructor(message: string, code?: string | null) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code ?? undefined
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ??
  (import.meta.env.DEV ? 'http://localhost:8080' : '')

const AUTH_API_PREFIX = '/auth/api/v1'

function toAppRole(role: BackendRole): Exclude<AppRole, null> {
  if (role === 'CHILDREN') {
    return 'child'
  }

  return role.toLowerCase() as Exclude<AppRole, null>
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
) {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  const body = (await response.json().catch(() => null)) as BaseResponse<T> | null

  if (!response.ok || body?.code) {
    throw new AuthApiError(
      body?.message ?? '요청 처리 중 오류가 발생했습니다.',
      body?.code,
    )
  }

  if (!body) {
    throw new AuthApiError('서버 응답이 올바르지 않습니다.')
  }

  return body
}

async function login(email: string, password: string) {
  const response = await request<LoginResponse>(`${AUTH_API_PREFIX}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (!response.data) {
    throw new AuthApiError('로그인 응답이 올바르지 않습니다.')
  }

  return response.data
}

async function getMyInfo(accessToken: string) {
  const response = await request<UserInfoResponse>(
    `${AUTH_API_PREFIX}/users`,
    undefined,
    accessToken,
  )

  if (!response.data) {
    throw new AuthApiError('사용자 정보를 불러오지 못했습니다.')
  }

  return response.data
}

async function checkEmailDuplicate(email: string) {
  const response = await request<EmailDuplicateResponse>(
    `${AUTH_API_PREFIX}/auth/emails/duplications`,
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  )

  return Boolean(response.data?.isDuplicate)
}

async function sendEmailVerificationCode(email: string) {
  await request<void>(`${AUTH_API_PREFIX}/auth/emails/verification-codes`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

async function verifyEmailCode(email: string, code: string) {
  const response = await request<EmailVerificationResponse>(
    `${AUTH_API_PREFIX}/auth/emails/verifications`,
    {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    },
  )

  return Boolean(response.data?.isVerified)
}

async function signup(payload: SignupRequest) {
  await request<void>(`${AUTH_API_PREFIX}/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

async function updateMyInfo(payload: UserUpdateRequest, accessToken: string) {
  const response = await request<UserInfoResponse>(
    `${AUTH_API_PREFIX}/users`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    accessToken,
  )

  if (!response.data) {
    throw new AuthApiError('사용자 정보를 수정하지 못했습니다.')
  }

  return response.data
}

const authApi = {
  checkEmailDuplicate,
  getMyInfo,
  login,
  sendEmailVerificationCode,
  signup,
  updateMyInfo,
  verifyEmailCode,
}

export type {
  BackendGender,
  BackendRole,
  SignupRequest,
  UserUpdateRequest,
  UserInfoResponse,
}
export { AuthApiError, authApi, toAppRole }
