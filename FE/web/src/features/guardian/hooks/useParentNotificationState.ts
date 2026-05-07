import { useState } from 'react'

import {
  parentNotifications,
  type ParentNotificationItem,
} from '../constants/parentNotifications'

function useParentNotificationState(initialItems: ParentNotificationItem[] = parentNotifications) {
  const [notifications, setNotifications] = useState<ParentNotificationItem[]>(() => initialItems)

  const markAsRead = (notificationId: string) => {
    setNotifications((currentItems) =>
      currentItems.map((item) =>
        item.id === notificationId && item.unread ? { ...item, unread: false } : item
      )
    )
  }

  const chooseAction = (notificationId: string, actionKey: string) => {
    setNotifications((currentItems) =>
      currentItems.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              unread: false,
              selectedActionKey: actionKey,
            }
          : item
      )
    )
  }

  return {
    notifications,
    markAsRead,
    chooseAction,
  }
}

export default useParentNotificationState
