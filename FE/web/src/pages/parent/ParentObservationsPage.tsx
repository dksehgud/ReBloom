import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import ParentObservationCalendar from '../../features/guardian/components/ParentObservationCalendar'

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

        <section className="parent-observations-page__section" aria-label="관찰 기록 리스트 영역">
          <div className="parent-observations-page__section-copy">
            <h2 className="parent-observations-page__section-title">기록 목록</h2>
            <p className="parent-observations-page__section-description">
              선택한 날짜의 관찰 기록이 이 영역에 표시됩니다.
            </p>
          </div>

          <div className="parent-observations-page__list-skeleton" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="parent-observations-page__list-card">
                <div className="parent-observations-page__list-card-date" />
                <div className="parent-observations-page__list-card-content">
                  <div className="parent-observations-page__list-card-badge" />
                  <div className="parent-observations-page__list-card-line parent-observations-page__list-card-line--long" />
                  <div className="parent-observations-page__list-card-line parent-observations-page__list-card-line--short" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobilePageLayout>
  )
}

export default ParentObservationsPage
