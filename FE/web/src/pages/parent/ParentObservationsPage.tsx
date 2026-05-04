import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'

function ParentObservationsHeader() {
  return (
    <div className="parent-home-page__header">
      <div className="parent-home-page__header-copy">
        <h1 className="parent-home-page__title">아이 관찰 기록</h1>
        <p className="parent-home-page__subtitle">날짜별 기록을 확인하고 변화를 살펴보세요.</p>
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
        <section
          className="parent-observations-page__section parent-observations-page__section--calendar"
          aria-label="관찰 기록 캘린더 영역"
        >
          <div className="parent-observations-page__section-copy">
            <p className="parent-observations-page__eyebrow">캘린더</p>
            <h2 className="parent-observations-page__section-title">월별 관찰 기록 확인</h2>
            <p className="parent-observations-page__section-description">
              다음 하위 태스크에서 월 이동과 날짜 선택이 가능한 캘린더 UI를 연결합니다.
            </p>
          </div>

          <div className="parent-observations-page__calendar-skeleton" aria-hidden="true">
            <div className="parent-observations-page__month-row">
              <span className="parent-observations-page__month-button" />
              <span className="parent-observations-page__month-label" />
              <span className="parent-observations-page__month-button" />
            </div>
            <div className="parent-observations-page__week-row">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <span key={day} className="parent-observations-page__week-label">
                  {day}
                </span>
              ))}
            </div>
            <div className="parent-observations-page__day-grid">
              {Array.from({ length: 35 }).map((_, index) => (
                <span key={index} className="parent-observations-page__day-cell" />
              ))}
            </div>
          </div>
        </section>

        <section
          className="parent-observations-page__section parent-observations-page__section--list"
          aria-label="관찰 기록 리스트 영역"
        >
          <div className="parent-observations-page__section-copy">
            <p className="parent-observations-page__eyebrow">리스트</p>
            <h2 className="parent-observations-page__section-title">선택한 날짜의 관찰 기록</h2>
            <p className="parent-observations-page__section-description">
              다음 하위 태스크에서 기록 카드와 빈 상태 UI를 실제 데이터 구조에 맞게 채웁니다.
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
