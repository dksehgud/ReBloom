import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'

type DiaryDeleteConfirmModalProps = {
  onCancel?: () => void
  onConfirm?: () => void
}

function DiaryDeleteConfirmModal({
  onCancel,
  onConfirm,
}: DiaryDeleteConfirmModalProps) {
  return (
    <CommonModalLayout
      title="일기를 삭제할까요?"
      className="diary-delete-modal"
      overlayClassName="diary-delete-modal-overlay"
      bodyClassName="diary-delete-modal__body"
      actionsClassName="diary-delete-modal__actions"
      onClose={onCancel}
      titleAlign="center"
      actions={
        <>
          <button
            type="button"
            className="diary-delete-modal__button is-secondary"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="diary-delete-modal__button is-danger"
            onClick={onConfirm}
          >
            삭제
          </button>
        </>
      }
    >
      <p className="diary-delete-modal__message">
        삭제한 일기는 다시 되돌릴 수 없어요.
      </p>
    </CommonModalLayout>
  )
}

export type { DiaryDeleteConfirmModalProps }

export default DiaryDeleteConfirmModal
