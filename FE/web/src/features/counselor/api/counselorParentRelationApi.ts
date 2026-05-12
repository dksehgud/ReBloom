import { apiRequest } from '../../../shared/api/client'

type BaseResponse<T> = {
  code?: string | null
  message?: string | null
  data?: T | null
}

type ListResponseDto<T> = {
  count: number
  contents?: T[] | null
}

type CounselorParentRelationStatus = 'ACTIVE' | 'PENDING' | 'REJECT'

type CounselorParentRelationResponseDto = {
  parentId: string
  parentName: string
  parentEmail: string
  childrenId: string
  childrenName: string
  relationStatus: CounselorParentRelationStatus
}

class CounselorParentRelationApiError extends Error {
  code?: string

  constructor(message: string, code?: string | null) {
    super(message)
    this.name = 'CounselorParentRelationApiError'
    this.code = code ?? undefined
  }
}

const AUTH_API_PREFIX = '/auth/api/v1'

const counselorParentRelationApiPaths = {
  parentRelations: `${AUTH_API_PREFIX}/counselors/relations/parents`,
  acceptParentRelation: (parentId: string) =>
    `${AUTH_API_PREFIX}/counselors/relations/parents/${parentId}/accept`,
}

function assertSuccess<T>(
  response: BaseResponse<T>,
  fallbackMessage: string,
): BaseResponse<T> {
  if (response.code) {
    throw new CounselorParentRelationApiError(
      response.message ?? fallbackMessage,
      response.code,
    )
  }

  return response
}

async function getCounselorParentRelations(accessToken?: string | null) {
  const response = await apiRequest<
    BaseResponse<ListResponseDto<CounselorParentRelationResponseDto>>
  >(counselorParentRelationApiPaths.parentRelations, {
    accessToken,
    errorMessage: '상담사 연결 요청을 불러오지 못했습니다.',
  })

  const body = assertSuccess(response, '상담사 연결 요청을 불러오지 못했습니다.')

  return body.data?.contents ?? []
}

async function acceptCounselorParentRelation(
  parentId: string,
  accessToken?: string | null,
) {
  const response = await apiRequest<
    BaseResponse<CounselorParentRelationResponseDto>
  >(counselorParentRelationApiPaths.acceptParentRelation(parentId), {
    accessToken,
    method: 'POST',
    errorMessage: '상담사 연결 요청을 수락하지 못했습니다.',
  })

  const body = assertSuccess(response, '상담사 연결 요청을 수락하지 못했습니다.')

  if (!body.data) {
    throw new CounselorParentRelationApiError(
      '상담사 연결 수락 응답이 올바르지 않습니다.',
    )
  }

  return body.data
}

export type {
  CounselorParentRelationResponseDto,
  CounselorParentRelationStatus,
}
export {
  CounselorParentRelationApiError,
  acceptCounselorParentRelation,
  counselorParentRelationApiPaths,
  getCounselorParentRelations,
}
