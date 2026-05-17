import { counselorNotificationApi } from '../api/counselorNotificationApi'
import { counselorNotificationMockApi } from '../api/counselorNotificationMockApi'

type CounselorNotificationApiClient = typeof counselorNotificationApi

function getCounselorNotificationApi(
  isMockMode: boolean,
): CounselorNotificationApiClient {
  return isMockMode ? counselorNotificationMockApi : counselorNotificationApi
}

export { getCounselorNotificationApi }
export type { CounselorNotificationApiClient }
