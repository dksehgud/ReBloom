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
}

export const parentSupportContacts: ParentSupportContact[] = [
  {
    id: 'support-youth',
    label: '청소년 상담전화',
    phoneNumber: '1388',
  },
  {
    id: 'support-suicide',
    label: '자살예방 상담전화',
    phoneNumber: '1393',
  },
]
