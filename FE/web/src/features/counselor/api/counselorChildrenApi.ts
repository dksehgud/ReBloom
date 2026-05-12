import { apiRequest } from '../../../shared/api/client'

type BaseResponse<T> = {
  code?: string | null
  message?: string | null
  data?: T | null
}

type CounselorChildResponseDto = {
  childrenId: string
  name: string
  counselingStatus: string
}

type CounselorChildrenResponseDto = {
  childrenList?: CounselorChildResponseDto[] | null
}

class CounselorChildrenApiError extends Error {
  code?: string

  constructor(message: string, code?: string | null) {
    super(message)
    this.name = 'CounselorChildrenApiError'
    this.code = code ?? undefined
  }
}

const AUTH_API_PREFIX = '/auth/api/v1'

const counselorChildrenApiPaths = {
  connectedChildren: `${AUTH_API_PREFIX}/counselors/children`,
}

async function getCounselorChildren(accessToken?: string | null) {
  const response = await apiRequest<BaseResponse<CounselorChildrenResponseDto>>(
    counselorChildrenApiPaths.connectedChildren,
    {
      accessToken,
      errorMessage: '상담 아동 목록을 불러오지 못했습니다.',
    },
  )

  if (response?.code) {
    throw new CounselorChildrenApiError(
      response.message ?? '상담 아동 목록을 불러오지 못했습니다.',
      response.code,
    )
  }

  return response.data?.childrenList ?? []
}

export type { CounselorChildResponseDto, CounselorChildrenResponseDto }
export {
  CounselorChildrenApiError,
  counselorChildrenApiPaths,
  getCounselorChildren,
}
