import type {
  ParentConnectedCounselor,
  ParentConnectedCounselorResponseDto,
  ParentConnectedChild,
  ParentConnectedChildResponseDto,
  ParentCounselorProfileDto,
  ParentCounselorProfilesResponseDto,
  ParentCounselorRelationRequestDto,
  ParentCounselorRelationResponseDto,
  ParentRelationBaseResponseDto,
} from '../types/parentRelation'
import { ApiError, apiRequest } from '../../../shared/api/client'
import {
  normalizeConnectedChild,
  normalizeConnectedCounselor,
} from '../services/parentRelationMapper'

const AUTH_API_PREFIX = '/auth/api/v1'

class ParentRelationApiError extends Error {
  code?: string

  constructor(message: string, code?: string | null) {
    super(message)
    this.name = 'ParentRelationApiError'
    this.code = code ?? undefined
  }
}

const parentRelationApiPaths = {
  connectedCounselor: `${AUTH_API_PREFIX}/parents/relations/counselors`,
  connectedChild: `${AUTH_API_PREFIX}/parents/children`,
  deleteCounselorRelation: (counselorEmail: string) =>
    `${AUTH_API_PREFIX}/parents/relations/counselors?counselorEmail=${encodeURIComponent(
      counselorEmail,
    )}`,
  requestCounselorRelation: `${AUTH_API_PREFIX}/parents/relations/counselors`,
  searchCounselors: (email: string) =>
    `${AUTH_API_PREFIX}/users/profiles?email=${encodeURIComponent(
      email,
    )}`,
}

function getResponseErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const data = error.data as { code?: string; message?: string } | null

    return data?.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

function isChildDisconnectedResponseCode(code?: string | null) {
  return code === 'PARENT_RELATION_NOT_FOUND' || code === 'NOT_FOUND'
}

function isChildDisconnectedResponse(data?: { code?: string | null } | null) {
  return isChildDisconnectedResponseCode(data?.code)
}

function isChildDisconnectedApiError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false
  }

  if (error.status === 404) {
    return true
  }

  const data = error.data as { code?: string | null } | null

  return isChildDisconnectedResponse(data)
}

async function getParentConnectedChild(
  accessToken?: string | null,
): Promise<ParentConnectedChild> {
  const fallbackMessage = '연결된 아이 정보를 불러오지 못했습니다.'

  try {
    const body = await apiRequest<ParentConnectedChildResponseDto | null>(
      parentRelationApiPaths.connectedChild,
      {
        accessToken,
        errorMessage: fallbackMessage,
      },
    )

    if (isChildDisconnectedResponse(body)) {
      return normalizeConnectedChild(null)
    }

    if (body?.code) {
      throw new ParentRelationApiError(
        body?.message ?? fallbackMessage,
        body?.code,
      )
    }

    return normalizeConnectedChild(body?.data)
  } catch (error) {
    if (isChildDisconnectedApiError(error)) {
      return normalizeConnectedChild(null)
    }

    if (error instanceof ParentRelationApiError) throw error

    throw new ParentRelationApiError(
      getResponseErrorMessage(error, fallbackMessage),
    )
  }
}

async function getParentConnectedCounselor(
  accessToken?: string | null,
): Promise<ParentConnectedCounselor> {
  const fallbackMessage = '상담사 연결 정보를 불러오지 못했습니다.'

  try {
    const body = await apiRequest<ParentConnectedCounselorResponseDto | null>(
      parentRelationApiPaths.connectedCounselor,
      {
        accessToken,
        errorMessage: fallbackMessage,
      },
    )

    if (body?.code) {
      throw new ParentRelationApiError(
        body?.message ?? fallbackMessage,
        body?.code,
      )
    }

    return normalizeConnectedCounselor(body?.data)
  } catch (error) {
    if (error instanceof ParentRelationApiError) throw error

    throw new ParentRelationApiError(
      getResponseErrorMessage(error, fallbackMessage),
    )
  }
}

async function searchParentCounselors(
  email: string,
  accessToken?: string | null,
): Promise<ParentCounselorProfileDto[]> {
  const fallbackMessage = '상담사 검색에 실패했습니다.'

  try {
    const body = await apiRequest<ParentCounselorProfilesResponseDto | null>(
      parentRelationApiPaths.searchCounselors(email),
      {
        accessToken,
        errorMessage: fallbackMessage,
      },
    )

    if (body?.code) {
      throw new ParentRelationApiError(
        body?.message ?? fallbackMessage,
        body?.code,
      )
    }

    return body?.data?.contents ?? []
  } catch (error) {
    if (error instanceof ParentRelationApiError) throw error

    throw new ParentRelationApiError(
      getResponseErrorMessage(error, fallbackMessage),
    )
  }
}

async function requestParentCounselorRelation(
  counselorEmail: string,
  accessToken?: string | null,
): Promise<ParentConnectedCounselor> {
  const fallbackMessage = '상담사 연결 신청에 실패했습니다.'

  try {
    const body = await apiRequest<ParentCounselorRelationResponseDto | null>(
      parentRelationApiPaths.requestCounselorRelation,
      {
        accessToken,
        body: {
          counselorEmail,
        } satisfies ParentCounselorRelationRequestDto,
        errorMessage: fallbackMessage,
        method: 'POST',
      },
    )

    if (body?.code) {
      throw new ParentRelationApiError(
        body?.message ?? fallbackMessage,
        body?.code,
      )
    }

    return normalizeConnectedCounselor(body?.data)
  } catch (error) {
    if (error instanceof ParentRelationApiError) throw error

    throw new ParentRelationApiError(
      getResponseErrorMessage(error, fallbackMessage),
    )
  }
}

async function deleteParentCounselorRelation(
  counselorEmail: string,
  accessToken?: string | null,
): Promise<void> {
  const fallbackMessage = '상담사 연결 해제에 실패했습니다.'

  try {
    const body = await apiRequest<ParentRelationBaseResponseDto<void> | null>(
      parentRelationApiPaths.deleteCounselorRelation(counselorEmail),
      {
        accessToken,
        errorMessage: fallbackMessage,
        method: 'DELETE',
      },
    )

    if (body?.code) {
      throw new ParentRelationApiError(
        body?.message ?? fallbackMessage,
        body?.code,
      )
    }
  } catch (error) {
    if (error instanceof ParentRelationApiError) throw error

    throw new ParentRelationApiError(
      getResponseErrorMessage(error, fallbackMessage),
    )
  }
}

const parentRelationApi = {
  deleteParentCounselorRelation,
  getParentConnectedCounselor,
  getParentConnectedChild,
  requestParentCounselorRelation,
  searchParentCounselors,
}

export {
  deleteParentCounselorRelation,
  ParentRelationApiError,
  getParentConnectedCounselor,
  getParentConnectedChild,
  parentRelationApi,
  parentRelationApiPaths,
  requestParentCounselorRelation,
  searchParentCounselors,
}
