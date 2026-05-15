import type { PasswordChangeRequest } from '../../auth/api/authApi'

async function verifyParentPassword(password: string): Promise<void> {
  if (!password.trim()) {
    throw new Error('현재 비밀번호를 입력해 주세요.')
  }
}

async function changeParentPassword({
  currentPassword,
  newPassword,
  newPasswordConfirm,
}: PasswordChangeRequest): Promise<void> {
  if (!currentPassword.trim()) {
    throw new Error('현재 비밀번호를 입력해 주세요.')
  }

  if (!newPassword.trim() || !newPasswordConfirm.trim()) {
    throw new Error('새 비밀번호를 입력해 주세요.')
  }

  if (newPassword !== newPasswordConfirm) {
    throw new Error('새 비밀번호가 일치하지 않습니다.')
  }
}

const parentAccountMockApi = {
  changeParentPassword,
  verifyParentPassword,
}

export {
  changeParentPassword,
  parentAccountMockApi,
  verifyParentPassword,
}
