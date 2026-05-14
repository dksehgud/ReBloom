import { apiRequest } from '../../../shared/api/client'
import type { ObservationRecord } from '../types/dashboard'

type BaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

type CounselorObservationListItemDto = {
  childrenId?: string
  context: string
  dayOfWeek?: string
  emotionTag: string
  hasCounselorComment?: boolean
  parentId?: string
  recordedAt?: string
  reportDate: string
  reportId: string
}

type CounselorObservationDailyGroupDto = {
  date: string
  reportList: CounselorObservationListItemDto[]
}

type CounselorObservationListResponseDto = {
  dailyReports?: CounselorObservationDailyGroupDto[]
}

type GetCounselorObservationRecordsParams = {
  accessToken: string
  childrenId: string
  endDate: string
  startDate: string
}

const REPORT_API_PREFIX = '/report/api/v1'

const counselorObservationApiPaths = {
  list: (childrenId: string) => `${REPORT_API_PREFIX}/children/${childrenId}/reports`,
}

function unwrapApiData<T>(response: BaseResponseDto<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return ((response as BaseResponseDto<T>).data ?? null) as T
  }

  return response as T
}

function getDatePart(reportDate: string) {
  return reportDate.split('T')[0] ?? reportDate
}

function getFormattedDate(reportDate: string) {
  const [, month, day] = getDatePart(reportDate).split('-')

  if (!month || !day) {
    return getDatePart(reportDate)
  }

  return `${month}/${day}`
}

function getWeekdayLabel(reportDate: string, dayOfWeek?: string) {
  const dayOfWeekLabelMap: Record<string, string> = {
    FRI: '금',
    FRIDAY: '금',
    MON: '월',
    MONDAY: '월',
    SAT: '토',
    SATURDAY: '토',
    SUN: '일',
    SUNDAY: '일',
    THU: '목',
    THURSDAY: '목',
    TUE: '화',
    TUESDAY: '화',
    WED: '수',
    WEDNESDAY: '수',
  }

  if (dayOfWeek) {
    return dayOfWeekLabelMap[dayOfWeek] ?? dayOfWeek
  }

  const date = new Date(`${getDatePart(reportDate)}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
}

function flattenDailyReports(groups: CounselorObservationDailyGroupDto[] = []) {
  return groups.flatMap((group) =>
    group.reportList.map((report) => ({
      ...report,
      reportDate: report.reportDate || group.date,
    })),
  )
}

function mapObservationRecord(item: CounselorObservationListItemDto): ObservationRecord {
  return {
    childrenId: item.childrenId ?? '',
    date: getFormattedDate(item.reportDate),
    day: getWeekdayLabel(item.reportDate, item.dayOfWeek),
    hasComment: Boolean(item.hasCounselorComment),
    id: item.reportId,
    mood: item.emotionTag,
    reportId: item.reportId,
    text: item.context,
  }
}

function sortObservationItems(items: CounselorObservationListItemDto[]) {
  return [...items].sort((left, right) =>
    right.reportDate.localeCompare(left.reportDate),
  )
}

async function getCounselorObservationRecords({
  accessToken,
  childrenId,
  endDate,
  startDate,
}: GetCounselorObservationRecordsParams): Promise<ObservationRecord[]> {
  const searchParams = new URLSearchParams({
    endDate,
    startDate,
  })
  const response = await apiRequest<
    | BaseResponseDto<CounselorObservationListResponseDto>
    | CounselorObservationListResponseDto
  >(`${counselorObservationApiPaths.list(childrenId)}?${searchParams.toString()}`, {
    accessToken,
    errorMessage: '상담 아동 관찰 기록을 불러오지 못했습니다.',
  })
  const data = unwrapApiData(response)
  const reports = sortObservationItems(flattenDailyReports(data?.dailyReports))

  return reports.map(mapObservationRecord).map((record) => ({
    ...record,
    childrenId,
  }))
}

export {
  counselorObservationApiPaths,
  getCounselorObservationRecords,
}
export type {
  CounselorObservationDailyGroupDto,
  CounselorObservationListItemDto,
  CounselorObservationListResponseDto,
}
