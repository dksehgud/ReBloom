import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'

function ParentHomePage() {
  return (
    <MobilePageLayout
      className="parent-home-page"
      contentClassName="parent-home-page__content"
      bottomNavigation={<div className="parent-home-page__bottom-placeholder" aria-hidden="true" />}
    >
      <div className="parent-home-page__viewport">
        <header className="parent-home-page__header">
          <div className="parent-home-page__header-copy">
            <h1 className="parent-home-page__title">내 아이 감정 모니터</h1>
            <p className="parent-home-page__subtitle">지민 부모님</p>
          </div>
        </header>

        <div className="parent-home-page__body">
          <section className="parent-home-page__summary-card" aria-label="보호자 홈 요약 영역">
            <span className="parent-home-page__section-tag">상단 요약 영역</span>
            <h2 className="parent-home-page__section-title">보호자 홈 핵심 안내 카드 영역</h2>
            <p className="parent-home-page__section-description">
              다음 하위 태스크에서 Figma 기준 상단 안내 문구, 상태 요약 문장, 제안 문구
              블록을 이 영역에 연결합니다.
            </p>
          </section>

          <section className="parent-home-page__records-card" aria-label="관찰 기록 미리보기 영역">
            <div className="parent-home-page__records-header">
              <h2 className="parent-home-page__records-heading">아이 관찰 기록</h2>
              <button
                type="button"
                className="parent-home-page__add-button"
                aria-label="관찰 기록 추가"
              >
                +
              </button>
            </div>
            <div className="parent-home-page__empty-banner">
              <p className="parent-home-page__empty-copy">
                오늘 아이의 모습을 기록해보세요.
              </p>
            </div>
            <div className="parent-home-page__preview-list" aria-hidden="true">
              <div className="parent-home-page__preview-item" />
              <div className="parent-home-page__preview-item" />
              <div className="parent-home-page__preview-item" />
            </div>
          </section>
        </div>
      </div>
    </MobilePageLayout>
  )
}

export default ParentHomePage
