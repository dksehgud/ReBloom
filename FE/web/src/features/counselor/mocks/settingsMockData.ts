import type { PasswordForm, ProfileForm, SettingsField } from '../types/settings'

const initialProfileForm: ProfileForm = {
  name: '김상담',
  email: 'counselor@rebloom.com',
  phone: '010-1234-5678',
  hospitalName: 'RE:BLOOM 심리상담센터',
  hospitalAddress: '서울특별시 강남구 테헤란로 123',
  hospitalAddressDetail: '2층 203호',
}

const initialPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
}

const MOCK_CURRENT_PASSWORD = 'rebloom1234'

const profileFields: SettingsField[] = [
  { id: 'name', label: '이름', value: initialProfileForm.name },
  { id: 'email', label: '이메일', type: 'email', value: initialProfileForm.email },
  { id: 'phone', label: '전화번호', type: 'tel', value: initialProfileForm.phone },
  {
    id: 'hospitalName',
    label: '병원/센터 이름',
    value: initialProfileForm.hospitalName,
  },
]

const accountFields: SettingsField[] = [
  { id: 'currentPassword', label: '현재 비밀번호', type: 'password', value: '' },
  { id: 'newPassword', label: '새 비밀번호', type: 'password', value: '' },
  { id: 'newPasswordConfirm', label: '새 비밀번호 확인', type: 'password', value: '' },
]

export {
  MOCK_CURRENT_PASSWORD,
  accountFields,
  initialPasswordForm,
  initialProfileForm,
  profileFields,
}
