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

export const mockParentProfile: ParentSettingsProfile = {
  name: '이승형',
  email: 'test@naver.com',
}

export const mockLinkedChild: ParentSettingsChildLink = {
  name: '유지민',
  ageLabel: '15세',
  email: 'child@naver.com',
}

export const parentSupportContacts: ParentSupportContact[] = [
  {
    id: 'support-youth',
    label: '청소년 상담전화',
    phoneNumber: '010-1234-5678',
  },
  {
    id: 'support-suicide',
    label: '자살예방 상담전화',
    phoneNumber: '010-1234-5678',
  },
]
