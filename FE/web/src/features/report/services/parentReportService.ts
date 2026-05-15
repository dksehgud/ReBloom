import { parentReportApi } from '../api/parentReportApi'
import { parentReportMockApi } from '../api/parentReportMockApi'

type ParentReportApiClient = typeof parentReportApi

function getParentReportApi(
  isMockMode: boolean,
  mockWeekIndex?: number,
): ParentReportApiClient {
  if (!isMockMode) {
    return parentReportApi
  }

  return {
    getParentDiaryEmotions: (params) =>
      parentReportMockApi.getParentDiaryEmotions({
        ...params,
        mockWeekIndex,
      }),
    getParentHrAccRatios: (params) =>
      parentReportMockApi.getParentHrAccRatios({
        ...params,
        mockWeekIndex,
      }),
    getParentRmssds: (params) =>
      parentReportMockApi.getParentRmssds({
        ...params,
        mockWeekIndex,
      }),
    getParentSleepScores: (params) =>
      parentReportMockApi.getParentSleepScores({
        ...params,
        mockWeekIndex,
      }),
  }
}

export { getParentReportApi }
export type { ParentReportApiClient }
