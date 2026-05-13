import { apiRequest } from '../../../shared/api/client'
import {
  childChartApiPaths,
  getChildRmssds,
  getChildSleepScores,
} from '../../../shared/api/childChartApi'
import type {
  BaseResponseDto,
  ParentDiaryEmotionResponseDto,
} from '../types/parentReport'

type ParentReportApiParams = {
  accessToken: string
  childrenId: string
}

type ParentDiaryEmotionParams = ParentReportApiParams & {
  endDate: string
  startDate: string
}

type ParentChartParams = ParentReportApiParams & {
  baseDate: string
}

const REPORT_API_PREFIX = '/report/api/v1'

const parentReportApiPaths = {
  diaryEmotions: ({
    childrenId,
    endDate,
    startDate,
  }: Omit<ParentDiaryEmotionParams, 'accessToken'>) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/diaries/emotions?startDate=${startDate}&endDate=${endDate}`,
  rmssds: childChartApiPaths.rmssds,
  sleepScores: childChartApiPaths.sleepScores,
}

function unwrapApiData<T>(response: BaseResponseDto<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return ((response as BaseResponseDto<T>).data ?? null) as T
  }

  return response as T
}

async function getParentDiaryEmotions({
  accessToken,
  childrenId,
  endDate,
  startDate,
}: ParentDiaryEmotionParams) {
  const response = await apiRequest<
    BaseResponseDto<ParentDiaryEmotionResponseDto> | ParentDiaryEmotionResponseDto
  >(parentReportApiPaths.diaryEmotions({ childrenId, endDate, startDate }), {
    accessToken,
    errorMessage: '보호자 리포트 감정 기록을 불러오지 못했습니다.',
  })

  return unwrapApiData(response)
}

async function getParentSleepScores({
  accessToken,
  baseDate,
  childrenId,
}: ParentChartParams) {
  return getChildSleepScores({ accessToken, baseDate, childrenId })
}

async function getParentRmssds({
  accessToken,
  baseDate,
  childrenId,
}: ParentChartParams) {
  return getChildRmssds({ accessToken, baseDate, childrenId })
}

export {
  getParentDiaryEmotions,
  getParentRmssds,
  getParentSleepScores,
  parentReportApiPaths,
}
