import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import ParentObservationCalendar from '../../features/guardian/components/ParentObservationCalendar'
import ParentObservationDetailModal from '../../features/guardian/components/ParentObservationDetailModal'
import ParentObservationFormModal from '../../features/guardian/components/ParentObservationFormModal'
import ParentObservationListSection from '../../features/guardian/components/ParentObservationListSection'
import { useParentObservationPageState } from '../../features/guardian/hooks/useParentObservationPageState'

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
  const {
    currentYear,
    currentMonth,
    markedDays,
    selectedDay,
    selectedDateLabel,
    selectedDateRecords,
    selectedRecord,
    detailDateLabel,
    draftDateLabel,
    draftMood,
    draftDescription,
    modalMode,
    isLoading,
    isError,
    isDraftSubmitDisabled,
    handlePreviousMonth,
    handleNextMonth,
    handleSelectDay,
    handleSelectRecord,
    handleCloseModal,
    handleOpenCreate,
    handleOpenEdit,
    handleDraftPreviousDate,
    handleDraftNextDate,
    handleSelectDraftMood,
    handleDraftDescriptionChange,
    handleSubmitDraft,
  } = useParentObservationPageState()

  return (
    <MobilePageLayout
      header={<ParentObservationsHeader />}
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
          isLoading={isLoading}
          isError={isError}
          onAddRecord={handleOpenCreate}
          onSelectRecord={handleSelectRecord}
        />
      </div>

      {modalMode === 'detail' && selectedRecord ? (
        <ParentObservationDetailModal
          record={selectedRecord}
          dateLabel={detailDateLabel}
          onClose={handleCloseModal}
          onEdit={handleOpenEdit}
        />
      ) : null}

      {modalMode === 'create' || modalMode === 'edit' ? (
        <ParentObservationFormModal
          mode={modalMode}
          dateLabel={draftDateLabel}
          selectedMood={draftMood}
          content={draftDescription}
          isSubmitDisabled={isDraftSubmitDisabled}
          onClose={handleCloseModal}
          onPreviousDate={handleDraftPreviousDate}
          onNextDate={handleDraftNextDate}
          onSelectMood={handleSelectDraftMood}
          onContentChange={handleDraftDescriptionChange}
          onSubmit={handleSubmitDraft}
        />
      ) : null}
    </MobilePageLayout>
  )
}

export default ParentObservationsPage
