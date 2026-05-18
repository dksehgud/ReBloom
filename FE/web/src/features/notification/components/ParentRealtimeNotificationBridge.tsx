import { useEffect } from 'react'

import { authApi } from '../../auth/api/authApi'
import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { subscribeParentNotifications } from '../api/parentNotificationSse'
import { useParentRealtimeNotificationStore } from '../store/useParentRealtimeNotificationStore'

type ParentRealtimeNotificationBridgeProps = {
  isMockMode: boolean
}

function ParentRealtimeNotificationBridge({
  isMockMode,
}: ParentRealtimeNotificationBridgeProps) {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const refreshToken = useAppSessionStore((state) => state.refreshToken)
  const clearSession = useAppSessionStore((state) => state.clearSession)
  const setSessionTokens = useAppSessionStore((state) => state.setSessionTokens)
  const receiveNotification = useParentRealtimeNotificationStore(
    (state) => state.receiveNotification,
  )

  useEffect(() => {
    if (isMockMode || !accessToken) {
      return undefined
    }

    return subscribeParentNotifications({
      accessToken,
      refreshToken,
      reissueAccessToken: authApi.reissue,
      onAuthExpired: () => {
        clearSession('parent')
      },
      onError: (error) => {
        console.error(error)
      },
      onNotification: receiveNotification,
      onTokenRefresh: (tokens) => {
        setSessionTokens(tokens, 'parent')
      },
    })
  }, [
    accessToken,
    clearSession,
    isMockMode,
    receiveNotification,
    refreshToken,
    setSessionTokens,
  ])

  return null
}

export default ParentRealtimeNotificationBridge
