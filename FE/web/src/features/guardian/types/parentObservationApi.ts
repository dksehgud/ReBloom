import type { ParentObservationMutationRequest } from './parentObservation'

export type ParentObservationQueryParams = {
  accessToken?: string | null
  childrenId?: string
  endDate?: string
  month?: number
  startDate?: string
  year?: number
}

export type GetParentObservationPreviewParams = ParentObservationQueryParams

export type ParentObservationDetailParams = {
  accessToken?: string | null
  childrenId: string
  reportId: string
}

export type ParentObservationCommentParams = ParentObservationDetailParams

export type ParentObservationMutationParams = {
  accessToken?: string | null
  childrenId: string
  payload: ParentObservationMutationRequest
}

export type ParentObservationUpdateParams = ParentObservationMutationParams & {
  reportId: string
}

export type ParentObservationDeleteParams = {
  accessToken?: string | null
  childrenId: string
  reportId: string
}
