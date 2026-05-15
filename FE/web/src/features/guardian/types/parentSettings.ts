import type { ParentCounselorRelationStatus } from './parentRelation'

export type ParentSettingsProfile = {
  name: string
  email: string
}

export type ParentSettingsChildLink = {
  name: string
  ageLabel: string
  email: string
}

export type ParentSupportContact = {
  id: string
  label: string
  phoneNumber: string
}

export type ParentCounselorCandidate = {
  name: string
  email: string
  clinicName: string
  phoneNumber: string
  relationStatus?: ParentCounselorRelationStatus | null
}
