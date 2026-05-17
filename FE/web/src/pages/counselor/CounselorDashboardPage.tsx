import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiActivity,
  FiBell,
  FiFileText,
  FiHeart,
  FiMenu,
  FiMoon,
} from 'react-icons/fi'

import BarChart from '../../features/counselor/components/dashboard/charts/BarChart'
import LineChart from '../../features/counselor/components/dashboard/charts/LineChart'
import CounselorConnectionModal from '../../features/counselor/components/dashboard/CounselorConnectionModal'
import CounselorSidebar from '../../features/counselor/components/dashboard/CounselorSidebar'
import DashboardCard from '../../features/counselor/components/dashboard/DashboardCard'
import ExpressionAnalysis from '../../features/counselor/components/dashboard/ExpressionAnalysis'
import ObservationCommentModal from '../../features/counselor/components/dashboard/ObservationCommentModal'
import ObservationList from '../../features/counselor/components/dashboard/ObservationList'
import WeekNavigator from '../../features/counselor/components/dashboard/WeekNavigator'
import { dashboardInfoMessages } from '../../features/counselor/mocks/dashboardMockData'
import useCounselorDashboardState from '../../features/counselor/hooks/useCounselorDashboardState'
import { useAppSessionStore } from '../../features/auth/store/useAppSessionStore'

