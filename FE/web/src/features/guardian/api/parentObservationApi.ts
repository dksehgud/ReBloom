import { PARENT_OBSERVATION_PREVIEW_LIMIT } from '../constants/parentObservation'
import { parentObservationPreviewMock } from '../mocks/parentObservationPreview'
import type {
  ParentObservationListItemDto,
  ParentObservationListResponseDto,
  ParentObservationPreviewItem,
  ParentObservationPreviewResponse,
} from '../types/parentObservation'

type GetParentObservationPreviewParams = {
  childrenId?: string
  year?: number
  month?: number
  limit?: number
}

const parentObservationApiPaths = {
  list: (childrenId: string) => `/api/v1/children/${childrenId}/reports`,
  detail: (childrenId: string, reportId: string) =>
    `/api/v1/children/${childrenId}/reports/${reportId}`,
}

const dayOfWeekLabelMap: Record<string, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}

function trimPreviewRecords(records: ParentObservationPreviewItem[], limit: number) {
  return records.slice(0, limit)
}

function formatReportDate(reportDate: string) {
  const [year, month, day] = reportDate.split('-')

  if (!year || !month || !day) {
    return reportDate
  }

  return `${month}/${day}`
}

function mapObservationListItemToPreview(
  item: ParentObservationListItemDto,
): ParentObservationPreviewItem {
  return {
    id: item.reportId,
    date: formatReportDate(item.reportDate),
    weekday: dayOfWeekLabelMap[item.dayOfWeek] ?? item.dayOfWeek,
    mood: item.emotionTag,
    description: item.context,
  }
}

async function getParentObservationPreviewFromMock(
  limit: number,
): Promise<ParentObservationPreviewResponse> {
  return {
    records: trimPreviewRecords(parentObservationPreviewMock, limit),
  }
}

function createObservationListSearchParams({
  year,
  month,
}: Pick<GetParentObservationPreviewParams, 'year' | 'month'>) {
  const searchParams = new URLSearchParams()

  if (typeof year === 'number') {
    searchParams.set('year', String(year))
  }

  if (typeof month === 'number') {
    searchParams.set('month', String(month))
  }

  const query = searchParams.toString()

  return query ? `?${query}` : ''
}

export async function getParentObservationPreview({
  childrenId,
  year,
  month,
  limit = PARENT_OBSERVATION_PREVIEW_LIMIT,
}: GetParentObservationPreviewParams = {}): Promise<ParentObservationPreviewResponse> {
  if (!childrenId) {
    return getParentObservationPreviewFromMock(limit)
  }

  const requestPath = `${parentObservationApiPaths.list(
    childrenId,
  )}${createObservationListSearchParams({
    year,
    month,
  })}`

  const response = await fetch(requestPath)

  if (!response.ok) {
    throw new Error('보호자 관찰 기록 미리보기를 불러오지 못했습니다.')
  }

  const result = (await response.json()) as ParentObservationListResponseDto

  return {
    records: trimPreviewRecords(
      result.data.reports.map(mapObservationListItemToPreview),
      limit,
    ),
  }
}

export { parentObservationApiPaths }
