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
  reportId: string
  reportDate: string
  recordedAt?: string
  dayOfWeek: string
  emotionTag: string
  context: string
  counselorComment?: string | null
  counselorCommentRelativeTime?: string | null
}

export type ParentObservationListResponseDto = {
  message: string
  data: {
    reports: ParentObservationListItemDto[]
  }
}
