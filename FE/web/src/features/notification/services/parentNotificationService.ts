import { parentNotificationApi } from '../api/parentNotificationApi'
import { parentNotificationMockApi } from '../api/parentNotificationMockApi'

type ParentNotificationApiClient = typeof parentNotificationApi

function getParentNotificationApi(isMockMode: boolean): ParentNotificationApiClient {
  return isMockMode ? parentNotificationMockApi : parentNotificationApi
}

export { getParentNotificationApi }
export type { ParentNotificationApiClient }
