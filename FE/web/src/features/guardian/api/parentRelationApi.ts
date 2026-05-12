import type {
  ParentConnectedCounselor,
  ParentConnectedCounselorDto,
  ParentConnectedCounselorResponseDto,
  ParentConnectedChild,
  ParentConnectedChildDto,
  ParentConnectedChildResponseDto,
} from '../types/parentRelation'
import { apiRequest } from '../../../shared/api/client'

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
  connectedCounselor: `${AUTH_API_PREFIX}/parent/counselor`,
  connectedChild: `${AUTH_API_PREFIX}/parents/children`,
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
    }
  }

  return {
    connected: true,
    email: counselor.email ?? null,
    id: counselor.counselorId,
    name: counselor.name ?? null,
  }
}

async function getParentConnectedChild(
  accessToken: string,
): Promise<ParentConnectedChild> {
  const body = await apiRequest<ParentConnectedChildResponseDto | null>(
    parentRelationApiPaths.connectedChild,
    {
      accessToken,
      errorMessage: '연결된 자녀 정보를 불러오지 못했습니다.',
    },
  )

  if (body?.code) {
    throw new ParentRelationApiError(
      body?.message ?? '연결된 자녀 정보를 불러오지 못했습니다.',
      body?.code,
    )
  }

  return normalizeConnectedChild(body?.data)
}

async function getParentConnectedCounselor(
  accessToken: string,
): Promise<ParentConnectedCounselor> {
  const body = await apiRequest<ParentConnectedCounselorResponseDto | null>(
    parentRelationApiPaths.connectedCounselor,
    {
      accessToken,
      errorMessage: '연결된 상담사 정보를 불러오지 못했습니다.',
    },
  )

  if (body?.code) {
    throw new ParentRelationApiError(
      body?.message ?? '연결된 상담사 정보를 불러오지 못했습니다.',
      body?.code,
    )
  }

  return normalizeConnectedCounselor(body?.data)
}

export {
  ParentRelationApiError,
  getParentConnectedCounselor,
  getParentConnectedChild,
  normalizeConnectedCounselor,
  normalizeConnectedChild,
  parentRelationApiPaths,
}
