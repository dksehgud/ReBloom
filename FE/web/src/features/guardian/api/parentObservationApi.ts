import { apiRequest } from '../../../shared/api/client'
import { PARENT_OBSERVATION_PREVIEW_LIMIT } from '../constants/parentObservation'
import { parentObservationListMock } from '../mocks/parentObservationList'
import type {
  ParentObservationDailyGroupDto,
  ParentObservationDetailResponseDto,
  ParentObservationListItemDto,
  ParentObservationListResponse,
  ParentObservationListResponseDto,
  ParentObservationMutationRequest,
  ParentObservationMutationResponseDto,
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

type ParentObservationDetailParams = {
  accessToken: string
  childrenId: string
  reportId: string
}

type ParentObservationMutationParams = {
  accessToken: string
  childrenId: string
  payload: ParentObservationMutationRequest
}

type ParentObservationUpdateParams = ParentObservationMutationParams & {
  reportId: string
}

type ParentObservationDeleteParams = {
  accessToken: string
  childrenId: string
  reportId: string
}

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

function formatRelativeTimeLabel(createdAt?: string | null) {
  if (!createdAt) {
    return '상담사 코멘트'
  }

  const createdAtTime = new Date(createdAt).getTime()

  if (Number.isNaN(createdAtTime)) {
    return '상담사 코멘트'
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAtTime) / 1000 / 60),
  )

  if (diffMinutes < 1) {
    return '방금 전'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}시간 전`
  }

  return `${Math.floor(diffHours / 24)}일 전`
}

function mapCounselorComment(item: ParentObservationListItemDto) {
  if (!item.counselorComment) {
    return null
  }

  if (typeof item.counselorComment === 'string') {
    return {
      content: item.counselorComment,
      relativeTimeLabel:
        item.counselorCommentRelativeTime ?? '상담사 코멘트',
    }
  }

  return {
    content: item.counselorComment.context,
    relativeTimeLabel: formatRelativeTimeLabel(item.counselorComment.createdAt),
  }
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
    counselorComment: mapCounselorComment(item),
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

  const result = await apiRequest<ParentObservationListResponseDto>(requestPath, {
    accessToken,
    errorMessage: '보호자 관찰 기록 목록을 불러오지 못했습니다.',
  })

  const reports = flattenDailyReportGroups(result.dailyReports)

  return {
    records: sortObservationRecords(reports.map(mapObservationListItemToRecord)),
  }
}

export async function getParentObservationDetail({
  accessToken,
  childrenId,
  reportId,
}: ParentObservationDetailParams): Promise<ParentObservationRecord> {
  const result = await apiRequest<ParentObservationDetailResponseDto>(
    parentObservationApiPaths.detail(childrenId, reportId),
    {
      accessToken,
      errorMessage: '보호자 관찰 기록을 불러오지 못했습니다.',
    },
  )

  return mapObservationListItemToRecord(result)
}

export async function createParentObservationReport({
  accessToken,
  childrenId,
  payload,
}: ParentObservationMutationParams): Promise<void> {
  const result = await apiRequest<ParentObservationMutationResponseDto>(
    parentObservationApiPaths.list(childrenId),
    {
      accessToken,
      body: payload,
      errorMessage: '보호자 관찰 기록을 작성하지 못했습니다.',
      method: 'POST',
    },
  )

  if (result?.code) {
    throw new Error(result.message ?? '보호자 관찰 기록을 작성하지 못했습니다.')
  }
}

export async function updateParentObservationReport({
  accessToken,
  childrenId,
  reportId,
  payload,
}: ParentObservationUpdateParams): Promise<void> {
  const result = await apiRequest<ParentObservationMutationResponseDto>(
    parentObservationApiPaths.detail(childrenId, reportId),
    {
      accessToken,
      body: payload,
      errorMessage: '보호자 관찰 기록을 수정하지 못했습니다.',
      method: 'PATCH',
    },
  )

  if (result?.code) {
    throw new Error(result.message ?? '보호자 관찰 기록을 수정하지 못했습니다.')
  }
}

export async function deleteParentObservationReport({
  accessToken,
  childrenId,
  reportId,
}: ParentObservationDeleteParams): Promise<void> {
  const result = await apiRequest<ParentObservationMutationResponseDto>(
    parentObservationApiPaths.detail(childrenId, reportId),
    {
      accessToken,
      errorMessage: '보호자 관찰 기록을 삭제하지 못했습니다.',
      method: 'DELETE',
    },
  )

  if (result?.code) {
    throw new Error(result.message ?? '보호자 관찰 기록을 삭제하지 못했습니다.')
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
