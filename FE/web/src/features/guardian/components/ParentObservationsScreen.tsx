import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import MobilePageLayout from '../../../components/templates/MobilePageLayout/MobilePageLayout'
import { useParentConnectedChild } from '../hooks/useParentConnectedChild'
import { useParentObservationPageState } from '../hooks/useParentObservationPageState'
import type { ParentObservationOpenRequest } from '../hooks/useParentObservationPageState'
import ParentBottomNavigation from './ParentBottomNavigation'
import ParentObservationCalendar from './ParentObservationCalendar'
import ParentObservationDeleteModal from './ParentObservationDeleteModal'
import ParentObservationDetailModal from './ParentObservationDetailModal'
import ParentObservationFormModal from './ParentObservationFormModal'
import ParentObservationListSection from './ParentObservationListSection'

function ParentObservationsHeader({ childName }: { childName?: string }) {
  return (
    <div className="parent-home-page__header">
      <div className="parent-home-page__header-copy">
        <h1 className="parent-home-page__title">아이 관찰 기록</h1>
        <p className="parent-home-page__subtitle">
          {childName ? `${childName} 부모님` : '보호자님'}
        </p>
      </div>
    </div>
  )
}

function getParentObservationOpenRequest(
  state: unknown,
): ParentObservationOpenRequest | null {
  if (!state || typeof state !== 'object') {
    return null
  }

  const navigationState = state as {
    openObservationChildrenId?: unknown
    openObservationReportId?: unknown
  }

  if (typeof navigationState.openObservationReportId !== 'string') {
    return null
  }

  return {
    childrenId:
      typeof navigationState.openObservationChildrenId === 'string'
        ? navigationState.openObservationChildrenId
        : null,
    reportId: navigationState.openObservationReportId,
  }
}

function ParentObservationsScreen() {
  const location = useLocation()
  const { isLoading: isChildLoading, selectedChild } = useParentConnectedChild()
  const hasConnectedChild = Boolean(selectedChild?.id)
  const openRequest = useMemo(
    () => getParentObservationOpenRequest(location.state),
    [location.state],
  )
  const {
    currentYear,
    currentMonth,
    markedDays,
    selectedDay,
    selectedDateLabel,
    selectedDateRecords,
    selectedRecord,
    detailDateLabel,
    detailRecordPosition,
    detailRecordCount,
    draftDateLabel,
    draftMood,
    draftDescription,
    modalMode,
    isLoading,
    isError,
    canDraftNextDate,
    canDraftPreviousDate,
    hasPreviousDetailRecord,
    hasNextDetailRecord,
    isDraftSubmitDisabled,
    handlePreviousMonth,
    handleNextMonth,
    handleSelectDay,
    handleSelectRecord,
    handleCloseModal,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDelete,
    handleConfirmDelete,
    handleViewPreviousRecord,
    handleViewNextRecord,
    handleDraftPreviousDate,
    handleDraftNextDate,
    handleSelectDraftMood,
    handleDraftDescriptionChange,
    handleSubmitDraft,
  } = useParentObservationPageState(selectedChild?.id, openRequest)

  return (
    <MobilePageLayout
      header={<ParentObservationsHeader childName={selectedChild?.name} />}
      className="parent-home-page"
      contentClassName="parent-observations-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <div className="parent-observations-page__body">
        <ParentObservationCalendar
          year={currentYear}
          month={currentMonth}
          markedDays={markedDays}
          selectedDay={selectedDay}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onSelectDay={handleSelectDay}
        />
        <ParentObservationListSection
          records={selectedDateRecords}
          selectedDateLabel={selectedDateLabel}
          currentMonthLabel={`${currentMonth}월`}
          emptyDescription={
            hasConnectedChild
              ? undefined
              : '아이 계정 회원가입 시 부모 정보를 입력하면 관찰 기록을 입력할 수 있어요.'
          }
          emptyMessage={hasConnectedChild ? undefined : '아직 연결된 아이가 없습니다.'}
          isLoading={isChildLoading || isLoading}
          isError={isError}
          onAddRecord={hasConnectedChild ? handleOpenCreate : undefined}
          onSelectRecord={hasConnectedChild ? handleSelectRecord : undefined}
        />
      </div>

      {modalMode === 'detail' && selectedRecord ? (
        <ParentObservationDetailModal
          record={selectedRecord}
          dateLabel={detailDateLabel}
          currentPosition={detailRecordPosition}
          totalCount={detailRecordCount}
          hasPrevious={hasPreviousDetailRecord}
          hasNext={hasNextDetailRecord}
          onClose={handleCloseModal}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onPrevious={handleViewPreviousRecord}
          onNext={handleViewNextRecord}
        />
      ) : null}

      {modalMode === 'create' || modalMode === 'edit' ? (
        <ParentObservationFormModal
          mode={modalMode}
          dateLabel={draftDateLabel}
          selectedMood={draftMood}
          content={draftDescription}
          canGoNextDate={canDraftNextDate}
          canGoPreviousDate={canDraftPreviousDate}
          isSubmitDisabled={isDraftSubmitDisabled}
          onClose={handleCloseModal}
          onPreviousDate={handleDraftPreviousDate}
          onNextDate={handleDraftNextDate}
          onSelectMood={handleSelectDraftMood}
          onContentChange={handleDraftDescriptionChange}
          onSubmit={handleSubmitDraft}
        />
      ) : null}

      {modalMode === 'delete' ? (
        <ParentObservationDeleteModal
          onCancel={handleCloseModal}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </MobilePageLayout>
  )
}

export default ParentObservationsScreen
