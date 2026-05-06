import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import ParentObservationCalendar from '../../features/guardian/components/ParentObservationCalendar'
import ParentObservationSection from '../../features/guardian/components/ParentObservationSection'

function ParentObservationsHeader() {
  return (
    <div className="parent-home-page__header">
      <div className="parent-home-page__header-copy">
        <h1 className="parent-home-page__title">아이 관찰 기록</h1>
        <p className="parent-home-page__subtitle">지민 부모님</p>
      </div>
    </div>
  )
}

function ParentObservationsPage() {
  return (
    <MobilePageLayout
      header={<ParentObservationsHeader />}
      className="parent-home-page"
      contentClassName="parent-observations-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <div className="parent-observations-page__body">
        <ParentObservationCalendar />
        <ParentObservationSection />
      </div>
    </MobilePageLayout>
  )
}

export default ParentObservationsPage
