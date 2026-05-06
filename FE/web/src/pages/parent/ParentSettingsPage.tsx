import { useState, type ReactNode } from 'react'

import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import {
  mockLinkedChild,
  mockParentProfile,
  parentSupportContacts,
  type ParentSupportContact,
} from '../../features/guardian/constants/parentSettings'
import ChildPasswordChangeModal from '../../features/user/components/ChildPasswordChangeModal'

type ParentSettingsRowProps = {
  title: string
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
        d="M12 9.2C10.4536 9.2 9.2 10.4536 9.2 12C9.2 13.5464 10.4536 14.8 12 14.8C13.5464 14.8 14.8 13.5464 14.8 12C14.8 10.4536 13.5464 9.2 12 9.2Z"
        stroke="currentColor"
        strokeWidth="2.05"
      />
      <path
        d="M4.4 13.3V10.7L6.07308 10.1682C6.2442 9.62549 6.46186 9.11144 6.72077 8.62737L5.90769 7.07474L7.77474 5.20769L9.32737 6.02077C9.81144 5.76186 10.3255 5.5442 10.8682 5.37308L11.4 3.7H14.6L15.1318 5.37308C15.6745 5.5442 16.1886 5.76186 16.6726 6.02077L18.2253 5.20769L20.0923 7.07474L19.2792 8.62737C19.5381 9.11144 19.7558 9.62549 19.9269 10.1682L21.6 10.7V13.3L19.9269 13.8318C19.7558 14.3745 19.5381 14.8886 19.2792 15.3726L20.0923 16.9253L18.2253 18.7923L16.6726 17.9792C16.1886 18.2381 15.6745 18.4558 15.1318 18.6269L14.6 20.3H11.4L10.8682 18.6269C10.3255 18.4558 9.81144 18.2381 9.32737 17.9792L7.77474 18.7923L5.90769 16.9253L6.72077 15.3726C6.46186 14.8886 6.2442 14.3745 6.07308 13.8318L4.4 13.3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.05"
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
      <path
        d="M15.85 7.75H18.3C18.74 7.75 19.1 8.11 19.1 8.55V11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <path
        d="M13.55 5.45H18.3C19.95 5.45 21.3 6.8 21.3 8.45V13.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <path
        d="M10.2 11.65H5.9C4.46 11.65 3.3 12.82 3.3 14.25V18.55C3.3 19.99 4.46 21.15 5.9 21.15H10.2C11.64 21.15 12.8 19.99 12.8 18.55V14.25C12.8 12.82 11.64 11.65 10.2 11.65Z"
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
  contact,
  showDivider,
}: {
  contact: ParentSupportContact
  showDivider: boolean
}) {
  return (
    <div className={`parent-settings-page__row${showDivider ? ' has-divider' : ''}`}>
      <span className="parent-settings-page__icon-circle">
        <PhoneIcon />
      </span>
      <span className="parent-settings-page__copy">
        <span className="parent-settings-page__row-title">{contact.label}</span>
      </span>
      <span className="parent-settings-page__row-end">
        <a className="parent-settings-page__phone-chip" href={`tel:${contact.phoneNumber}`}>
          {contact.phoneNumber}
        </a>
      </span>
    </div>
  )
}

function ParentSettingsPage() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

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
              title={mockLinkedChild.name}
              description={
                <>
                  <span className="parent-settings-page__muted-text">
                    {mockLinkedChild.ageLabel}
                  </span>
                  <a
                    className="parent-settings-page__linked-email"
                    href={`mailto:${mockLinkedChild.email}`}
                  >
                    {mockLinkedChild.email}
                  </a>
                </>
              }
              icon={<UserIcon />}
              showDivider={false}
            />
          </div>
        </section>

        <section className="parent-settings-page__section">
          <h2 className="parent-settings-page__section-title">상담사 연결</h2>
          <div className="parent-settings-page__box">
            <ParentSettingsRow
              title="상담사를 연결하세요."
              icon={<PlusIcon />}
              showDivider={false}
            />
          </div>
        </section>

        <section className="parent-settings-page__section">
          <h2 className="parent-settings-page__section-title">연락처</h2>
          <div className="parent-settings-page__box">
            {parentSupportContacts.map((contact, index) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                showDivider={index < parentSupportContacts.length - 1}
              />
            ))}
          </div>
        </section>
      </div>

      {isPasswordModalOpen ? (
        <ChildPasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />
      ) : null}
    </MobilePageLayout>
  )
}

export default ParentSettingsPage
