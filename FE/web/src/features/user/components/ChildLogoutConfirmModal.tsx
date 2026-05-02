import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'

type ChildLogoutConfirmModalProps = {
  onCancel: () => void
  onConfirm: () => void
}

function ChildLogoutConfirmModal({
  onCancel,
  onConfirm,
}: ChildLogoutConfirmModalProps) {
  return (
    <CommonModalLayout
      className="child-logout-confirm-modal"
      bodyClassName="child-logout-confirm-modal__body"
      actionsClassName="child-logout-confirm-modal__actions"
      title="로그아웃"
      titleAlign="center"
      actions={
        <>
          <button type="button" className="auth-button is-secondary" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="auth-button is-primary" onClick={onConfirm}>
            로그아웃
          </button>
        </>
      }
    >
      <p className="child-logout-confirm-modal__message">정말 로그아웃할까요?</p>
    </CommonModalLayout>
  )
}

export default ChildLogoutConfirmModal
