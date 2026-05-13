import { apiRequest } from './client'

type BaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

type ListResponseDto<T> = {
  contents?: T[] | null
  count?: number | null
}

type ChildChartPointDto = {
  date: string
  dayOfWeek?: string | null
  dayLabel?: string | null
  value?: number | null
}

type ChildChartParams = {
  accessToken?: string | null
  baseDate: string
  childrenId: string
}

class ChildChartApiError extends Error {
  code?: string

  constructor(message: string, code?: string | null) {
    super(message)
    this.name = 'ChildChartApiError'
    this.code = code ?? undefined
  }
}

const BIOMETRIC_API_PREFIX = '/biometric/api/v1'

const childChartApiPaths = {
  hrAccRatios: ({ baseDate, childrenId }: Omit<ChildChartParams, 'accessToken'>) =>
    `${BIOMETRIC_API_PREFIX}/children/${encodeURIComponent(
      childrenId,
    )}/charts/biometrics/hr-acc-ratios?baseDate=${baseDate}`,
  rmssds: ({ baseDate, childrenId }: Omit<ChildChartParams, 'accessToken'>) =>
    `${BIOMETRIC_API_PREFIX}/children/${encodeURIComponent(
      childrenId,
    )}/charts/biometrics/rmssds?baseDate=${baseDate}`,
  sleepEfficiencies: ({
    baseDate,
    childrenId,
  }: Omit<ChildChartParams, 'accessToken'>) =>
    `${BIOMETRIC_API_PREFIX}/children/${encodeURIComponent(
      childrenId,
    )}/charts/sleeps/efficiencies?baseDate=${baseDate}`,
  sleepScores: ({ baseDate, childrenId }: Omit<ChildChartParams, 'accessToken'>) =>
    `${BIOMETRIC_API_PREFIX}/children/${encodeURIComponent(
      childrenId,
    )}/charts/sleeps/scores?baseDate=${baseDate}`,
}

function unwrapApiData<T>(response: BaseResponseDto<T> | T, fallbackMessage: string): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const body = response as BaseResponseDto<T>

    if (body.code) {
      throw new ChildChartApiError(body.message ?? fallbackMessage, body.code)
    }

    return (body.data ?? null) as T
  }

  return response as T
}

async function getChildChart(
  path: string,
  accessToken: string | null | undefined,
  errorMessage: string,
) {
  const response = await apiRequest<
    BaseResponseDto<ListResponseDto<ChildChartPointDto>> | ListResponseDto<ChildChartPointDto>
  >(path, {
    accessToken,
    errorMessage,
  })

  return unwrapApiData(response, errorMessage)
}

async function getChildSleepScores({
  accessToken,
  baseDate,
  childrenId,
}: ChildChartParams) {
  return getChildChart(
    childChartApiPaths.sleepScores({ baseDate, childrenId }),
    accessToken,
    '수면 점수 데이터를 불러오지 못했습니다.',
  )
}

async function getChildSleepEfficiencies({
  accessToken,
  baseDate,
  childrenId,
}: ChildChartParams) {
  return getChildChart(
    childChartApiPaths.sleepEfficiencies({ baseDate, childrenId }),
    accessToken,
    '수면 효율 데이터를 불러오지 못했습니다.',
  )
}

async function getChildHrAccRatios({
  accessToken,
  baseDate,
  childrenId,
}: ChildChartParams) {
  return getChildChart(
    childChartApiPaths.hrAccRatios({ baseDate, childrenId }),
    accessToken,
    '행동 활성 데이터를 불러오지 못했습니다.',
  )
}

async function getChildRmssds({ accessToken, baseDate, childrenId }: ChildChartParams) {
  return getChildChart(
    childChartApiPaths.rmssds({ baseDate, childrenId }),
    accessToken,
    '자율 신경 안정도 데이터를 불러오지 못했습니다.',
  )
}

export type { ChildChartParams, ChildChartPointDto, ListResponseDto }
export {
  ChildChartApiError,
  childChartApiPaths,
  getChildHrAccRatios,
  getChildRmssds,
  getChildSleepEfficiencies,
  getChildSleepScores,
}
