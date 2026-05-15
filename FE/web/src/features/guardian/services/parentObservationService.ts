import { parentObservationApi } from '../api/parentObservationApi'
import { parentObservationMockApi } from '../api/parentObservationMockApi'

type ParentObservationApiClient = typeof parentObservationApi

function getParentObservationApi(isMockMode: boolean): ParentObservationApiClient {
  return isMockMode ? parentObservationMockApi : parentObservationApi
}

export { getParentObservationApi }
export type { ParentObservationApiClient }
