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

export async function getCounselorComment({
  childrenId,
  reportId,
}: CounselorCommentPathParams): Promise<CounselorCommentResponseDto | null> {
  const response = await fetch(counselorCommentApiPaths.base({ childrenId, reportId }))

  if (!response.ok) {
    throw new Error('상담사 코멘트를 불러오지 못했습니다.')
  }

  const text = await response.text()

  if (!text) {
    return null
  }

  return JSON.parse(text) as CounselorCommentResponseDto | null
}

export async function createCounselorComment({
  childrenId,
  reportId,
  context,
}: CreateCounselorCommentParams): Promise<CounselorCommentResponseDto> {
  const response = await fetch(counselorCommentApiPaths.base({ childrenId, reportId }), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context }),
  })

  if (!response.ok) {
    throw new Error('상담사 코멘트를 작성하지 못했습니다.')
  }

  return (await response.json()) as CounselorCommentResponseDto
}

export async function deleteCounselorComment({
  childrenId,
  reportId,
  commentId,
}: DeleteCounselorCommentParams): Promise<void> {
  const response = await fetch(
    counselorCommentApiPaths.detail({ childrenId, reportId, commentId }),
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    throw new Error('상담사 코멘트를 삭제하지 못했습니다.')
  }
}

export { counselorCommentApiPaths }
