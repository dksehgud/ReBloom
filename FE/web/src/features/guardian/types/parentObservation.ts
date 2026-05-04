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
