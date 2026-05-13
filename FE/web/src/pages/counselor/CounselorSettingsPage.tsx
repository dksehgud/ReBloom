import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiLogOut } from 'react-icons/fi'

import { authApi, type UserInfoResponse } from '../../features/auth/api/authApi'
import { useAppSessionStore } from '../../features/auth/store/useAppSessionStore'
import SettingsFeedbackModal from '../../features/counselor/components/settings/SettingsFeedbackModal'
import SettingsInput from '../../features/counselor/components/settings/SettingsInput'
import { useCounselorMockMode } from '../../features/counselor/hooks/useCounselorMockMode'
import {
  MOCK_CURRENT_PASSWORD,
  accountFields,
  initialPasswordForm,
  initialProfileForm,
  profileFields,
} from '../../features/counselor/mocks/settingsMockData'
import type {
  PasswordForm,
  ProfileForm,
  SettingsFeedback,
  SettingsSection,
} from '../../features/counselor/types/settings'
import {
  isValidNewPassword,
  normalizeFormValue,
} from '../../features/counselor/utils/settingsValidation'
import { ApiError } from '../../shared/api/client'
import { openDaumPostcodePopup } from '../../shared/utils/daumPostcode'
import { clearNativeAccessToken } from '../../shared/utils/nativeTokenBridge'

const EMAIL_READONLY_HELP = '이메일은 로그인 아이디로 사용되어 수정할 수 없습니다.'
const HOSPITAL_ADDRESS_DETAIL_HELP =
  '현재 설정 API가 상담사 상세주소 조회/수정을 지원하지 않아 실API 저장 대상에서 제외됩니다.'
