import type {
  ParentCounselorCandidate,
  ParentSettingsChildLink,
  ParentSettingsProfile,
} from '../types/parentSettings'

export const mockParentProfile: ParentSettingsProfile = {
  name: '이승형',
  email: 'test@naver.com',
}

export const mockLinkedChild: ParentSettingsChildLink = {
  name: '유지민',
  ageLabel: '15세',
  email: 'child@naver.com',
}

export const mockCounselorCandidate: ParentCounselorCandidate = {
  name: '안도형 상담사',
  email: 'clinic@clinic.com',
  clinicName: '유주경 의원',
  phoneNumber: '010-1234-5678',
}
