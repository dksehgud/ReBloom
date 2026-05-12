import { apiRequest } from '../../../shared/api/client'
import type {
  BaseResponseDto,
  ListResponseDto,
  ParentChartPointDto,
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
const BIOMETRIC_API_PREFIX = '/biometric/api/v1'

const parentReportApiPaths = {
  diaryEmotions: ({ childrenId, startDate, endDate }: Omit<ParentDiaryEmotionParams, 'accessToken'>) =>
    `${REPORT_API_PREFIX}/children/${childrenId}/diaries/emotions?startDate=${startDate}&endDate=${endDate}`,
  rmssds: ({ childrenId, baseDate }: Omit<ParentChartParams, 'accessToken'>) =>
    `${BIOMETRIC_API_PREFIX}/children/${childrenId}/charts/biometrics/rmssds?baseDate=${baseDate}`,
  sleepScores: ({ childrenId, baseDate }: Omit<ParentChartParams, 'accessToken'>) =>
    `${BIOMETRIC_API_PREFIX}/children/${childrenId}/charts/sleeps/scores?baseDate=${baseDate}`,
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
  >(parentReportApiPaths.diaryEmotions({ childrenId, startDate, endDate }), {
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
  const response = await apiRequest<
    BaseResponseDto<ListResponseDto<ParentChartPointDto>> | ListResponseDto<ParentChartPointDto>
  >(parentReportApiPaths.sleepScores({ childrenId, baseDate }), {
    accessToken,
    errorMessage: '보호자 리포트 수면 점수를 불러오지 못했습니다.',
  })

  return unwrapApiData(response)
}

async function getParentRmssds({
  accessToken,
  baseDate,
  childrenId,
}: ParentChartParams) {
  const response = await apiRequest<
    BaseResponseDto<ListResponseDto<ParentChartPointDto>> | ListResponseDto<ParentChartPointDto>
  >(parentReportApiPaths.rmssds({ childrenId, baseDate }), {
    accessToken,
    errorMessage: '보호자 리포트 자율신경 안정도를 불러오지 못했습니다.',
  })

  return unwrapApiData(response)
}

export {
  getParentDiaryEmotions,
  getParentRmssds,
  getParentSleepScores,
  parentReportApiPaths,
}
