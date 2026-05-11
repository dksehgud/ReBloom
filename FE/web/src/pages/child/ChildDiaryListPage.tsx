import ChildFloatingActionButton from '../../components/organisms/FloatingActionButton/ChildFloatingActionButton'
import ChildHeader from '../../components/organisms/Header/ChildHeader'
import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import DiaryCalendar from '../../features/diary/components/DiaryCalendar'
import DiaryDetailView from '../../features/diary/components/DiaryDetailView'
import DiaryDeleteConfirmModal from '../../features/diary/components/DiaryDeleteConfirmModal'
import DiaryEmotionSelectModal from '../../features/diary/components/DiaryEmotionSelectModal'
import DiaryListView from '../../features/diary/components/DiaryListView'
import DiaryWriteView from '../../features/diary/components/DiaryWriteView'
import { useChildDiaryPageState } from '../../features/diary/hooks/useChildDiaryPageState'

type ChildDiaryListPageProps = {
  onOpenSettings?: () => void
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 7H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5 12H16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M5 17H14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.9 4.5H13.1L13.6 6.3C14 6.5 14.4 6.7 14.8 7L16.6 6.3L18.1 7.8L17.4 9.6C17.7 10 17.9 10.4 18.1 10.8L19.9 11.3V13.5L18.1 14C17.9 14.4 17.7 14.8 17.4 15.2L18.1 17L16.6 18.5L14.8 17.8C14.4 18.1 14 18.3 13.6 18.5L13.1 20.3H10.9L10.4 18.5C10 18.3 9.6 18.1 9.2 17.8L7.4 18.5L5.9 17L6.6 15.2C6.3 14.8 6.1 14.4 5.9 14L4.1 13.5V11.3L5.9 10.8C6.1 10.4 6.3 10 6.6 9.6L5.9 7.8L7.4 6.3L9.2 7C9.6 6.7 10 6.5 10.4 6.3L10.9 4.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12.4" r="2.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ChildDiaryListPage({ onOpenSettings }: ChildDiaryListPageProps) {
  const {
    currentMonth,
    currentYear,
    viewMode,
    calendarEntries,
    listItems,
    selectedRecord,
    detailDateLabel,
    writeDateLabel,
    draftContent,
    draftEmotionKey,
    isEmotionModalOpen,
    isDeleteModalOpen,
    isWriteSubmitDisabled,
    handlePreviousMonth,
    handleNextMonth,
    handleToggleViewMode,
    handleCalendarEntryClick,
    handleCalendarDayClick,
    handleListItemClick,
    handleBackFromDetail,
    handleOpenWrite,
    handleOpenEdit,
    handleBackFromWrite,
    handleOpenEmotionModal,
    handleCloseEmotionModal,
    handleSelectEmotion,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleSubmitWrite,
    setDraftContent,
  } = useChildDiaryPageState()

  const header =
    viewMode === 'detail' || viewMode === 'write' ? undefined : (
      <ChildHeader
        mode="brand"
        rightSlot={
          <>
            <button
              type="button"
              className="child-header-icon-button"
              aria-label={viewMode === 'calendar' ? '일기 목록 보기' : '캘린더 보기'}
              onClick={handleToggleViewMode}
            >
              <MenuIcon />
            </button>
            <button
              type="button"
              className="child-header-icon-button"
              aria-label="설정"
              onClick={onOpenSettings}
            >
              <SettingsIcon />
            </button>
          </>
        }
      />
    )

  return (
    <MobilePageLayout
      className="child-diary-list-page"
      contentClassName={`child-diary-list-page__content child-diary-list-page__content--${viewMode}`}
      header={header}
    >
      <div className={`child-diary-list-page__body child-diary-list-page__body--${viewMode}`}>
        {viewMode === 'calendar' ? (
          <>
            <DiaryCalendar
              year={currentYear}
              month={currentMonth}
              entries={calendarEntries}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              onEntryClick={handleCalendarEntryClick}
              onDayClick={handleCalendarDayClick}
            />
            <ChildFloatingActionButton ariaLabel="일기 작성" onClick={handleOpenWrite} />
          </>
        ) : null}

        {viewMode === 'list' ? (
          <>
            <DiaryListView
              year={currentYear}
              month={currentMonth}
              items={listItems}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              onItemClick={handleListItemClick}
            />
            <ChildFloatingActionButton ariaLabel="일기 작성" onClick={handleOpenWrite} />
          </>
        ) : null}

        {viewMode === 'detail' && selectedRecord ? (
          <>
            <DiaryDetailView
              dateLabel={detailDateLabel}
              emotionKey={selectedRecord.emotionKey}
              content={selectedRecord.content}
              onBack={handleBackFromDetail}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDeleteModal}
            />
            {isDeleteModalOpen ? (
              <DiaryDeleteConfirmModal
                onCancel={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
              />
            ) : null}
          </>
        ) : null}

        {viewMode === 'write' ? (
          <>
            <DiaryWriteView
              dateLabel={writeDateLabel}
              content={draftContent}
              emotionKey={draftEmotionKey}
              isSubmitDisabled={isWriteSubmitDisabled}
              onBack={handleBackFromWrite}
              onMoodClick={handleOpenEmotionModal}
              onContentChange={(event) => setDraftContent(event.target.value)}
              onSubmit={handleSubmitWrite}
            />
            {isEmotionModalOpen ? (
              <DiaryEmotionSelectModal
                selectedEmotionKey={draftEmotionKey}
                onClose={handleCloseEmotionModal}
                onSelect={handleSelectEmotion}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </MobilePageLayout>
  )
}

export default ChildDiaryListPage
