import { apiRequest } from '../../../shared/api/client'

export type CounselorCommentResponseDto = {
  commentId: string
  counselorId: string
  reportId: string
  context: string
  createdAt: string
}

type CounselorCommentPathParams = {
  childrenId: string
  reportId: string
}

type CreateCounselorCommentParams = CounselorCommentPathParams & {
  context: string
}

type DeleteCounselorCommentParams = CounselorCommentPathParams & {
  commentId: string
}

const counselorCommentApiPaths = {
  base: ({ childrenId, reportId }: CounselorCommentPathParams) =>
    `/api/v1/children/${childrenId}/reports/${reportId}/comments`,
  detail: ({ childrenId, reportId, commentId }: DeleteCounselorCommentParams) =>
    `/api/v1/children/${childrenId}/reports/${reportId}/comments/${commentId}`,
}

async function getCounselorComment({
  childrenId,
  reportId,
}: CounselorCommentPathParams): Promise<CounselorCommentResponseDto | null> {
  return apiRequest<CounselorCommentResponseDto | null>(
    counselorCommentApiPaths.base({ childrenId, reportId }),
    {
      errorMessage: '상담사 코멘트를 불러오지 못했습니다.',
    },
  )
}

async function createCounselorComment({
  childrenId,
  reportId,
  context,
}: CreateCounselorCommentParams): Promise<CounselorCommentResponseDto> {
  return apiRequest<CounselorCommentResponseDto>(
    counselorCommentApiPaths.base({ childrenId, reportId }),
    {
      method: 'POST',
      body: { context },
      errorMessage: '상담사 코멘트를 작성하지 못했습니다.',
    },
  )
}

async function deleteCounselorComment({
  childrenId,
  reportId,
  commentId,
}: DeleteCounselorCommentParams): Promise<void> {
  await apiRequest<void>(
    counselorCommentApiPaths.detail({ childrenId, reportId, commentId }),
    {
      method: 'DELETE',
      errorMessage: '상담사 코멘트를 삭제하지 못했습니다.',
    },
  )
}

export {
  counselorCommentApiPaths,
  createCounselorComment,
  deleteCounselorComment,
  getCounselorComment,
}