function CounselorDashboardPage() {
  const navigate = useNavigate()
  const counselorName =
    useAppSessionStore((state) => state.currentUser?.name?.trim()) || '상담사'
  const {
    analysisCardHeight,
    autonomicData,
    autonomicWeek,
    biometricRatioData,
    biometricRatioWeek,
    childItemsError,
    childItems,
    connectionRequests,
    connectionRequestsError,
    currentObservationRecords,
    dashboardExpressionAnalysis,
    dashboardMetricsError,
    expressionWeek,
    handleAcceptConnectionRequest,
    handleDeleteObservationComment,
    handleRejectConnectionRequest,
    handleSaveObservationComment,
    handleSelectChild,
    isLoadingObservationComment,
    isLoadingConnectionRequests,
    isLoadingDashboardMetrics,
    isConnectionModalOpen,
    isLoadingChildItems,
    isLoadingObservationRecords,
    isSubmittingObservationComment,
    isSidebarCollapsed,
    mainColumnRef,
    observationCommentError,
    observationComments,
    observationRecordsError,
    observationWeek,
    selectedChildId,
    selectedChildProfile,
    selectedObservation,
    selectedObservationComment,
    setIsConnectionModalOpen,
    setIsSidebarCollapsed,
    setSelectedObservation,
    sleepEfficiencyData,
    sleepEfficiencyWeek,
    sleepScoreData,
    sleepScoreWeek,
    canRejectConnectionRequests,
  } = useCounselorDashboardState()
  const selectedChildMetaItems = selectedChildProfile
    ? [
        selectedChildProfile.age,
        selectedChildProfile.gender,
        selectedChildProfile.guardianName
          ? `보호자 : ${selectedChildProfile.guardianName}`
          : selectedChildProfile.meta,
      ].filter((item): item is string => Boolean(item))
    : []
  const dashboardEmptyTitle = isLoadingChildItems
    ? '상담 아동을 불러오는 중입니다'
    : childItemsError
      ? '상담 아동 목록을 불러오지 못했습니다'
      : '연결된 상담 아동이 없습니다'
  const dashboardEmptyMessage = isLoadingChildItems
    ? '연결된 아이 목록을 확인하고 있어요.'
    : childItemsError
      ? childItemsError
      : '보호자의 연결 요청을 수락하면 이곳에서 아이의 기록을 확인할 수 있어요.'
  const hasSelectedChild = Boolean(selectedChildProfile && selectedChildId)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const compactSidebarQuery = window.matchMedia('(max-width: 1180px)')
    const syncSidebarMode = () => {
      setIsSidebarCollapsed(compactSidebarQuery.matches)
    }

    syncSidebarMode()
    compactSidebarQuery.addEventListener('change', syncSidebarMode)

    return () => {
      compactSidebarQuery.removeEventListener('change', syncSidebarMode)
    }
  }, [setIsSidebarCollapsed])

  const closeCompactSidebar = () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1180px)').matches
    ) {
      setIsSidebarCollapsed(true)
    }
  }

  const handleSelectSidebarChild = (childId: string) => {
    handleSelectChild(childId)
    closeCompactSidebar()
  }

  const handleOpenSettings = () => {
    closeCompactSidebar()
    navigate('/counselor/settings')
  }

  return (
    <main
      className={`counselor-dashboard${
        isSidebarCollapsed ? ' is-sidebar-collapsed' : ''
      }`}
    >
      <header className="counselor-mobile-header counselor-dashboard-mobile-header">
        <button
          type="button"
          className="counselor-mobile-header__menu"
          aria-label="상담 아동 목록 열기"
          aria-expanded={!isSidebarCollapsed}
          onClick={() => setIsSidebarCollapsed(false)}
        >
          <FiMenu aria-hidden="true" />
        </button>
        <span className="counselor-mobile-header__brand">Re:Bloom</span>
      </header>
      {!isSidebarCollapsed ? (
        <button
          type="button"
          className="counselor-dashboard-sidebar-backdrop"
          aria-label="상담 아동 목록 닫기"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      ) : null}
      <CounselorSidebar
        isCollapsed={isSidebarCollapsed}
        childItems={childItems}
        selectedChildId={selectedChildId}
        counselorName={counselorName}
        isLoadingChildren={isLoadingChildItems}
        childrenError={childItemsError}
        onToggle={() => setIsSidebarCollapsed((current) => !current)}
        onSelectChild={handleSelectSidebarChild}
        onOpenSettings={handleOpenSettings}
      />

      <section className="counselor-dashboard-main">
        <div className="counselor-dashboard-content">
          {hasSelectedChild && selectedChildProfile && selectedChildId ? (
            <>
              <header className="counselor-dashboard-hero">
                <div>
                  <h2>{selectedChildProfile.name} 님의 관찰 일지</h2>
                  <p className="counselor-dashboard-profile-meta" aria-label="상담 아동 정보">
                    {selectedChildMetaItems.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </p>
                </div>
              </header>

              <div className="counselor-dashboard-grid">
                <div
                  className="counselor-dashboard-column"
                  aria-label="대시보드 주요 정보"
                  ref={mainColumnRef}
                >
                  <DashboardCard
                    title="아이 관찰 기록"
                    info={dashboardInfoMessages.observation}
                  >
                    <WeekNavigator
                      label={observationWeek.currentWeek.label}
                      isFirst={observationWeek.isFirstWeek}
                      isLast={observationWeek.isLastWeek}
                      onPrev={observationWeek.goPrevWeek}
                      onNext={observationWeek.goNextWeek}
                    />
                    <ObservationList
                      records={currentObservationRecords}
                      comments={observationComments}
                      error={observationRecordsError}
                      isLoading={isLoadingObservationRecords}
                      onSelect={setSelectedObservation}
                    />
                  </DashboardCard>

                  <DashboardCard title="수면 점수 추이" info={dashboardInfoMessages.sleepScore}>
                    <WeekNavigator
                      label={sleepScoreWeek.currentWeek.label}
                      isFirst={sleepScoreWeek.isFirstWeek}
                      isLast={sleepScoreWeek.isLastWeek}
                      onPrev={sleepScoreWeek.goPrevWeek}
                      onNext={sleepScoreWeek.goNextWeek}
                    />
                    <BarChart data={sleepScoreData} />
                  </DashboardCard>

                  <DashboardCard
                    title="수면 효율 추이"
                    info={dashboardInfoMessages.sleepEfficiency}
                  >
                    <WeekNavigator
                      label={sleepEfficiencyWeek.currentWeek.label}
                      isFirst={sleepEfficiencyWeek.isFirstWeek}
                      isLast={sleepEfficiencyWeek.isLastWeek}
                      onPrev={sleepEfficiencyWeek.goPrevWeek}
                      onNext={sleepEfficiencyWeek.goNextWeek}
                    />
                    <LineChart
                      data={sleepEfficiencyData}
                      color="#f2a57d"
                    />
                    <p className="counselor-card-note">
                      수면 추세 시간 중 실제로 잠든 시간의 비율을 의미합니다.
                    </p>
                  </DashboardCard>
                </div>
                <div
                  className="counselor-dashboard-column counselor-dashboard-column--analysis"
                  aria-label="대시보드 분석 정보"
                >
                  <ExpressionAnalysis
                    analysis={dashboardExpressionAnalysis}
                    error={dashboardMetricsError}
                    isLoading={isLoadingDashboardMetrics}
                    isFirstWeek={expressionWeek.isFirstWeek}
                    isLastWeek={expressionWeek.isLastWeek}
                    minHeight={analysisCardHeight}
                    weekLabel={expressionWeek.currentWeek.label}
                    childId={selectedChildId}
                    onPrevWeek={expressionWeek.goPrevWeek}
                    onNextWeek={expressionWeek.goNextWeek}
                  />
                </div>
              </div>

              <section className="counselor-biometric-section">
                <div className="counselor-section-title">
                  <h3>생체 데이터</h3>
                </div>
                <div className="counselor-biometric-grid">
                  <DashboardCard
                    title="행동 활성"
                    info={dashboardInfoMessages.biometricRatio}
                  >
                    <WeekNavigator
                      label={biometricRatioWeek.currentWeek.label}
                      isFirst={biometricRatioWeek.isFirstWeek}
                      isLast={biometricRatioWeek.isLastWeek}
                      onPrev={biometricRatioWeek.goPrevWeek}
                      onNext={biometricRatioWeek.goNextWeek}
                    />
                    <LineChart
                      data={biometricRatioData}
                      color="#6B9AC4"
                    />
                    <p className="counselor-card-note">
                      수요일에 행동 활성 지표가 유독 낮게 관찰되며 이후 점진적으로
                      활력을 회복하는 추세입니다.
                    </p>
                  </DashboardCard>

                  <DashboardCard title="자율 신경 안정도" info={dashboardInfoMessages.autonomic}>
                    <WeekNavigator
                      label={autonomicWeek.currentWeek.label}
                      isFirst={autonomicWeek.isFirstWeek}
                      isLast={autonomicWeek.isLastWeek}
                      onPrev={autonomicWeek.goPrevWeek}
                      onNext={autonomicWeek.goNextWeek}
                    />
                    <LineChart
                      data={autonomicData}
                      color="#9b78f0"
                    />
                    <p className="counselor-card-note">
                      주말로 갈수록 RMSSD 수치가 상승하며 자율 신경 안정도가 개선이
                      되는 추세입니다.
                    </p>
                  </DashboardCard>
                </div>
              </section>

              <section className="counselor-dashboard-floating-summary" aria-label="요약 지표">
                <span>
                  <FiFileText aria-hidden="true" /> 관찰 3건
                </span>
                <span>
                  <FiMoon aria-hidden="true" /> 수면 주의
                </span>
                <span>
                  <FiActivity aria-hidden="true" /> 활동 감소
                </span>
                <span>
                  <FiHeart aria-hidden="true" /> 정서 안정 관찰
                </span>
              </section>
            </>
          ) : (
            <section
              className={`counselor-dashboard-empty${
                childItemsError ? ' is-error' : ''
              }`}
            >
              <h2>{dashboardEmptyTitle}</h2>
              <p>{dashboardEmptyMessage}</p>
            </section>
          )}
        </div>
      </section>

      {selectedObservation ? (
        <ObservationCommentModal
          record={selectedObservation}
          comment={selectedObservationComment}
          error={observationCommentError}
          isCommentLoading={isLoadingObservationComment}
          isSubmitting={isSubmittingObservationComment}
          onClose={() => setSelectedObservation(null)}
          onSave={handleSaveObservationComment}
          onDelete={handleDeleteObservationComment}
        />
      ) : null}

      <button
        type="button"
        className="counselor-connection-floating-button"
        aria-label="상담사 연결 신청 알림 열기"
        onClick={() => setIsConnectionModalOpen(true)}
      >
        <FiBell aria-hidden="true" />
        {connectionRequests.length > 0 ? (
          <span>{connectionRequests.length}</span>
        ) : null}
      </button>

      {isConnectionModalOpen ? (
        <CounselorConnectionModal
          canRejectRequests={canRejectConnectionRequests}
          error={connectionRequestsError}
          isLoading={isLoadingConnectionRequests}
          requests={connectionRequests}
          onAccept={handleAcceptConnectionRequest}
          onReject={handleRejectConnectionRequest}
          onClose={() => setIsConnectionModalOpen(false)}
        />
      ) : null}
    </main>
  )
}

export default CounselorDashboardPage
