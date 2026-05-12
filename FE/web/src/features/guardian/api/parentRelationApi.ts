import type {
  ParentConnectedChild,
  ParentConnectedChildDto,
  ParentConnectedChildResponseDto,
} from '../types/parentRelation'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ??
  (import.meta.env.DEV ? 'http://localhost:8080' : '')

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

async function getParentConnectedChild(
  accessToken: string,
): Promise<ParentConnectedChild> {
  const response = await fetch(`${API_BASE_URL}${parentRelationApiPaths.connectedChild}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const body = (await response.json().catch(() => null)) as ParentConnectedChildResponseDto | null

  if (!response.ok || body?.code) {
    throw new ParentRelationApiError(
      body?.message ?? '연결된 자녀 정보를 불러오지 못했습니다.',
      body?.code,
    )
  }

  return normalizeConnectedChild(body?.data)
}

export {
  ParentRelationApiError,
  getParentConnectedChild,
  normalizeConnectedChild,
  parentRelationApiPaths,
}
