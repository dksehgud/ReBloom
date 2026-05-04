export type ParentObservationPreviewItem = {
  id: string
  date: string
  weekday: string
  mood: string
  description: string
}

export type ParentObservationPreviewResponse = {
  records: ParentObservationPreviewItem[]
}

export type ParentObservationListItemDto = {
  reportId: string
  reportDate: string
  dayOfWeek: string
  emotionTag: string
  context: string
}

export type ParentObservationListResponseDto = {
  message: string
  data: {
    reports: ParentObservationListItemDto[]
  }
}
