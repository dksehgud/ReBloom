import { useState, type ReactNode } from 'react'

import ChildHeader from '../../components/organisms/Header/ChildHeader'
import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ChildPasswordChangeModal from '../../features/user/components/ChildPasswordChangeModal'
import ChildProfileAddressModal from '../../features/user/components/ChildProfileAddressModal'

type ChildSettingsPageProps = {
  profileName?: string
  profileEmail?: string
  profileAddress?: string
  counselorName?: string | null
  counselorSubtitle?: string | null
  onBack?: () => void
  onNotificationClick?: () => void
  onSaveProfileAddress?: (address: string) => void
  onOpenLockSettings?: () => void
  onOpenCounselStatus?: () => void
  onLogout?: () => void
}

type SettingsCardRowProps = {
  title: string
  description?: string
  icon: ReactNode
  onClick?: () => void
  showChevron?: boolean
  trailing?: ReactNode
  showDivider?: boolean
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 6.5L9 12L14.5 17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.95"
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M12 5.25C9.93 5.25 8.25 6.93 8.25 9V10.96C8.25 11.38 8.11 11.79 7.86 12.13L6.75 13.65C6.4 14.13 6.75 14.81 7.34 14.81H16.66C17.25 14.81 17.6 14.13 17.25 13.65L16.14 12.13C15.89 11.79 15.75 11.38 15.75 10.96V9C15.75 6.93 14.07 5.25 12 5.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <path
        d="M10.5 17.25C10.73 17.92 11.32 18.38 12 18.38C12.68 18.38 13.27 17.92 13.5 17.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M12 12.25C13.79 12.25 15.25 10.79 15.25 9C15.25 7.21 13.79 5.75 12 5.75C10.21 5.75 8.75 7.21 8.75 9C8.75 10.79 10.21 12.25 12 12.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <path
        d="M6.75 18C7.52 16.12 9.57 14.75 12 14.75C14.43 14.75 16.48 16.12 17.25 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="9.25" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.65" />
      <path
        d="M12.75 12H18.25L19.75 10.5M16.25 12V13.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M12 4.75L17.25 6.89V11.16C17.25 14.32 15.18 17.16 12 18.25C8.82 17.16 6.75 14.32 6.75 11.16V6.89L12 4.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  )
}

function SettingsCardRow({
  title,
  description,
  icon,
  onClick,
  showChevron = false,
  trailing,
  showDivider = true,
}: SettingsCardRowProps) {
  const className = `child-settings-page__row${showDivider ? ' has-divider' : ''}`

  const content = (
    <>
      <span className="child-settings-page__icon-circle">{icon}</span>
      <span className="child-settings-page__copy">
        <span className="child-settings-page__row-title">{title}</span>
        {description ? (
          <span className="child-settings-page__row-description">{description}</span>
        ) : null}
      </span>
      <span className="child-settings-page__row-end">
        {trailing}
        {showChevron ? (
          <span className="child-settings-page__chevron">
            <ChevronIcon />
          </span>
        ) : null}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={`${className} is-button`} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

function ChildSettingsPage({
  profileName = '이승형',
  profileEmail = 'test@naver.com',
  profileAddress = '',
  counselorName = null,
  counselorSubtitle = null,
  onBack,
  onNotificationClick,
  onSaveProfileAddress,
  onOpenLockSettings,
  onOpenCounselStatus,
  onLogout,
}: ChildSettingsPageProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  const isCounselConnected = Boolean(counselorName && counselorSubtitle)

  return (
    <MobilePageLayout
      className="child-settings-page"
      contentClassName="child-settings-page__content"
      header={
        <ChildHeader
          title="설정"
          leftSlot={
            <button
              type="button"
              className="child-header-icon-button"
              aria-label="뒤로가기"
              onClick={onBack}
            >
              <BackIcon />
            </button>
          }
          showDivider
        />
      }
    >
      <div className="child-settings-page__body">
        <section className="child-settings-page__section">
          <h2 className="child-settings-page__section-title">알림</h2>
          <div className="child-settings-page__box">
            <SettingsCardRow
              title="일기 작성 알림"
              description="매일 20:00"
              icon={<BellIcon />}
              onClick={onNotificationClick}
              showChevron
              showDivider={false}
            />
          </div>
        </section>

        <section className="child-settings-page__section">
          <h2 className="child-settings-page__section-title">프로필 정보</h2>
          <div className="child-settings-page__box">
            <SettingsCardRow
              title={profileName}
              description={profileEmail}
              icon={<UserIcon />}
              onClick={() => setIsAddressModalOpen(true)}
              showChevron
              showDivider
            />
            <SettingsCardRow
              title="계정 비밀번호 변경"
              description="로그인 비밀번호"
              icon={<KeyIcon />}
              onClick={() => setIsPasswordModalOpen(true)}
              showChevron
              showDivider
            />
            <SettingsCardRow
              title="일기 잠금 설정"
              description="잠금 해제됨"
              icon={<ShieldIcon />}
              onClick={onOpenLockSettings}
              showChevron
              showDivider={false}
            />
          </div>
        </section>

        <section className="child-settings-page__section">
          <h2 className="child-settings-page__section-title">상담사 연결</h2>
          <div className="child-settings-page__box">
            <SettingsCardRow
              title={isCounselConnected ? counselorName ?? '' : '연결된 상담사가 없습니다.'}
              description={
                isCounselConnected
                  ? counselorSubtitle ?? ''
                  : '부모 계정에서 상담사를 연결하세요.'
              }
              icon={<UserIcon />}
              onClick={onOpenCounselStatus}
              trailing={
                isCounselConnected ? (
                  <span className="child-settings-page__connect-badge">연결</span>
                ) : undefined
              }
              showDivider={false}
            />
          </div>
        </section>

        <button type="button" className="child-settings-page__logout" onClick={onLogout}>
          로그아웃
        </button>
      </div>

      {isAddressModalOpen ? (
        <ChildProfileAddressModal
          address={profileAddress}
          profileName={profileName}
          onClose={() => setIsAddressModalOpen(false)}
          onSave={(nextAddress) => {
            onSaveProfileAddress?.(nextAddress)
            setIsAddressModalOpen(false)
          }}
        />
      ) : null}

      {isPasswordModalOpen ? (
        <ChildPasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />
      ) : null}
    </MobilePageLayout>
  )
}

export type { ChildSettingsPageProps }

export default ChildSettingsPage
