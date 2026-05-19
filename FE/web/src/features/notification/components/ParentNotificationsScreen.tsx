import { useLocation, useNavigate } from 'react-router-dom'

import MobilePageLayout from '../../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../guardian/components/ParentBottomNavigation'
import { useParentConnectedChild } from '../../guardian/hooks/useParentConnectedChild'
import { getParentMockSearch } from '../../guardian/hooks/useParentMockMode'
import type { ParentNotificationItem } from '../constants/parentNotifications'
import ParentNotificationFeed from './ParentNotificationFeed'
import useParentNotificationState from '../hooks/useParentNotificationState'

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

type ParentNotificationsHeaderProps = {
  childName?: string
}

function ParentNotificationsHeader({
  childName,
}: ParentNotificationsHeaderProps) {
  const displayName = childName?.trim() || '아이'

  return (
    <div className="parent-notifications-page__header">
      <div className="parent-notifications-page__header-main">
        <div className="parent-notifications-page__header-copy">
          <div className="parent-notifications-page__title-row">
            <span className="parent-notifications-page__title-icon">
              <NotificationsHeaderIcon />
            </span>
            <h1 className="parent-notifications-page__title">알림</h1>
          </div>
          <p className="parent-notifications-page__subtitle">
            {displayName}의 감정 변화와 중요한 소식을 확인하세요
          </p>
        </div>
      </div>
      {/* 전체 읽음 버튼은 부모앱에서 노출하지 않습니다. */}
    </div>
  )
}

function ParentNotificationsScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedChild } = useParentConnectedChild()
  const { currentTime, notifications, markAsRead, chooseAction } =
    useParentNotificationState([], { requestMarkAllAsReadOnInitialLoad: true })
  const mockSearch = getParentMockSearch(location.search)

  const handleCardClick = (item: ParentNotificationItem) => {
    markAsRead(item.id)

    if (
      item.notificationType !== 'PARENT_REPORT_REPLY' ||
      !item.childrenReportId
    ) {
      return
    }

    navigate(`/parent/observations${mockSearch}`, {
      state: {
        openObservationChildrenId: item.childrenId ?? selectedChild?.id ?? null,
        openObservationReportId: item.childrenReportId,
      },
    })
  }

  return (
    <MobilePageLayout
      header={
        <ParentNotificationsHeader
          childName={selectedChild?.name}
        />
      }
      className="parent-home-page parent-notifications-page"
      contentClassName="parent-notifications-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <section className="parent-notifications-page__body" aria-label="보호자 알림 목록 영역">
        <ParentNotificationFeed
          currentTime={currentTime}
          items={notifications}
          onCardClick={handleCardClick}
          onActionClick={chooseAction}
        />
      </section>
    </MobilePageLayout>
  )
}

export default ParentNotificationsScreen
