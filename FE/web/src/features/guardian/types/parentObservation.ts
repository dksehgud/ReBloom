export type ParentObservationCounselorComment = {
  content: string
  relativeTimeLabel: string
}

export type ParentObservationRecord = {
  id: string
  reportDate: string
  recordedAt: string
  date: string
  day: number
  weekday: string
  mood: string
  description: string
  counselorComment?: ParentObservationCounselorComment | null
}

export type ParentObservationListResponse = {
  records: ParentObservationRecord[]
}

export type ParentObservationPreviewItem = ParentObservationRecord

export type ParentObservationPreviewResponse = {
  records: ParentObservationPreviewItem[]
}

export type ParentObservationListItemDto = {
  childrenId?: string
  context: string
  counselorComment?: string | null
  counselorCommentRelativeTime?: string | null
  dayOfWeek?: string
  emotionTag: string
  hasCounselorComment?: boolean
  parentId?: string
  recordedAt?: string
  reportDate: string
  reportId: string
}

export type ParentObservationDailyGroupDto = {
  date: string
  reportList: ParentObservationListItemDto[]
}

export type ParentObservationListResponseDto = {
  code?: string | null
  message?: string | null
  data: {
    dailyReports?: ParentObservationDailyGroupDto[]
    reports?: ParentObservationListItemDto[]
  }
}
