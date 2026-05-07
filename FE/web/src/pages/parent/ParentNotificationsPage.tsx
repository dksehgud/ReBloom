import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import ParentNotificationFeed from '../../features/guardian/components/ParentNotificationFeed'
import useParentNotificationState from '../../features/guardian/hooks/useParentNotificationState'

function NotificationsHeaderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M13.726 20.994C13.5502 21.297 13.298 21.5485 12.9944 21.7233C12.6908 21.8981 12.3467 21.9901 11.9964 21.9901C11.6461 21.9901 11.302 21.8981 10.9985 21.7233C10.695 21.5485 10.4427 21.297 10.267 20.994M17.9947 7.99771C17.9947 6.40687 17.3628 4.88119 16.2378 3.75629C15.1129 2.6314 13.5872 1.99944 11.9964 1.99944C10.4056 1.99944 8.87991 2.6314 7.75501 3.75629C6.63012 4.88119 5.99816 6.40687 5.99816 7.99771C5.99816 14.9958 2.99902 16.9952 2.99902 16.9952H20.9938C20.9938 16.9952 17.9947 14.9958 17.9947 7.99771Z"
        stroke="currentColor"
        strokeWidth="1.99943"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ParentNotificationsHeader() {
  return (
    <div className="parent-notifications-page__header">
      <div className="parent-notifications-page__header-copy">
        <div className="parent-notifications-page__title-row">
          <span className="parent-notifications-page__title-icon">
            <NotificationsHeaderIcon />
          </span>
          <h1 className="parent-notifications-page__title">알림</h1>
        </div>
        <p className="parent-notifications-page__subtitle">
          지민이의 감정 변화와 중요한 소식을 확인하세요
        </p>
      </div>
    </div>
  )
}

function ParentNotificationsPage() {
  const { notifications, markAsRead, chooseAction } = useParentNotificationState()

  return (
    <MobilePageLayout
      header={<ParentNotificationsHeader />}
      className="parent-home-page parent-notifications-page"
      contentClassName="parent-notifications-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <section className="parent-notifications-page__body" aria-label="보호자 알림 목록 영역">
        <ParentNotificationFeed
          items={notifications}
          onCardClick={markAsRead}
          onActionClick={chooseAction}
        />
      </section>
    </MobilePageLayout>
  )
}

export default ParentNotificationsPage
