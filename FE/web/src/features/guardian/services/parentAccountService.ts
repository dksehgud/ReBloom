import { parentAccountApi } from '../api/parentAccountApi'
import { parentAccountMockApi } from '../api/parentAccountMockApi'

type ParentAccountApiClient = typeof parentAccountApi

function getParentAccountApi(isMockMode: boolean): ParentAccountApiClient {
  return isMockMode ? parentAccountMockApi : parentAccountApi
}

export { getParentAccountApi }
export type { ParentAccountApiClient }
