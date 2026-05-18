declare global {
  interface Window {
    Android?: {
      saveToken?: (token: string) => void
      clearToken?: () => void
      clearHistory?: () => void
      checkSleepPermission?: () => void
      startBleProvisioning?: (payloadJson?: string) => void
    }
  }
}

type FcmSupportedNativeRole = 'child' | 'parent'

function isFcmSupportedNativeRole(
  role: string | null | undefined,
): role is FcmSupportedNativeRole {
  return role === 'child' || role === 'parent'
}

function saveNativeAccessToken(
  accessToken: string | null | undefined,
  role?: string | null,
) {
  if (!accessToken || typeof window === 'undefined') {
    return
  }

  if (!isFcmSupportedNativeRole(role)) {
    return
  }

  window.Android?.saveToken?.(accessToken)
}

function clearNativeAccessToken() {
  if (typeof window === 'undefined') {
    return
  }

  window.Android?.clearToken?.()
}

function clearNativeNavigationHistory() {
  if (typeof window === 'undefined') {
    return
  }

  window.Android?.clearHistory?.()
}

function requestNativeSleepPermission() {
  if (typeof window === 'undefined') {
    return
  }

  window.Android?.checkSleepPermission?.()
}

type BleProvisioningContext = {
  childrenId?: string | null
  role: 'child' | 'parent'
}

function startNativeBleProvisioning(context?: BleProvisioningContext) {
  if (typeof window === 'undefined') {
    return false
  }

  if (!window.Android?.startBleProvisioning) {
    return false
  }

  window.Android.startBleProvisioning(JSON.stringify(context ?? { role: 'child' }))
  return true
}

export {
  clearNativeAccessToken,
  clearNativeNavigationHistory,
  requestNativeSleepPermission,
  saveNativeAccessToken,
  startNativeBleProvisioning,
}
