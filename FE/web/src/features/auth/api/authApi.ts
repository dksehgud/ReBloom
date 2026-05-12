import { apiRequest } from '../../../shared/api/client'
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
  hospitalName?: string
  hospitalAddress?: string
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
  hospitalName?: string
  hospitalAddress?: string
  hospitalAddressDetail?: string
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

type PasswordChangeRequest = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

type AuthRequestOptions = {
  accessToken?: string | null
  body?: unknown
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  withAuth?: boolean
}

class AuthApiError extends Error {
  code?: string

  constructor(message: string, code?: string | null) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code ?? undefined
  }
}

const AUTH_API_PREFIX = '/auth/api/v1'

function toAppRole(role: BackendRole): Exclude<AppRole, null> {
  if (role === 'CHILDREN') {
    return 'child'
  }

  return role.toLowerCase() as Exclude<AppRole, null>
}

async function request<T>(path: string, options: AuthRequestOptions = {}) {
  const response = await apiRequest<BaseResponse<T> | null>(path, {
    accessToken: options.accessToken,
    body: options.body,
    method: options.method,
    withAuth: options.withAuth,
  })

  if (response?.code) {
    throw new AuthApiError(
      response.message ?? '요청 처리 중 오류가 발생했습니다.',
      response.code,
    )
  }

  if (!response) {
    throw new AuthApiError('서버 응답이 올바르지 않습니다.')
  }

  return response
}

async function login(email: string, password: string) {
  const response = await request<LoginResponse>(`${AUTH_API_PREFIX}/auth/login`, {
    method: 'POST',
    body: { email, password },
    withAuth: false,
  })

  if (!response.data) {
    throw new AuthApiError('로그인 응답이 올바르지 않습니다.')
  }

  return response.data
}

async function getMyInfo(accessToken?: string | null) {
  const response = await request<UserInfoResponse>(`${AUTH_API_PREFIX}/users`, {
    accessToken,
  })

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
      body: { email },
      withAuth: false,
    },
  )

  return Boolean(response.data?.isDuplicate)
}

async function sendEmailVerificationCode(email: string) {
  await request<void>(`${AUTH_API_PREFIX}/auth/emails/verification-codes`, {
    method: 'POST',
    body: { email },
    withAuth: false,
  })
}

async function verifyEmailCode(email: string, code: string) {
  const response = await request<EmailVerificationResponse>(
    `${AUTH_API_PREFIX}/auth/emails/verifications`,
    {
      method: 'POST',
      body: { email, code },
      withAuth: false,
    },
  )

  return Boolean(response.data?.isVerified)
}

async function signup(payload: SignupRequest) {
  await request<void>(`${AUTH_API_PREFIX}/users`, {
    method: 'POST',
    body: payload,
    withAuth: false,
  })
}

async function resetPassword(email: string) {
  await request<void>(`${AUTH_API_PREFIX}/auth/passwords/resets`, {
    method: 'POST',
    body: { email },
    withAuth: false,
  })
}

async function updateMyInfo(payload: UserUpdateRequest, accessToken?: string | null) {
  const response = await request<UserInfoResponse>(`${AUTH_API_PREFIX}/users`, {
    accessToken,
    body: payload,
    method: 'PATCH',
  })

  if (!response.data) {
    throw new AuthApiError('사용자 정보를 수정하지 못했습니다.')
  }

  return response.data
}

async function verifyPassword(password: string, accessToken?: string | null) {
  await request<void>(`${AUTH_API_PREFIX}/users/passwords/verifications`, {
    accessToken,
    body: { password },
    method: 'POST',
  })
}

async function changePassword(
  payload: PasswordChangeRequest,
  accessToken?: string | null,
) {
  await request<void>(`${AUTH_API_PREFIX}/users/passwords`, {
    accessToken,
    body: payload,
    method: 'PATCH',
  })
}

const authApi = {
  changePassword,
  checkEmailDuplicate,
  getMyInfo,
  login,
  resetPassword,
  sendEmailVerificationCode,
  signup,
  updateMyInfo,
  verifyEmailCode,
  verifyPassword,
}

export type {
  BackendGender,
  BackendRole,
  PasswordChangeRequest,
  SignupRequest,
  UserInfoResponse,
  UserUpdateRequest,
}
export { AuthApiError, authApi, toAppRole }
