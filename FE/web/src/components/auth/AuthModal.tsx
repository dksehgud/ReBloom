import type { ReactNode } from 'react'

import CommonModalLayout from '../organisms/Modal/CommonModalLayout'

type AuthModalProps = {
  title: string
  children: ReactNode
  actions: ReactNode
}

function AuthModal({ title, children, actions }: AuthModalProps) {
  return (
    <CommonModalLayout
      actions={actions}
      actionsClassName="auth-modal-actions"
      bodyClassName="auth-modal-body"
      className="auth-modal"
      overlayClassName="auth-overlay"
      title={title}
      titleAlign="center"
    >
      {children}
    </CommonModalLayout>
  )
}

export default AuthModal
