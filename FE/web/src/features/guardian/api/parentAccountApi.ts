import { apiRequest } from '../../../shared/api/client'
import type { PasswordChangeRequest } from '../../auth/api/authApi'

type ParentAccountBaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

const AUTH_API_PREFIX = '/auth/api/v1'

const parentAccountApiPaths = {
  changePassword: `${AUTH_API_PREFIX}/users/passwords`,
  verifyPassword: `${AUTH_API_PREFIX}/users/passwords/verifications`,
}

function assertSuccessfulResponse<T>(
  response: ParentAccountBaseResponseDto<T> | null,
  fallbackMessage: string,
) {
  if (response?.code) {
    throw new Error(response.message ?? fallbackMessage)
  }
}

async function verifyParentPassword(
  password: string,
  accessToken?: string | null,
): Promise<void> {
  const fallbackMessage = '현재 비밀번호 확인에 실패했습니다.'
  const response = await apiRequest<ParentAccountBaseResponseDto<void> | null>(
    parentAccountApiPaths.verifyPassword,
    {
      accessToken,
      body: { password },
      errorMessage: fallbackMessage,
      method: 'POST',
    },
  )

  assertSuccessfulResponse(response, fallbackMessage)
}

async function changeParentPassword(
  payload: PasswordChangeRequest,
  accessToken?: string | null,
): Promise<void> {
  const fallbackMessage = '비밀번호 변경에 실패했습니다.'
  const response = await apiRequest<ParentAccountBaseResponseDto<void> | null>(
    parentAccountApiPaths.changePassword,
    {
      accessToken,
      body: payload,
      errorMessage: fallbackMessage,
      method: 'PATCH',
    },
  )

  assertSuccessfulResponse(response, fallbackMessage)
}

const parentAccountApi = {
  changeParentPassword,
  verifyParentPassword,
}

export {
  changeParentPassword,
  parentAccountApi,
  parentAccountApiPaths,
  verifyParentPassword,
}
