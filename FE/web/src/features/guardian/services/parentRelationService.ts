import { parentRelationApi } from '../api/parentRelationApi'
import { parentRelationMockApi } from '../api/parentRelationMockApi'

type ParentRelationApiClient = typeof parentRelationApi

function getParentRelationApi(isMockMode: boolean): ParentRelationApiClient {
  return isMockMode ? parentRelationMockApi : parentRelationApi
}

export { getParentRelationApi }
export type { ParentRelationApiClient }
