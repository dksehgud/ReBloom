import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiLogOut } from 'react-icons/fi'

import SettingsFeedbackModal from '../../features/counselor/components/settings/SettingsFeedbackModal'
import SettingsInput from '../../features/counselor/components/settings/SettingsInput'
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
import { openDaumPostcodePopup } from '../../shared/utils/daumPostcode'

function CounselorSettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [profileForm, setProfileForm] = useState<ProfileForm>(initialProfileForm)
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm)
  const [hospitalAddressError, setHospitalAddressError] = useState<string>()
  const [isLoadingAddressSearch, setIsLoadingAddressSearch] = useState(false)
  const [feedback, setFeedback] = useState<SettingsFeedback>(null)
  const isProfileSection = activeSection === 'profile'

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
    profileForm.hospitalAddressDetail,
  ]
  const isProfileChanged = (
    Object.keys(initialProfileForm) as Array<keyof ProfileForm>
  ).some(
    (field) =>
      normalizeFormValue(profileForm[field]) !==
      normalizeFormValue(initialProfileForm[field]),
  )
  const isProfileSavable =
    isProfileChanged &&
    requiredProfileValues.every((value) => normalizeFormValue(value).length > 0)

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (requiredProfileValues.some((value) => value.trim().length === 0)) {
      setFeedback({
        title: '필수 정보를 확인해 주세요',
        message:
          '이름, 이메일, 전화번호, 병원/센터 이름, 주소, 상세주소는 모두 입력해야 저장할 수 있어요.',
        tone: 'error',
      })
      return
    }

    if (!isProfileChanged) {
      return
    }

    setFeedback({
      title: '프로필 정보가 저장되었습니다',
      message:
        '실제 API 연동 시 이 저장 동작은 PATCH /api/v1/users 요청으로 연결됩니다.',
      tone: 'success',
    })
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

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

    if (passwordForm.currentPassword !== MOCK_CURRENT_PASSWORD) {
      setFeedback({
        title: '현재 비밀번호가 일치하지 않습니다',
        message:
          '입력한 현재 비밀번호를 다시 확인해 주세요. 실제 API 연동 시 서버 응답으로 이 상태를 판단합니다.',
        tone: 'error',
      })
      return
    }

    setPasswordForm(initialPasswordForm)
    setFeedback({
      title: '비밀번호가 변경되었습니다',
      message: '다음 로그인부터 새 비밀번호를 사용할 수 있어요.',
      tone: 'success',
    })
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
          <button type="button">
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
              {profileFields.map((field) => (
                <SettingsInput
                  field={field}
                  key={field.id}
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
                    disabled={isLoadingAddressSearch}
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
                value={profileForm.hospitalAddressDetail}
                onChange={(value) => updateProfileField('hospitalAddressDetail', value)}
              />
              <div className="counselor-settings-actions">
                <button type="submit" disabled={!isProfileSavable}>
                  저장하기
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
                  key={field.id}
                  value={passwordForm[field.id as keyof PasswordForm]}
                  onChange={(value) =>
                    updatePasswordField(field.id as keyof PasswordForm, value)
                  }
                />
              ))}
              <div className="counselor-settings-actions">
                <button type="submit" disabled={!isPasswordFormFilled}>
                  비밀번호 변경
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
