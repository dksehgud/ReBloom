import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'

type ParentObservationDeleteModalProps = {
  onCancel?: () => void
  onConfirm?: () => void
}

function ParentObservationDeleteModal({
  onCancel,
  onConfirm,
}: ParentObservationDeleteModalProps) {
  return (
    <CommonModalLayout
      title="기록 삭제"
      className="parent-observation-delete-modal"
      bodyClassName="parent-observation-delete-modal__body"
      actionsClassName="parent-observation-delete-modal__actions"
      onClose={onCancel}
      titleAlign="center"
      actions={
        <>
          <button
            type="button"
            className="parent-observation-delete-modal__button is-secondary"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="parent-observation-delete-modal__button is-danger"
            onClick={onConfirm}
          >
            삭제
          </button>
        </>
      }
    >
      <p className="parent-observation-delete-modal__message">
        이 관찰 기록을 삭제하시겠습니까?
      </p>
    </CommonModalLayout>
  )
}

export default ParentObservationDeleteModal
