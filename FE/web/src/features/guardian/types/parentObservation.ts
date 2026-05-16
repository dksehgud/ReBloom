export type ParentObservationCounselorComment = {
  content: string
  relativeTimeLabel: string
}

export type ParentObservationCounselorCommentDto = {
  commentId: string
  counselorId: string
  reportId: string
  context: string
  createdAt: string
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
  hasCounselorComment: boolean
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
  counselorComment?: string | ParentObservationCounselorCommentDto | null
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
  dailyReports?: ParentObservationDailyGroupDto[]
}

export type ParentObservationBaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

export type ParentObservationDetailResponseDto = ParentObservationListItemDto & {
  counselorComment?: ParentObservationCounselorCommentDto | null
}

export type ParentObservationMutationRequest = {
  context: string
  emotionTag: string
  reportDate: string
}

export type ParentObservationMutationResponseDto = {
  code?: string | null
  message?: string | null
  data?: null
}
