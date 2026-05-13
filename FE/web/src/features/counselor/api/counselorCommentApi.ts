import { apiRequest } from '../../../shared/api/client'

export type CounselorCommentResponseDto = {
  commentId: string
  counselorId: string
  reportId: string
  context: string
  createdAt: string
}

type CounselorCommentPathParams = {
  accessToken: string
  childrenId: string
  reportId: string
}

type CounselorCommentRouteParams = Omit<
  CounselorCommentPathParams,
  'accessToken'
>

type CreateCounselorCommentParams = CounselorCommentPathParams & {
  context: string
}

type DeleteCounselorCommentParams = CounselorCommentPathParams & {
  commentId: string
}

const REPORT_API_PREFIX = '/report/api/v1'

const counselorCommentApiPaths = {
  base: ({ childrenId, reportId }: CounselorCommentRouteParams) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/reports/${reportId}/comments`,
  detail: ({
    childrenId,
    reportId,
    commentId,
  }: Omit<DeleteCounselorCommentParams, 'accessToken'>) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/reports/${reportId}/comments/${commentId}`,
}

async function getCounselorComment({
  accessToken,
  childrenId,
  reportId,
}: CounselorCommentPathParams): Promise<CounselorCommentResponseDto | null> {
  return apiRequest<CounselorCommentResponseDto | null>(
    counselorCommentApiPaths.base({ childrenId, reportId }),
    {
      accessToken,
      errorMessage: '상담사 코멘트를 불러오지 못했습니다.',
    },
  )
}

async function createCounselorComment({
  accessToken,
  childrenId,
  reportId,
  context,
}: CreateCounselorCommentParams): Promise<CounselorCommentResponseDto> {
  return apiRequest<CounselorCommentResponseDto>(
    counselorCommentApiPaths.base({ childrenId, reportId }),
    {
      accessToken,
      body: { context },
      errorMessage: '상담사 코멘트를 작성하지 못했습니다.',
      method: 'POST',
    },
  )
}

async function deleteCounselorComment({
  accessToken,
  childrenId,
  reportId,
  commentId,
}: DeleteCounselorCommentParams): Promise<void> {
  await apiRequest<void>(
    counselorCommentApiPaths.detail({ childrenId, reportId, commentId }),
    {
      accessToken,
      errorMessage: '상담사 코멘트를 삭제하지 못했습니다.',
      method: 'DELETE',
    },
  )
}

export {
  counselorCommentApiPaths,
  createCounselorComment,
  deleteCounselorComment,
  getCounselorComment,
}
