import type {
  ParentConnectedCounselor,
  ParentConnectedCounselorDto,
  ParentConnectedCounselorResponseDto,
  ParentConnectedChild,
  ParentConnectedChildDto,
  ParentConnectedChildResponseDto,
  ParentCounselorProfileDto,
  ParentCounselorProfilesResponseDto,
  ParentCounselorRelationRequestDto,
  ParentCounselorRelationResponseDto,
} from '../types/parentRelation'
import { ApiError, apiRequest } from '../../../shared/api/client'

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

function normalizeConnectedChild(
  child?: ParentConnectedChildDto | null,
): ParentConnectedChild {
  if (!child?.connected || !child.childrenId) {
    return {
      age: null,
      connected: false,
      email: null,
      id: null,
      name: null,
    }
  }

  return {
    age: child.age ?? null,
    connected: true,
    email: child.email ?? null,
    id: child.childrenId,
    name: child.name ?? null,
  }
}

function normalizeConnectedCounselor(
  counselor?: ParentConnectedCounselorDto | null,
): ParentConnectedCounselor {
  if (!counselor?.counselorId) {
    return {
      connected: false,
      email: null,
      id: null,
      name: null,
      relationStatus: null,
    }
  }

  return {
    connected: true,
    email: counselor.email ?? null,
    id: counselor.counselorId,
    name: counselor.name ?? null,
    relationStatus: counselor.relationStatus ?? null,
  }
}

async function getParentConnectedChild(
  accessToken: string,
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

    if (body?.code) {
      throw new ParentRelationApiError(
        body?.message ?? fallbackMessage,
        body?.code,
      )
    }

    return normalizeConnectedChild(body?.data)
  } catch (error) {
    if (error instanceof ParentRelationApiError) throw error

    throw new ParentRelationApiError(
      getResponseErrorMessage(error, fallbackMessage),
    )
  }
}

async function getParentConnectedCounselor(
  accessToken: string,
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
  accessToken: string,
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

export {
  ParentRelationApiError,
  getParentConnectedCounselor,
  getParentConnectedChild,
  normalizeConnectedCounselor,
  normalizeConnectedChild,
  parentRelationApiPaths,
  requestParentCounselorRelation,
  searchParentCounselors,
}
