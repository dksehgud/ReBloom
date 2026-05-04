import { parentObservationPreviewMock } from '../mocks/parentObservationPreview'
import type {
  ParentObservationPreviewItem,
  ParentObservationPreviewResponse,
} from '../types/parentObservation'

type GetParentObservationPreviewParams = {
  limit?: number
}

const parentObservationApiPaths = {
  // TODO: Notion API 명세 접근 가능해지면 실제 보호자 관찰 기록 preview path로 교체
  preview: null as string | null,
}

function trimPreviewRecords(records: ParentObservationPreviewItem[], limit: number) {
  return records.slice(0, limit)
}

async function getParentObservationPreviewFromMock(
  limit: number,
): Promise<ParentObservationPreviewResponse> {
  return {
    records: trimPreviewRecords(parentObservationPreviewMock, limit),
  }
}

export async function getParentObservationPreview({
  limit = 3,
}: GetParentObservationPreviewParams = {}): Promise<ParentObservationPreviewResponse> {
  if (!parentObservationApiPaths.preview) {
    return getParentObservationPreviewFromMock(limit)
  }

  const response = await fetch(`${parentObservationApiPaths.preview}?limit=${limit}`)

  if (!response.ok) {
    throw new Error('보호자 관찰 기록 미리보기를 불러오지 못했습니다.')
  }

  return response.json() as Promise<ParentObservationPreviewResponse>
}

export { parentObservationApiPaths }
