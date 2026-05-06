import { useState, type ReactNode } from 'react'

import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import ParentCounselorConnectModal from '../../features/guardian/components/ParentCounselorConnectModal'
import {
  mockCounselorCandidate,
  mockLinkedChild,
  mockParentProfile,
  parentSupportContacts,
  type ParentCounselorCandidate,
} from '../../features/guardian/constants/parentSettings'
import ChildPasswordChangeModal from '../../features/user/components/ChildPasswordChangeModal'

type ParentSettingsRowProps = {
  title: ReactNode
  description?: ReactNode
  icon: ReactNode
  onClick?: () => void
  trailing?: ReactNode
  showChevron?: boolean
  showDivider?: boolean
}

function SettingsHeaderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M11.9965 14.9957C13.6529 14.9957 14.9956 13.653 14.9956 11.9966C14.9956 10.3402 13.6529 8.99744 11.9965 8.99744C10.34 8.99744 8.99731 10.3402 8.99731 11.9966C8.99731 13.653 10.34 14.9957 11.9965 14.9957Z"
        stroke="currentColor"
        strokeWidth="2.17937"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.3945 14.9957C19.2614 15.2972 19.2217 15.6317 19.2805 15.9561C19.3393 16.2804 19.4939 16.5796 19.7244 16.8152L19.7844 16.8752C19.9703 17.0608 20.1178 17.2814 20.2183 17.5241C20.319 17.7668 20.3708 18.0271 20.3708 18.2898C20.3708 18.5525 20.319 18.8127 20.2183 19.0555C20.1178 19.2982 19.9703 19.5187 19.7844 19.7044C19.5987 19.8903 19.3782 20.0378 19.1354 20.1384C18.8927 20.239 18.6325 20.2908 18.3698 20.2908C18.107 20.2908 17.8468 20.239 17.6041 20.1384C17.3614 20.0378 17.1408 19.8903 16.9552 19.7044L16.8952 19.6444C16.6596 19.414 16.3603 19.2593 16.036 19.2005C15.7117 19.1417 15.3772 19.1814 15.0757 19.3145C14.78 19.4413 14.5279 19.6516 14.3502 19.9198C14.1726 20.188 14.0773 20.5023 14.076 20.8241V20.994C14.076 21.5243 13.8654 22.0328 13.4904 22.4078C13.1154 22.7828 12.6068 22.9934 12.0766 22.9934C11.5463 22.9934 11.0378 22.7828 10.6628 22.4078C10.2878 22.0328 10.0771 21.5243 10.0771 20.994V20.904C10.0694 20.5731 9.9623 20.2522 9.76974 19.983C9.57719 19.7138 9.30811 19.5087 8.99746 19.3945C8.69592 19.2614 8.36145 19.2217 8.03714 19.2805C7.71285 19.3393 7.41359 19.4939 7.17798 19.7244L7.118 19.7844C6.9323 19.9703 6.71179 20.1178 6.46906 20.2183C6.22633 20.319 5.96616 20.3708 5.7034 20.3708C5.44065 20.3708 5.18047 20.319 4.93774 20.2183C4.69501 20.1178 4.47451 19.9703 4.28881 19.7844C4.10291 19.5987 3.95544 19.3782 3.85481 19.1354C3.75419 18.8927 3.70241 18.6325 3.70241 18.3698C3.70241 18.107 3.75419 17.8468 3.85481 17.6041C3.95544 17.3614 4.10291 17.1408 4.28881 16.9552L4.34879 16.8952C4.57927 16.6596 4.73387 16.3603 4.79267 16.036C4.85147 15.7117 4.81178 15.3772 4.6787 15.0757C4.55197 14.78 4.34155 14.5279 4.07334 14.3502C3.80513 14.1726 3.49083 14.0773 3.16913 14.076H2.99918C2.4689 14.076 1.96034 13.8654 1.58538 13.4904C1.21041 13.1154 0.999756 12.6068 0.999756 12.0766C0.999756 11.5463 1.21041 11.0378 1.58538 10.6628C1.96034 10.2878 2.4689 10.0771 2.99918 10.0771H3.08915C3.42005 10.0694 3.74097 9.9623 4.01019 9.76974C4.2794 9.57719 4.48447 9.30811 4.59872 8.99746C4.7318 8.69592 4.77149 8.36145 4.71269 8.03714C4.6539 7.71285 4.49929 7.41359 4.26882 7.17798L4.20883 7.118C4.02294 6.9323 3.87546 6.71179 3.77484 6.46906C3.67422 6.22633 3.62243 5.96616 3.62243 5.7034C3.62243 5.44065 3.67422 5.18047 3.77484 4.93774C3.87546 4.69501 4.02294 4.47451 4.20883 4.28881C4.39453 4.10291 4.61504 3.95544 4.85777 3.85481C5.1005 3.75419 5.36067 3.70241 5.62343 3.70241C5.88618 3.70241 6.14636 3.75419 6.38909 3.85481C6.63182 3.95544 6.85232 4.10291 7.03802 4.28881L7.098 4.34879C7.33361 4.57927 7.63287 4.73387 7.95717 4.79267C8.28147 4.85147 8.61595 4.81178 8.91748 4.6787H8.99746C9.29314 4.55197 9.54532 4.34155 9.72294 4.07334C9.90057 3.80513 9.99589 3.49083 9.99717 3.16913V2.99918C9.99717 2.4689 10.2078 1.96034 10.5828 1.58538C10.9578 1.21041 11.4663 0.999756 11.9966 0.999756C12.5268 0.999756 13.0354 1.21041 13.4104 1.58538C13.7854 1.96034 13.996 2.4689 13.996 2.99918V3.08915C13.9973 3.41085 14.0926 3.72515 14.2702 3.99336C14.4479 4.26158 14.7 4.472 14.9957 4.59872C15.2972 4.7318 15.6317 4.77149 15.9561 4.71269C16.2804 4.6539 16.5796 4.49929 16.8152 4.26882L16.8752 4.20883C17.0608 4.02294 17.2814 3.87546 17.5241 3.77484C17.7668 3.67422 18.0271 3.62243 18.2898 3.62243C18.5525 3.62243 18.8127 3.67422 19.0555 3.77484C19.2982 3.87546 19.5187 4.02294 19.7044 4.20883C19.8903 4.39453 20.0378 4.61504 20.1384 4.85777C20.239 5.1005 20.2908 5.36067 20.2908 5.62343C20.2908 5.88618 20.239 6.14636 20.1384 6.38909C20.0378 6.63182 19.8903 6.85232 19.7044 7.03802L19.6444 7.098C19.414 7.33361 19.2593 7.63287 19.2005 7.95717C19.1417 8.28147 19.1814 8.61595 19.3145 8.91748V8.99746C19.4413 9.29314 19.6516 9.54532 19.9198 9.72294C20.188 9.90057 20.5023 9.99589 20.8241 9.99717H20.994C21.5243 9.99717 22.0328 10.2078 22.4078 10.5828C22.7828 10.9578 22.9934 11.4663 22.9934 11.9966C22.9934 12.5268 22.7828 13.0354 22.4078 13.4104C22.0328 13.7854 21.5243 13.996 20.994 13.996H20.904C20.5823 13.9973 20.268 14.0926 19.9998 14.2702C19.7316 14.4479 19.5212 14.7 19.3945 14.9957Z"
        stroke="currentColor"
        strokeWidth="2.17937"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
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
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
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

function ChevronIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
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

function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5.5V18.5M5.5 12H18.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M19.75 16.92V19.4C19.75 19.87 19.37 20.25 18.9 20.25C10.9 20.25 3.75 13.1 3.75 5.1C3.75 4.63 4.13 4.25 4.6 4.25H7.08C7.49 4.25 7.84 4.54 7.92 4.94L8.39 7.28C8.46 7.63 8.34 7.99 8.08 8.23L6.64 9.67C7.56 11.59 9.11 13.14 11.03 14.06L12.47 12.62C12.71 12.36 13.07 12.24 13.42 12.31L15.76 12.78C16.16 12.86 16.45 13.21 16.45 13.62V16.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  )
}

function ParentSettingsRow({
  title,
  description,
  icon,
  onClick,
  trailing,
  showChevron = false,
  showDivider = true,
}: ParentSettingsRowProps) {
  const content = (
    <>
      <span className="parent-settings-page__icon-circle">{icon}</span>
      <span className="parent-settings-page__copy">
        <span className="parent-settings-page__row-title">{title}</span>
        {description ? (
          <span className="parent-settings-page__row-description">{description}</span>
        ) : null}
      </span>
      <span className="parent-settings-page__row-end">
        {trailing}
        {showChevron ? (
          <span className="parent-settings-page__chevron">
            <ChevronIcon />
          </span>
        ) : null}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={`parent-settings-page__row${
          showDivider ? ' has-divider' : ''
        } is-button`}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={`parent-settings-page__row${showDivider ? ' has-divider' : ''}`}
    >
      {content}
    </div>
  )
}

