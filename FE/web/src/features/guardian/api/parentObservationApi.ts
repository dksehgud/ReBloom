import { apiRequest } from '../../../shared/api/client'
import {
  getObservationPreviewDateRange,
  mapObservationListItemToRecord,
  sortObservationRecords,
} from '../services/parentObservationMapper'
import type {
  ParentObservationBaseResponseDto,
  ParentObservationCounselorCommentDto,
  ParentObservationDailyGroupDto,
  ParentObservationDetailResponseDto,
  ParentObservationListResponse,
  ParentObservationListResponseDto,
  ParentObservationMutationResponseDto,
  ParentObservationPreviewResponse,
  ParentObservationRecord,
} from '../types/parentObservation'
import type {
  GetParentObservationPreviewParams,
  ParentObservationDeleteParams,
  ParentObservationDetailParams,
  ParentObservationMutationParams,
  ParentObservationQueryParams,
  ParentObservationUpdateParams,
  ParentObservationCommentParams,
} from '../types/parentObservationApi'

const REPORT_API_PREFIX = '/report/api/v1'

const parentObservationApiPaths = {
  list: (childrenId: string) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/reports`,
  detail: (childrenId: string, reportId: string) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/reports/${reportId}`,
  comment: (childrenId: string, reportId: string) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/reports/${reportId}/comments`,
}

function unwrapApiData<T>(
  response: ParentObservationBaseResponseDto<T> | T,
): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return ((response as ParentObservationBaseResponseDto<T>).data ?? null) as T
  }

  return response as T
}

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateParam(date: Date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join('-')
}

function getMonthDateRange(year: number, month: number) {
  const startDate = `${year}-${padNumber(month)}-01`
  const monthEndDate = new Date(year, month, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  monthEndDate.setHours(0, 0, 0, 0)
  const endDate = formatDateParam(monthEndDate > today ? today : monthEndDate)

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

async function getParentObservationList({
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

async function getParentObservationDetail({
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

async function getParentObservationCounselorComment({
  accessToken,
  childrenId,
  reportId,
}: ParentObservationCommentParams): Promise<ParentObservationCounselorCommentDto | null> {
  const result = await apiRequest<
    | ParentObservationBaseResponseDto<ParentObservationCounselorCommentDto>
    | ParentObservationCounselorCommentDto
    | null
  >(parentObservationApiPaths.comment(childrenId, reportId), {
    accessToken,
    errorMessage: '상담사 코멘트를 불러오지 못했습니다.',
  })

  return unwrapApiData(result)
}

async function createParentObservationReport({
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

async function updateParentObservationReport({
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

async function deleteParentObservationReport({
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

async function getParentObservationPreview({
  accessToken,
  childrenId,
  endDate,
  year,
  month,
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
    records: response.records,
  }
}

const parentObservationApi = {
  createParentObservationReport,
  deleteParentObservationReport,
  getParentObservationCounselorComment,
  getParentObservationDetail,
  getParentObservationList,
  getParentObservationPreview,
  updateParentObservationReport,
}

export type {
  GetParentObservationPreviewParams,
  ParentObservationDeleteParams,
  ParentObservationDetailParams,
  ParentObservationCommentParams,
  ParentObservationMutationParams,
  ParentObservationQueryParams,
  ParentObservationUpdateParams,
}

export {
  createParentObservationReport,
  deleteParentObservationReport,
  getParentObservationCounselorComment,
  getParentObservationDetail,
  getParentObservationList,
  getParentObservationPreview,
  parentObservationApi,
  parentObservationApiPaths,
  updateParentObservationReport,
}
