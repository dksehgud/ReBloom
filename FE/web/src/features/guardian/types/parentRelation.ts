export type ParentConnectedChildDto = {
  age?: number | null
  childrenId?: string | null
  connected: boolean
  email?: string | null
  name?: string | null
}

export type ParentConnectedChild = {
  age: number | null
  connected: boolean
  email: string | null
  id: string | null
  name: string | null
}

export type ParentConnectedChildResponseDto = {
  code?: string | null
  data?: ParentConnectedChildDto | null
  message?: string | null
}

export type ParentConnectedCounselorDto = {
  counselorId?: string | null
  email?: string | null
  name?: string | null
  relationStatus?: ParentCounselorRelationStatus | null
}

export type ParentConnectedCounselor = {
  connected: boolean
  email: string | null
  id: string | null
  name: string | null
  relationStatus: ParentCounselorRelationStatus | null
}

export type ParentConnectedCounselorResponseDto = {
  code?: string | null
  data?: ParentConnectedCounselorDto | null
  message?: string | null
}

export type ParentCounselorRelationStatus = 'ACTIVE' | 'PENDING' | 'REJECT'

export type ParentCounselorProfileDto = {
  email?: string | null
  hospitalName?: string | null
  name?: string | null
  userRole?: string | null
}

export type ParentCounselorProfilesDataDto = {
  contents?: ParentCounselorProfileDto[] | null
  count?: number | null
}

export type ParentCounselorProfilesResponseDto = {
  code?: string | null
  data?: ParentCounselorProfilesDataDto | null
  message?: string | null
}

export type ParentCounselorRelationRequestDto = {
  counselorEmail: string
}

export type ParentCounselorRelationResponseDto = {
  code?: string | null
  data?: ParentConnectedCounselorDto | null
  message?: string | null
}
