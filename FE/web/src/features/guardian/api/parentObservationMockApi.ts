import {
  getObservationPreviewDateRange,
  mapObservationListItemToRecord,
  sortObservationRecords,
} from '../services/parentObservationMapper'
import { parentObservationListMock } from '../mocks/parentObservationList'
import type {
  GetParentObservationPreviewParams,
  ParentObservationDeleteParams,
  ParentObservationDetailParams,
  ParentObservationCommentParams,
  ParentObservationMutationParams,
  ParentObservationQueryParams,
  ParentObservationUpdateParams,
} from '../types/parentObservationApi'
import type {
  ParentObservationListItemDto,
  ParentObservationCounselorCommentDto,
  ParentObservationListResponse,
  ParentObservationPreviewResponse,
  ParentObservationRecord,
} from '../types/parentObservation'

let observationItems: ParentObservationListItemDto[] = [...parentObservationListMock]

function getDatePart(reportDate: string) {
  return reportDate.split('T')[0] ?? reportDate
}

function isWithinDateRange(
  item: ParentObservationListItemDto,
  startDate?: string,
  endDate?: string,
) {
  if (!startDate || !endDate) {
    return true
  }

  const reportDate = getDatePart(item.reportDate)

  return reportDate >= startDate && reportDate <= endDate
}

function getMonthDateRange(year?: number, month?: number) {
  if (typeof year !== 'number' || typeof month !== 'number') {
    return {}
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(
    new Date(year, month, 0).getDate(),
  ).padStart(2, '0')}`

  return {
    endDate,
    startDate,
  }
}

function toRecord(item: ParentObservationListItemDto): ParentObservationRecord {
  return mapObservationListItemToRecord(item)
}

async function getParentObservationList({
  childrenId,
  endDate,
  month,
  startDate,
  year,
}: ParentObservationQueryParams = {}): Promise<ParentObservationListResponse> {
  if (!childrenId) {
    return {
      records: [],
    }
  }

  const monthRange = getMonthDateRange(year, month)
  const rangeStartDate = startDate ?? monthRange.startDate
  const rangeEndDate = endDate ?? monthRange.endDate
  const records = observationItems
    .filter((item) => isWithinDateRange(item, rangeStartDate, rangeEndDate))
    .map(toRecord)

  return {
    records: sortObservationRecords(records),
  }
}

async function getParentObservationDetail({
  reportId,
}: ParentObservationDetailParams): Promise<ParentObservationRecord> {
  const item = observationItems.find((observation) => observation.reportId === reportId)

  if (!item) {
    throw new Error('Mock observation report was not found.')
  }

  return toRecord(item)
}

async function getParentObservationCounselorComment({
  reportId,
}: ParentObservationCommentParams): Promise<ParentObservationCounselorCommentDto | null> {
  const item = observationItems.find((observation) => observation.reportId === reportId)
  const comment = item?.counselorComment

  return typeof comment === 'object' ? comment : null
}

function createMockReportId(reportDate: string) {
  return `mock-observation-${reportDate.replace(/[-:T]/g, '').slice(0, 12)}`
}

async function createParentObservationReport({
  childrenId,
  payload,
}: ParentObservationMutationParams): Promise<void> {
  observationItems = [
    {
      childrenId,
      context: payload.context,
      emotionTag: payload.emotionTag,
      parentId: 'mock-parent',
      reportDate: payload.reportDate,
      reportId: createMockReportId(payload.reportDate),
    },
    ...observationItems,
  ]
}

async function updateParentObservationReport({
  payload,
  reportId,
}: ParentObservationUpdateParams): Promise<void> {
  observationItems = observationItems.map((item) =>
    item.reportId === reportId
      ? {
          ...item,
          context: payload.context,
          emotionTag: payload.emotionTag,
          reportDate: payload.reportDate,
        }
      : item,
  )
}

async function deleteParentObservationReport({
  reportId,
}: ParentObservationDeleteParams): Promise<void> {
  observationItems = observationItems.filter((item) => item.reportId !== reportId)
}

async function getParentObservationPreview({
  childrenId,
  endDate,
  month,
  startDate,
  year,
}: GetParentObservationPreviewParams = {}): Promise<ParentObservationPreviewResponse> {
  const hasExplicitRange = Boolean(startDate && endDate)
  const fallbackRange: Partial<ReturnType<typeof getObservationPreviewDateRange>> =
    hasExplicitRange || (typeof year === 'number' && typeof month === 'number')
      ? {}
      : getObservationPreviewDateRange()
  const response = await getParentObservationList({
    childrenId,
    endDate: endDate ?? fallbackRange.endDate,
    month,
    startDate: startDate ?? fallbackRange.startDate,
    year,
  })

  return {
    records: response.records,
  }
}

const parentObservationMockApi = {
  createParentObservationReport,
  deleteParentObservationReport,
  getParentObservationCounselorComment,
  getParentObservationDetail,
  getParentObservationList,
  getParentObservationPreview,
  updateParentObservationReport,
}

export {
  createParentObservationReport,
  deleteParentObservationReport,
  getParentObservationCounselorComment,
  getParentObservationDetail,
  getParentObservationList,
  getParentObservationPreview,
  parentObservationMockApi,
  updateParentObservationReport,
}
