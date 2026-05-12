import { apiRequest } from '../../../shared/api/client'
import { PARENT_OBSERVATION_PREVIEW_LIMIT } from '../constants/parentObservation'
import { parentObservationListMock } from '../mocks/parentObservationList'
import type {
  ParentObservationListItemDto,
  ParentObservationListResponse,
  ParentObservationListResponseDto,
  ParentObservationPreviewResponse,
  ParentObservationRecord,
} from '../types/parentObservation'

type ParentObservationQueryParams = {
  childrenId?: string
  year?: number
  month?: number
}

type GetParentObservationPreviewParams = ParentObservationQueryParams & {
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

function formatReportDate(reportDate: string) {
  const [year, month, day] = reportDate.split('-')

  if (!year || !month || !day) {
    return reportDate
  }

  return `${month}/${day}`
}

function parseReportDay(reportDate: string) {
  const [, , day] = reportDate.split('-')
  return day ? Number(day) : 0
}

function mapObservationListItemToRecord(item: ParentObservationListItemDto): ParentObservationRecord {
  return {
    id: item.reportId,
    reportDate: item.reportDate,
    recordedAt: item.recordedAt ?? '00:00',
    date: formatReportDate(item.reportDate),
    day: parseReportDay(item.reportDate),
    weekday: dayOfWeekLabelMap[item.dayOfWeek] ?? item.dayOfWeek,
    mood: item.emotionTag,
    description: item.context,
    counselorComment:
      item.counselorComment && item.counselorCommentRelativeTime
        ? {
            content: item.counselorComment,
            relativeTimeLabel: item.counselorCommentRelativeTime,
          }
        : null,
  }
}

function sortObservationRecords(records: ParentObservationRecord[]) {
  return [...records].sort((left, right) => {
    const leftKey = `${left.reportDate}T${left.recordedAt}`
    const rightKey = `${right.reportDate}T${right.recordedAt}`

    return rightKey.localeCompare(leftKey)
  })
}

function createObservationListSearchParams({ year, month }: Pick<ParentObservationQueryParams, 'year' | 'month'>) {
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

function filterMockRecords(records: ParentObservationListItemDto[], year?: number, month?: number) {
  return records.filter((record) => {
    const [recordYear, recordMonth] = record.reportDate.split('-').map((value) => Number(value))

    if (typeof year === 'number' && recordYear !== year) {
      return false
    }

    if (typeof month === 'number' && recordMonth !== month) {
      return false
    }

    return true
  })
}

async function getParentObservationListFromMock({
  year,
  month,
}: ParentObservationQueryParams = {}): Promise<ParentObservationListResponse> {
  return {
    records: sortObservationRecords(
      filterMockRecords(parentObservationListMock, year, month).map(
        mapObservationListItemToRecord,
      ),
    ),
  }
}

export async function getParentObservationList({
  childrenId,
  year,
  month,
}: ParentObservationQueryParams = {}): Promise<ParentObservationListResponse> {
  if (!childrenId) {
    return getParentObservationListFromMock({ year, month })
  }

  const requestPath = `${parentObservationApiPaths.list(
    childrenId,
  )}${createObservationListSearchParams({
    year,
    month,
  })}`

  const result = await apiRequest<ParentObservationListResponseDto>(requestPath, {
    errorMessage: '보호자 관찰 기록 목록을 불러오지 못했습니다.',
  })

  return {
    records: sortObservationRecords(
      result.data.reports.map(mapObservationListItemToRecord),
    ),
  }
}

export async function getParentObservationPreview({
  childrenId,
  year,
  month,
  limit = PARENT_OBSERVATION_PREVIEW_LIMIT,
}: GetParentObservationPreviewParams = {}): Promise<ParentObservationPreviewResponse> {
  const response = await getParentObservationList({
    childrenId,
    year,
    month,
  })

  return {
    records: response.records.slice(0, limit),
  }
}

export { parentObservationApiPaths }
