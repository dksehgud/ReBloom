import type { ExpressionFilter, TimelineDay, TimelineEntry } from '../types/dashboard'

function isTimelineEntryVisible(entry: TimelineEntry, filter: ExpressionFilter) {
  return filter === 'all' || entry.type === filter
}

function getFilteredTimelineDays(days: TimelineDay[], filter: ExpressionFilter) {
  return days
    .map((day) => ({
      ...day,
      entries: day.entries.filter((entry) => isTimelineEntryVisible(entry, filter)),
    }))
    .filter((day) => day.entries.length > 0)
}

function formatCommentCreatedAt(createdAt: string) {
  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) {
    return createdAt
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export { formatCommentCreatedAt, getFilteredTimelineDays }
