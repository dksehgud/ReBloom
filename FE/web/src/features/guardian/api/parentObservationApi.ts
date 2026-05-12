import { PARENT_OBSERVATION_PREVIEW_LIMIT } from '../constants/parentObservation'
import { parentObservationListMock } from '../mocks/parentObservationList'
import type {
  ParentObservationDailyGroupDto,
  ParentObservationListItemDto,
  ParentObservationListResponse,
  ParentObservationListResponseDto,
  ParentObservationPreviewResponse,
  ParentObservationRecord,
} from '../types/parentObservation'

type ParentObservationQueryParams = {
  accessToken?: string | null
  childrenId?: string
  year?: number
  month?: number
}

type GetParentObservationPreviewParams = ParentObservationQueryParams & {
  limit?: number
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ??
  (import.meta.env.DEV ? 'http://localhost:8080' : '')

const parentObservationApiPaths = {
  list: (childrenId: string) => `/api/v1/children/${childrenId}/reports`,
  detail: (childrenId: string, reportId: string) =>
    `/api/v1/children/${childrenId}/reports/${reportId}`,
}

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

const dayOfWeekLabelMap: Record<string, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function getDatePart(reportDate: string) {
  return reportDate.split('T')[0] ?? reportDate
}

function getRecordedAt(item: ParentObservationListItemDto) {
  if (item.recordedAt) {
    return item.recordedAt
  }

  const timePart = item.reportDate.split('T')[1]
  return timePart ? timePart.slice(0, 5) : '00:00'
}

function formatReportDate(reportDate: string) {
  const datePart = getDatePart(reportDate)
  const [, month, day] = datePart.split('-')

  if (!month || !day) {
    return datePart
  }

  return `${month}/${day}`
}

function parseReportDay(reportDate: string) {
  const datePart = getDatePart(reportDate)
  const [, , day] = datePart.split('-')
  return day ? Number(day) : 0
}

function getWeekdayLabel(item: ParentObservationListItemDto) {
  if (item.dayOfWeek) {
    return dayOfWeekLabelMap[item.dayOfWeek] ?? item.dayOfWeek
  }

  const date = new Date(`${getDatePart(item.reportDate)}T00:00:00`)
  return weekdayLabels[date.getDay()] ?? ''
}

function mapObservationListItemToRecord(item: ParentObservationListItemDto): ParentObservationRecord {
  return {
    id: item.reportId,
    reportDate: getDatePart(item.reportDate),
    recordedAt: getRecordedAt(item),
    date: formatReportDate(item.reportDate),
    day: parseReportDay(item.reportDate),
    weekday: getWeekdayLabel(item),
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

function getMonthDateRange(year: number, month: number) {
  const startDate = `${year}-${padNumber(month)}-01`
  const endDate = `${year}-${padNumber(month)}-${padNumber(new Date(year, month, 0).getDate())}`

  return {
    endDate,
    startDate,
  }
}

function createObservationListSearchParams({ year, month }: Pick<ParentObservationQueryParams, 'year' | 'month'>) {
  const searchParams = new URLSearchParams()

  if (typeof year === 'number' && typeof month === 'number') {
    const { startDate, endDate } = getMonthDateRange(year, month)
    searchParams.set('startDate', startDate)
    searchParams.set('endDate', endDate)
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function filterMockRecords(records: ParentObservationListItemDto[], year?: number, month?: number) {
  return records.filter((record) => {
    const [recordYear, recordMonth] = getDatePart(record.reportDate)
      .split('-')
      .map((value) => Number(value))

    if (typeof year === 'number' && recordYear !== year) {
      return false
    }

    if (typeof month === 'number' && recordMonth !== month) {
      return false
    }

    return true
  })
}

function flattenDailyReportGroups(groups: ParentObservationDailyGroupDto[] = []) {
  return groups.flatMap((group) =>
    group.reportList.map((report) => ({
      ...report,
      reportDate: report.reportDate || group.date,
    })),
  )
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
  accessToken,
  childrenId,
  year,
  month,
}: ParentObservationQueryParams = {}): Promise<ParentObservationListResponse> {
  if (!childrenId || !accessToken) {
    return getParentObservationListFromMock({ year, month })
  }

  const requestPath = `${parentObservationApiPaths.list(
    childrenId,
  )}${createObservationListSearchParams({
    year,
    month,
  })}`

  const response = await fetch(`${API_BASE_URL}${requestPath}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const result = (await response.json().catch(() => null)) as ParentObservationListResponseDto | null

  if (!response.ok || result?.code) {
    throw new Error(result?.message ?? '보호자 관찰 기록 목록을 불러오지 못했습니다.')
  }

  const reports =
    result?.data.reports ?? flattenDailyReportGroups(result?.data.dailyReports)

  return {
    records: sortObservationRecords(reports.map(mapObservationListItemToRecord)),
  }
}

export async function getParentObservationPreview({
  accessToken,
  childrenId,
  year,
  month,
  limit = PARENT_OBSERVATION_PREVIEW_LIMIT,
}: GetParentObservationPreviewParams = {}): Promise<ParentObservationPreviewResponse> {
  const response = await getParentObservationList({
    accessToken,
    childrenId,
    year,
    month,
  })

  return {
    records: response.records.slice(0, limit),
  }
}

export { parentObservationApiPaths }
