const COUNSELOR_SELECTED_CHILD_STORAGE_KEY = 'rebloom:counselor:selectedChildId'

function getStoredCounselorSelectedChildId() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage.getItem(COUNSELOR_SELECTED_CHILD_STORAGE_KEY)
}

function setStoredCounselorSelectedChildId(childId: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(COUNSELOR_SELECTED_CHILD_STORAGE_KEY, childId)
}

function clearStoredCounselorSelectedChildId() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(COUNSELOR_SELECTED_CHILD_STORAGE_KEY)
}

function syncStoredCounselorSelectedChildId(childId: string | null) {
  if (childId) {
    setStoredCounselorSelectedChildId(childId)
    return
  }

  clearStoredCounselorSelectedChildId()
}

export {
  clearStoredCounselorSelectedChildId,
  getStoredCounselorSelectedChildId,
  setStoredCounselorSelectedChildId,
  syncStoredCounselorSelectedChildId,
}
