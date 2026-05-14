import { apiRequest } from '../../../shared/api/client'

type BaseResponse<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

type ChildConnectedCounselorDto = {
  connected: boolean
  counselorId?: string | null
  email?: string | null
  hospitalName?: string | null
  name?: string | null
}

type ChildConnectedCounselor = {
  connected: boolean
  email: string | null
  hospitalName: string | null
  id: string | null
  name: string | null
}

const AUTH_API_PREFIX = '/auth/api/v1'

const childRelationApiPaths = {
  connectedCounselor: `${AUTH_API_PREFIX}/children/counselor`,
}

function normalizeConnectedCounselor(
  counselor?: ChildConnectedCounselorDto | null,
): ChildConnectedCounselor {
  if (!counselor?.connected || !counselor.counselorId) {
    return {
      connected: false,
      email: null,
      hospitalName: null,
      id: null,
      name: null,
    }
  }

  return {
    connected: true,
    email: counselor.email ?? null,
    hospitalName: counselor.hospitalName ?? null,
    id: counselor.counselorId,
    name: counselor.name ?? null,
  }
}

async function getChildConnectedCounselor(
  accessToken?: string | null,
): Promise<ChildConnectedCounselor> {
  const body = await apiRequest<BaseResponse<ChildConnectedCounselorDto> | null>(
    childRelationApiPaths.connectedCounselor,
    {
      accessToken,
      errorMessage: 'Failed to load connected counselor.',
    },
  )

  return normalizeConnectedCounselor(body?.data)
}

export {
  childRelationApiPaths,
  getChildConnectedCounselor,
  normalizeConnectedCounselor,
}

export type { ChildConnectedCounselor, ChildConnectedCounselorDto }
