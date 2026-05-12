import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import ParentObservationSection from '../../features/guardian/components/ParentObservationSection'
import { useParentConnectedChild } from '../../features/guardian/hooks/useParentConnectedChild'

function InsightTipIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-home-page__tip-icon"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.7457 8.16269C8.86231 7.57964 9.15384 7.17151 9.62027 6.70507C10.2033 6.18033 10.4948 5.42237 10.4948 4.66441C10.4948 3.73661 10.1263 2.84681 9.47022 2.19076C8.81417 1.5347 7.92437 1.16614 6.99657 1.16614C6.06877 1.16614 5.17897 1.5347 4.52291 2.19076C3.86686 2.84681 3.49829 3.73661 3.49829 4.66441C3.49829 5.24746 3.6149 5.94711 4.37286 6.70507C4.78099 7.11321 5.13082 7.57964 5.24743 8.16269"
        stroke="currentColor"
        strokeWidth="1.16609"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.24731 10.4949H8.74559"
        stroke="currentColor"
        strokeWidth="1.16609"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83057 12.827H8.16275"
        stroke="currentColor"
        strokeWidth="1.16609"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ParentHomeHeader({ childName }: { childName?: string }) {
  return (
    <div className="parent-home-page__header">
      <div className="parent-home-page__header-copy">
        <h1 className="parent-home-page__title">내 아이 감정 모니터</h1>
        <p className="parent-home-page__subtitle">
          {childName ? `${childName} 부모님` : '보호자님'}
        </p>
      </div>
    </div>
  )
}

function ParentHomePage() {
  const { selectedChild } = useParentConnectedChild()

  return (
    <MobilePageLayout
      header={<ParentHomeHeader childName={selectedChild?.name} />}
      className="parent-home-page"
      contentClassName="parent-home-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <div className="parent-home-page__body">
        <section className="parent-home-page__summary-card" aria-label="보호자 홈 요약 영역">
          <div className="parent-home-page__summary-copy">
            <h2 className="parent-home-page__section-title">
              지민이가 조금 지쳐 있는 것 같아요
            </h2>
            <p className="parent-home-page__section-description">
              수면 질이 평소보다 좋지 않고, 활동량이 저번주에 비해 줄어들었어요.
            </p>
          </div>

          <div className="parent-home-page__insight-box">
            <div className="parent-home-page__tip-row">
              <InsightTipIcon />
              <p className="parent-home-page__tip-copy">
                직접적인 상태 질문보다 가벼운 제안이 좋습니다.
              </p>
            </div>
            <p className="parent-home-page__quote">"오늘 저녁에 같이 맛있는 거 먹을까?"</p>
          </div>
        </section>

        <ParentObservationSection childrenId={selectedChild?.id} />
      </div>
    </MobilePageLayout>
  )
}

export default ParentHomePage