const PROFILE_UPDATE_FIELDS: Array<keyof ProfileForm> = [
  'name',
  'phone',
  'hospitalName',
  'hospitalAddress',
  'hospitalAddressDetail',
]

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const data = error.data

    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message

      if (typeof message === 'string' && message.trim().length > 0) {
        return message
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function toProfileForm(user: UserInfoResponse): ProfileForm {
  return {
    email: user.email,
    hospitalAddress: user.hospitalAddress ?? '',
    hospitalAddressDetail: user.hospitalAddressDetail ?? '',
    hospitalName: user.hospitalName ?? '',
    name: user.name,
    phone: user.phone ?? '',
  }
}

function buildProfilePayload(profileForm: ProfileForm) {
  return {
    hospitalAddress: normalizeFormValue(profileForm.hospitalAddress),
    hospitalName: normalizeFormValue(profileForm.hospitalName),
    name: normalizeFormValue(profileForm.name),
    phone: normalizeFormValue(profileForm.phone),
  }
}

function CounselorSettingsPage() {
  const navigate = useNavigate()
  const isMockMode = useCounselorMockMode()
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const clearSession = useAppSessionStore((state) => state.clearSession)
  const currentUser = useAppSessionStore((state) => state.currentUser)
  const setCurrentUser = useAppSessionStore((state) => state.setCurrentUser)
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [savedProfileForm, setSavedProfileForm] =
    useState<ProfileForm>(initialProfileForm)
  const [profileForm, setProfileForm] = useState<ProfileForm>(initialProfileForm)
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm)
  const [hospitalAddressError, setHospitalAddressError] = useState<string>()
  const [isLoadingAddressSearch, setIsLoadingAddressSearch] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<string>()
  const [feedback, setFeedback] = useState<SettingsFeedback>(null)
  const isProfileSection = activeSection === 'profile'

  useEffect(() => {
    let isActive = true

    const timeoutId = window.setTimeout(() => {
      if (isMockMode) {
        setProfileForm(initialProfileForm)
        setSavedProfileForm(initialProfileForm)
        setProfileError(undefined)
        setIsProfileLoading(false)
        return
      }

      if (!accessToken) {
        setProfileError('로그인 후 상담사 설정을 사용할 수 있습니다.')
        setIsProfileLoading(false)
        return
      }

      const applyProfile = (user: UserInfoResponse) => {
        const nextProfileForm = toProfileForm(user)

        setProfileForm(nextProfileForm)
        setSavedProfileForm(nextProfileForm)
        setProfileError(undefined)
      }

      if (currentUser?.role === 'COUNSELOR') {
        applyProfile(currentUser)
        setIsProfileLoading(false)
        return
      }

      setIsProfileLoading(true)

      void authApi
        .getMyInfo(accessToken)
        .then((user) => {
          if (!isActive) {
            return
          }

          if (user.role !== 'COUNSELOR') {
            throw new Error('상담사 계정으로 로그인 후 이용해 주세요.')
          }

          setCurrentUser(user)
          applyProfile(user)
        })
        .catch((error) => {
          if (!isActive) {
            return
          }

          setProfileError(
            getApiErrorMessage(
              error,
              '상담사 프로필 정보를 불러오지 못했습니다.',
            ),
          )
        })
        .finally(() => {
          if (isActive) {
            setIsProfileLoading(false)
          }
        })
    }, 0)

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [accessToken, currentUser, isMockMode, setCurrentUser])

  const updateProfileField = (field: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  const updatePasswordField = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
  }

  const isPasswordFormFilled = Object.values(passwordForm).every(
    (value) => value.trim().length > 0,
  )

  const requiredProfileValues = [
    profileForm.name,
    profileForm.email,
    profileForm.phone,
    profileForm.hospitalName,
    profileForm.hospitalAddress,
  ]
  const isProfileChanged = PROFILE_UPDATE_FIELDS.some(
    (field) =>
      normalizeFormValue(profileForm[field]) !==
      normalizeFormValue(savedProfileForm[field]),
  )
  const isProfileSavable =
    !isProfileLoading &&
    !isProfileSubmitting &&
    isProfileChanged &&
    requiredProfileValues.every((value) => normalizeFormValue(value).length > 0)

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isProfileSubmitting) {
      return
    }

    if (requiredProfileValues.some((value) => value.trim().length === 0)) {
      setFeedback({
        title: '필수 정보를 확인해 주세요',
        message:
          '이름, 이메일, 전화번호, 병원/센터 이름, 주소는 모두 입력해야 저장할 수 있어요.',
        tone: 'error',
      })
      return
    }

    if (!isProfileChanged) {
      return
    }

    if (!isMockMode && !accessToken) {
      setFeedback({
        title: '로그인이 필요합니다',
        message: '다시 로그인한 뒤 프로필 정보를 수정해 주세요.',
        tone: 'error',
      })
      return
    }

    try {
      setIsProfileSubmitting(true)

      if (isMockMode) {
        const nextProfileForm = {
          ...profileForm,
          email: savedProfileForm.email,
        }

        setProfileForm(nextProfileForm)
        setSavedProfileForm(nextProfileForm)
      } else {
        const nextUser = await authApi.updateMyInfo(
          buildProfilePayload(profileForm),
          accessToken,
        )
        const nextProfileForm = toProfileForm(nextUser)

        setCurrentUser(nextUser)
        setProfileForm(nextProfileForm)
        setSavedProfileForm(nextProfileForm)
      }

      setFeedback({
        title: '프로필 정보가 저장되었습니다',
        message: '변경한 상담사 프로필 정보가 반영되었습니다.',
        tone: 'success',
      })
    } catch (error) {
      setFeedback({
        title: '프로필 정보를 저장하지 못했습니다',
        message: getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'),
        tone: 'error',
      })
    } finally {
      setIsProfileSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isPasswordSubmitting) {
      return
    }

    if (!isPasswordFormFilled) {
      return
    }

    if (!isValidNewPassword(passwordForm.newPassword)) {
      setFeedback({
        title: '새 비밀번호 요건을 확인해 주세요',
        message:
          '새 비밀번호는 8~20자이며 영문과 숫자를 반드시 포함해야 해요. 특수문자는 사용할 수 있습니다.',
        tone: 'error',
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setFeedback({
        title: '새 비밀번호가 일치하지 않습니다',
        message: '새 비밀번호와 새 비밀번호 확인 값을 다시 확인해 주세요.',
        tone: 'error',
      })
      return
    }

    if (isMockMode && passwordForm.currentPassword !== MOCK_CURRENT_PASSWORD) {
      setFeedback({
        title: '현재 비밀번호가 일치하지 않습니다',
        message: '입력한 현재 비밀번호를 다시 확인해 주세요.',
        tone: 'error',
      })
      return
    }

    if (!isMockMode && !accessToken) {
      setFeedback({
        title: '로그인이 필요합니다',
        message: '다시 로그인한 뒤 비밀번호를 변경해 주세요.',
        tone: 'error',
      })
      return
    }

    try {
      setIsPasswordSubmitting(true)

      if (!isMockMode) {
        await authApi.changePassword(passwordForm, accessToken)
      }

      setPasswordForm(initialPasswordForm)
      setFeedback({
        title: '비밀번호가 변경되었습니다',
        message: '다음 로그인부터 새 비밀번호를 사용할 수 있어요.',
        tone: 'success',
      })
    } catch (error) {
      setFeedback({
        title: '비밀번호를 변경하지 못했습니다',
        message: getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'),
        tone: 'error',
      })
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  const handleSearchHospitalAddress = async () => {
    try {
      setIsLoadingAddressSearch(true)
      setHospitalAddressError(undefined)

      await openDaumPostcodePopup(
        (data) => {
          const nextAddress = data.roadAddress || data.address || data.jibunAddress
          updateProfileField('hospitalAddress', nextAddress)
          setHospitalAddressError(undefined)
        },
        '병원 주소 검색',
      )
    } catch {
      setHospitalAddressError(
        '주소 검색창을 여는 데 실패했어요. 다시 시도해 주세요.',
      )
    } finally {
      setIsLoadingAddressSearch(false)
    }
  }

  const handleLogout = () => {
    clearSession()
    clearNativeAccessToken()
    navigate('/counselor/login', { replace: true })
  }

  return (
    <main className="counselor-settings-page">
      <aside className="counselor-settings-sidebar">
        <header className="counselor-settings-sidebar__header">
          <button type="button" onClick={() => navigate('/counselor/dashboard')}>
            <FiChevronLeft aria-hidden="true" />
            <span>대시보드</span>
          </button>
        </header>

        <section className="counselor-settings-sidebar__body">
          <h2>설정</h2>
          <nav className="counselor-settings-sidebar__nav" aria-label="상담사 설정">
            <button
              type="button"
              className={isProfileSection ? 'is-active' : undefined}
              onClick={() => setActiveSection('profile')}
            >
              프로필 정보
            </button>
            <button
              type="button"
              className={!isProfileSection ? 'is-active' : undefined}
              onClick={() => setActiveSection('account')}
            >
              비밀번호 변경
            </button>
          </nav>
        </section>

        <footer className="counselor-settings-sidebar__footer">
          <button type="button" onClick={handleLogout}>
            <FiLogOut aria-hidden="true" />
            <span>로그아웃</span>
          </button>
        </footer>
      </aside>

      <section className="counselor-settings-main">
        <div className="counselor-settings-content">
          <h1>{isProfileSection ? '프로필 정보' : '비밀번호 변경'}</h1>

          {isProfileSection ? (
            <form
              className="counselor-settings-card"
              onSubmit={handleProfileSubmit}
            >
              {isProfileLoading ? (
                <p className="counselor-settings-status">
                  프로필 정보를 불러오는 중입니다.
                </p>
              ) : null}
              {profileError ? (
                <p className="counselor-settings-status is-error">{profileError}</p>
              ) : null}
              {profileFields.map((field) => (
                <SettingsInput
                  field={field}
                  help={field.id === 'email' ? EMAIL_READONLY_HELP : undefined}
                  key={field.id}
                  readOnly={
                    field.id === 'email' || isProfileLoading || isProfileSubmitting
                  }
                  value={profileForm[field.id as keyof ProfileForm]}
                  onChange={(value) =>
                    updateProfileField(field.id as keyof ProfileForm, value)
                  }
                />
              ))}
              <SettingsInput
                field={{
                  id: 'hospitalAddress',
                  label: '주소',
                  value: profileForm.hospitalAddress,
                }}
                value={profileForm.hospitalAddress}
                readOnly
                action={
                  <button
                    type="button"
                    className="counselor-settings-address-button"
                    disabled={
                      isLoadingAddressSearch ||
                      isProfileLoading ||
                      isProfileSubmitting
                    }
                    onClick={handleSearchHospitalAddress}
                  >
                    {isLoadingAddressSearch ? '불러오는 중' : '주소 검색'}
                  </button>
                }
                error={hospitalAddressError}
                help="병원 기본 주소는 주소 검색으로 입력해 주세요."
              />
              <SettingsInput
                field={{
                  id: 'hospitalAddressDetail',
                  label: '상세주소',
                  value: profileForm.hospitalAddressDetail,
                }}
                help={!isMockMode ? HOSPITAL_ADDRESS_DETAIL_HELP : undefined}
                readOnly={!isMockMode || isProfileLoading || isProfileSubmitting}
                value={profileForm.hospitalAddressDetail}
                onChange={(value) => updateProfileField('hospitalAddressDetail', value)}
              />
              <div className="counselor-settings-actions">
                <button type="submit" disabled={!isProfileSavable}>
                  {isProfileSubmitting ? '저장 중' : '저장하기'}
                </button>
              </div>
            </form>
          ) : (
            <form
              className="counselor-settings-card counselor-settings-card--compact"
              onSubmit={handlePasswordSubmit}
            >
              {accountFields.map((field) => (
                <SettingsInput
                  field={field}
                  disabled={isPasswordSubmitting}
                  key={field.id}
                  value={passwordForm[field.id as keyof PasswordForm]}
                  onChange={(value) =>
                    updatePasswordField(field.id as keyof PasswordForm, value)
                  }
                />
              ))}
              <div className="counselor-settings-actions">
                <button
                  type="submit"
                  disabled={!isPasswordFormFilled || isPasswordSubmitting}
                >
                  {isPasswordSubmitting ? '변경 중' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {feedback ? (
        <SettingsFeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
      ) : null}
    </main>
  )
}

export default CounselorSettingsPage
