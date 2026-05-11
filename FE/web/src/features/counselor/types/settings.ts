import type { ReactNode } from 'react'

type SettingsSection = 'profile' | 'account'

type SettingsField = {
  id: string
  label: string
  type?: string
  value: string
}

type ProfileForm = {
  name: string
  email: string
  phone: string
  hospitalName: string
  hospitalAddress: string
  hospitalAddressDetail: string
}

type PasswordForm = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

type SettingsFeedback = {
  title: string
  message: string
  tone: 'success' | 'error'
} | null

type SettingsInputAction = ReactNode

export type {
  PasswordForm,
  ProfileForm,
  SettingsFeedback,
  SettingsField,
  SettingsInputAction,
  SettingsSection,
}
