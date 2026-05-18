import MobilePageLayout from '../../../components/templates/MobilePageLayout/MobilePageLayout'
import { useParentConnectedChild } from '../hooks/useParentConnectedChild'
import { useParentStatusCard } from '../hooks/useParentStatusCard'
import ParentBottomNavigation from './ParentBottomNavigation'
import ParentChildConnectionEmptyState from './ParentChildConnectionEmptyState'
import ParentObservationSection from './ParentObservationSection'

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

function normalizeCardCopy(value?: string | null) {
  return value?.trim() ?? ''
}

function ParentHomeScreen() {
  const { isLoading: isChildLoading, selectedChild } = useParentConnectedChild()
  const {
    errorMessage: statusCardErrorMessage,
    isError: isStatusCardError,
    isLoading: isStatusCardLoading,
    statusCard,
  } = useParentStatusCard(selectedChild?.id)
  const hasConnectedChild = Boolean(selectedChild?.id)
  const selectedChildName = normalizeCardCopy(selectedChild?.name)
  const statusCardTitle = normalizeCardCopy(statusCard?.title)
  const statusCardDescription = normalizeCardCopy(statusCard?.description)
  const statusCardSubTitle = normalizeCardCopy(statusCard?.subTitle)
  const statusCardSuggestion = normalizeCardCopy(statusCard?.suggestion)
  const emptyStatusCardTitle = selectedChildName
    ? (
        <>
          <span className="parent-home-page__section-title-line">
            {selectedChildName} 님의
          </span>
          <span className="parent-home-page__section-title-line">
            상태 카드를 기다리고 있어요
          </span>
        </>
      )
    : '아직 보여드릴 상태 카드가 없어요'
  const summaryTitle = isChildLoading
    ? '아이 정보를 불러오고 있어요'
    : isStatusCardLoading
      ? '상태 카드를 불러오고 있어요'
      : isStatusCardError
        ? '상태 카드를 불러오지 못했어요'
        : statusCardTitle || emptyStatusCardTitle
  const summaryDescription = isChildLoading
    ? '연결된 아이 정보를 확인한 뒤 맞춤 요약을 보여드릴게요.'
    : isStatusCardLoading
      ? '오늘 또는 어제 생성된 상태 카드를 확인하고 있어요.'
      : isStatusCardError
        ? statusCardErrorMessage ?? '잠시 후 다시 확인해 주세요.'
        : statusCardDescription ||
          '오늘 또는 어제 생성된 상태 카드가 있으면 이곳에 보여드릴게요.'
  const suggestionTitle = isChildLoading
    ? '아이 연결 후 맞춤 제안을 표시합니다.'
    : isStatusCardLoading
      ? '맞춤 제안을 준비하고 있어요.'
      : isStatusCardError
        ? '다시 시도해 주세요.'
        : statusCardSubTitle || '카드가 생성되면 제안을 보여드릴게요.'
  const suggestionCopy = statusCardSuggestion
    ? `"${statusCardSuggestion}"`
    : isStatusCardLoading
      ? '잠시만 기다려 주세요.'
      : '상태 카드가 생성되면 아이에게 건넬 문장을 보여드릴게요.'

  return (
    <MobilePageLayout
      header={<ParentHomeHeader childName={selectedChild?.name} />}
      className="parent-home-page"
      contentClassName="parent-home-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <div className="parent-home-page__body">
        {hasConnectedChild || isChildLoading ? (
          <section className="parent-home-page__summary-card" aria-label="보호자 홈 요약 영역">
            <div className="parent-home-page__summary-copy">
              <h2 className="parent-home-page__section-title">{summaryTitle}</h2>
              <p className="parent-home-page__section-description">
                {summaryDescription}
              </p>
            </div>

            <div className="parent-home-page__insight-box">
              <div className="parent-home-page__tip-row">
                <InsightTipIcon />
                <p className="parent-home-page__tip-copy">{suggestionTitle}</p>
              </div>
              <p className="parent-home-page__quote">{suggestionCopy}</p>
            </div>
          </section>
        ) : (
          <ParentChildConnectionEmptyState />
        )}

        <ParentObservationSection
          childrenId={selectedChild?.id}
          isConnectionLoading={isChildLoading}
        />
      </div>
    </MobilePageLayout>
  )
}

export default ParentHomeScreen
