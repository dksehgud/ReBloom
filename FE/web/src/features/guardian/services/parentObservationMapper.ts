import type {
  ParentObservationListItemDto,
  ParentObservationRecord,
} from '../types/parentObservation'

const OBSERVATION_PREVIEW_LOOKBACK_DAYS = 7

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

function hasCounselorComment(item: ParentObservationListItemDto) {
  return item.hasCounselorComment ?? Boolean(item.counselorComment)
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

function mapObservationListItemToRecord(
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
    hasCounselorComment: hasCounselorComment(item),
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

function getObservationPreviewDateRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(today)
  startDate.setDate(
    startDate.getDate() - (OBSERVATION_PREVIEW_LOOKBACK_DAYS - 1),
  )

  return {
    endDate: formatDateParam(today),
    startDate: formatDateParam(startDate),
  }
}

export {
  getObservationPreviewDateRange,
  mapObservationListItemToRecord,
  sortObservationRecords,
}
