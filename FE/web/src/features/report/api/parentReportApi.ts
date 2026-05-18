import { apiRequest } from '../../../shared/api/client'
import {
  childChartApiPaths,
  getChildHrAccRatios,
  getChildRmssds,
  getChildSleepScores,
} from '../../../shared/api/childChartApi'
import type {
  BaseResponseDto,
  ParentDiaryEmotionResponseDto,
  ParentStatusCardDto,
} from '../types/parentReport'

type ParentReportApiParams = {
  accessToken?: string | null
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
  hrAccRatios: childChartApiPaths.hrAccRatios,
  rmssds: childChartApiPaths.rmssds,
  sleepScores: childChartApiPaths.sleepScores,
  statusCard: ({ childrenId }: Pick<ParentReportApiParams, 'childrenId'>) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/status-cards`,
}

function unwrapApiData<T>(response: BaseResponseDto<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return ((response as BaseResponseDto<T>).data ?? null) as T
  }

  return response as T
}

function unwrapNullableApiData<T>(response: BaseResponseDto<T> | T | null): T | null {
  if (!response) {
    return null
  }

  if (
    typeof response === 'object' &&
    ('code' in response || 'data' in response || 'message' in response)
  ) {
    const body = response as BaseResponseDto<T>

    if (body.code) {
      throw new Error(body.message ?? 'API 요청에 실패했습니다.')
    }

    return body.data ?? null
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

async function getParentStatusCard({
  accessToken,
  childrenId,
}: ParentReportApiParams) {
  const response = await apiRequest<
    BaseResponseDto<ParentStatusCardDto> | ParentStatusCardDto | null
  >(parentReportApiPaths.statusCard({ childrenId }), {
    accessToken,
    errorMessage: '보호자 상태 카드를 불러오지 못했습니다.',
    sessionRole: 'parent',
  })

  return unwrapNullableApiData(response)
}

async function getParentSleepScores({
  accessToken,
  baseDate,
  childrenId,
}: ParentChartParams) {
  return getChildSleepScores({ accessToken, baseDate, childrenId })
}

async function getParentHrAccRatios({
  accessToken,
  baseDate,
  childrenId,
}: ParentChartParams) {
  return getChildHrAccRatios({ accessToken, baseDate, childrenId })
}

async function getParentRmssds({
  accessToken,
  baseDate,
  childrenId,
}: ParentChartParams) {
  return getChildRmssds({ accessToken, baseDate, childrenId })
}

const parentReportApi = {
  getParentDiaryEmotions,
  getParentHrAccRatios,
  getParentRmssds,
  getParentSleepScores,
  getParentStatusCard,
}

export type {
  ParentChartParams,
  ParentDiaryEmotionParams,
  ParentReportApiParams,
}
export {
  getParentDiaryEmotions,
  getParentHrAccRatios,
  getParentRmssds,
  getParentSleepScores,
  getParentStatusCard,
  parentReportApi,
  parentReportApiPaths,
}
