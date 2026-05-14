import { apiRequest } from '../../../shared/api/client'
import { PARENT_OBSERVATION_PREVIEW_LIMIT } from '../constants/parentObservation'
import type {
  ParentObservationBaseResponseDto,
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
  endDate?: string
  month?: number
  startDate?: string
  year?: number
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

const REPORT_API_PREFIX = '/report/api/v1'
const OBSERVATION_PREVIEW_LOOKBACK_MONTHS = 12

const parentObservationApiPaths = {
  list: (childrenId: string) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/reports`,
  detail: (childrenId: string, reportId: string) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/reports/${reportId}`,
}

function unwrapApiData<T>(
  response: ParentObservationBaseResponseDto<T> | T,
): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return ((response as ParentObservationBaseResponseDto<T>).data ?? null) as T
  }

  return response as T
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

function formatDateParam(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`
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
      relativeTimeLabel: item.counselorCommentRelativeTime ?? '상담사 코멘트',
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

export function mapObservationListItemToRecord(
  item: ParentObservationListItemDto,
): ParentObservationRecord {
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

export function sortObservationRecords(records: ParentObservationRecord[]) {
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

function createObservationListSearchParams({
  endDate,
  month,
  startDate,
  year,
}: Pick<
  ParentObservationQueryParams,
  'endDate' | 'month' | 'startDate' | 'year'
>) {
  const searchParams = new URLSearchParams()

  if (startDate && endDate) {
    searchParams.set('startDate', startDate)
    searchParams.set('endDate', endDate)
  } else if (typeof year === 'number' && typeof month === 'number') {
    const { startDate, endDate } = getMonthDateRange(year, month)
    searchParams.set('startDate', startDate)
    searchParams.set('endDate', endDate)
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function getObservationPreviewDateRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  startDate.setMonth(startDate.getMonth() - OBSERVATION_PREVIEW_LOOKBACK_MONTHS)

  return {
    endDate: formatDateParam(today),
    startDate: formatDateParam(startDate),
  }
}

function flattenDailyReportGroups(
  groups: ParentObservationDailyGroupDto[] = [],
) {
  return groups.flatMap((group) =>
    group.reportList.map((report) => ({
      ...report,
      reportDate: report.reportDate || group.date,
    })),
  )
}

export async function getParentObservationList({
  accessToken,
  childrenId,
  endDate,
  year,
  month,
  startDate,
}: ParentObservationQueryParams = {}): Promise<ParentObservationListResponse> {
  if (!childrenId || !accessToken) {
    return {
      records: [],
    }
  }

  const requestPath = `${parentObservationApiPaths.list(
    childrenId,
  )}${createObservationListSearchParams({
    endDate,
    year,
    month,
    startDate,
  })}`

  const result = await apiRequest<
    | ParentObservationBaseResponseDto<ParentObservationListResponseDto>
    | ParentObservationListResponseDto
  >(requestPath, {
    accessToken,
    errorMessage: '보호자 관찰 기록 목록을 불러오지 못했습니다.',
  })

  const data = unwrapApiData(result)
  const reports = flattenDailyReportGroups(data?.dailyReports)

  return {
    records: sortObservationRecords(
      reports.map(mapObservationListItemToRecord),
    ),
  }
}

export async function getParentObservationDetail({
  accessToken,
  childrenId,
  reportId,
}: ParentObservationDetailParams): Promise<ParentObservationRecord> {
  const result = await apiRequest<
    | ParentObservationBaseResponseDto<ParentObservationDetailResponseDto>
    | ParentObservationDetailResponseDto
  >(parentObservationApiPaths.detail(childrenId, reportId), {
    accessToken,
    errorMessage: '보호자 관찰 기록을 불러오지 못했습니다.',
  })

  return mapObservationListItemToRecord(unwrapApiData(result))
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
  endDate,
  year,
  month,
  limit = PARENT_OBSERVATION_PREVIEW_LIMIT,
  startDate,
}: GetParentObservationPreviewParams = {}): Promise<ParentObservationPreviewResponse> {
  const hasMonthRange = typeof year === 'number' && typeof month === 'number'
  const fallbackRange =
    startDate && endDate
      ? { endDate, startDate }
      : hasMonthRange
        ? null
        : getObservationPreviewDateRange()

  const response = await getParentObservationList({
    accessToken,
    childrenId,
    endDate: fallbackRange?.endDate,
    startDate: fallbackRange?.startDate,
    year,
    month,
  })

  return {
    records: response.records.slice(0, limit),
  }
}

export { parentObservationApiPaths }