function ParentSettingsHeader() {
  return (
    <div className="parent-notifications-page__header">
      <div className="parent-notifications-page__header-copy">
        <div className="parent-notifications-page__title-row">
          <span className="parent-notifications-page__title-icon">
            <SettingsHeaderIcon />
          </span>
          <h1 className="parent-notifications-page__title">설정</h1>
        </div>
      </div>
    </div>
  )
}

function ContactRow({
  title,
  phoneNumber,
  description,
  showDivider,
}: {
  title: string
  phoneNumber: string
  description?: string
  showDivider: boolean
}) {
  return (
    <div className={`parent-settings-page__row${showDivider ? ' has-divider' : ''}`}>
      <span className="parent-settings-page__icon-circle">
        <PhoneIcon />
      </span>
      <span className="parent-settings-page__copy">
        <span className="parent-settings-page__row-title">{title}</span>
        {description ? (
          <span className="parent-settings-page__row-description">{description}</span>
        ) : null}
      </span>
      <span className="parent-settings-page__row-end">
        <a className="parent-settings-page__phone-chip" href={`tel:${phoneNumber}`}>
          {phoneNumber}
        </a>
      </span>
    </div>
  )
}

function ParentSettingsPage() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState(false)
  const [connectedCounselor, setConnectedCounselor] =
    useState<ParentCounselorCandidate | null>(null)

  const isCounselorConnected = connectedCounselor !== null

  return (
    <MobilePageLayout
      header={<ParentSettingsHeader />}
      className="parent-home-page parent-settings-page"
      contentClassName="parent-settings-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <div className="parent-settings-page__body">
        <section className="parent-settings-page__section">
          <h2 className="parent-settings-page__section-title">프로필 정보</h2>
          <div className="parent-settings-page__box">
            <ParentSettingsRow
              title={mockParentProfile.name}
              description={mockParentProfile.email}
              icon={<UserIcon />}
              showDivider
            />
            <ParentSettingsRow
              title="계정 비밀번호 변경"
              description="로그인 비밀번호"
              icon={<KeyIcon />}
              onClick={() => setIsPasswordModalOpen(true)}
              showChevron
              showDivider={false}
            />
          </div>
        </section>

        <section className="parent-settings-page__section">
          <h2 className="parent-settings-page__section-title">아이 연결</h2>
          <div className="parent-settings-page__box">
            <ParentSettingsRow
              title={
                <>
                  <span>{mockLinkedChild.name}</span>
                  <span className="parent-settings-page__inline-meta">
                    {mockLinkedChild.ageLabel}
                  </span>
                </>
              }
              description={
                <a
                  className="parent-settings-page__linked-email"
                  href={`mailto:${mockLinkedChild.email}`}
                >
                  {mockLinkedChild.email}
                </a>
              }
              icon={<UserIcon />}
              showDivider={false}
            />
          </div>
        </section>

        <section className="parent-settings-page__section">
          <h2 className="parent-settings-page__section-title">상담사 연결</h2>
          <div className="parent-settings-page__box">
            {isCounselorConnected && connectedCounselor ? (
              <ParentSettingsRow
                title={connectedCounselor.name}
                description={connectedCounselor.clinicName}
                icon={<UserIcon />}
                trailing={<span className="parent-settings-page__status-chip">연결</span>}
                showDivider={false}
              />
            ) : (
              <ParentSettingsRow
                title="상담사를 연결하세요."
                icon={<PlusIcon />}
                onClick={() => setIsCounselorModalOpen(true)}
                showDivider={false}
              />
            )}
          </div>
        </section>

        <section className="parent-settings-page__section">
          <h2 className="parent-settings-page__section-title">연락처</h2>
          <div className="parent-settings-page__box">
            {isCounselorConnected && connectedCounselor ? (
              <ContactRow
                title={connectedCounselor.name}
                description={connectedCounselor.clinicName}
                phoneNumber={connectedCounselor.phoneNumber}
                showDivider
              />
            ) : null}

            {parentSupportContacts.map((contact, index) => (
              <ContactRow
                key={contact.id}
                title={contact.label}
                phoneNumber={contact.phoneNumber}
                showDivider={index < parentSupportContacts.length - 1}
              />
            ))}
          </div>
        </section>
      </div>

      {isPasswordModalOpen ? (
        <ChildPasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />
      ) : null}

      {isCounselorModalOpen ? (
        <ParentCounselorConnectModal
          candidate={mockCounselorCandidate}
          onClose={() => setIsCounselorModalOpen(false)}
          onComplete={(candidate) => {
            setConnectedCounselor(candidate)
            setIsCounselorModalOpen(false)
          }}
        />
      ) : null}
    </MobilePageLayout>
  )
}

export default ParentSettingsPage
