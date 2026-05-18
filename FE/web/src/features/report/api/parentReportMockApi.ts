import type {
  ParentChartParams,
  ParentDiaryEmotionParams,
  ParentReportApiParams,
} from './parentReportApi'
import { parentReportWeeksMock } from '../mocks/parentReport'
import { parentStatusCardMock } from '../mocks/parentStatusCard'
import type {
  ListResponseDto,
  ParentChartPointDto,
  ParentDiaryEmotionResponseDto,
  ParentStatusCardDto,
} from '../types/parentReport'

type ParentMockDiaryEmotionParams = ParentDiaryEmotionParams & {
  mockWeekIndex?: number
}

type ParentMockChartParams = ParentChartParams & {
  mockWeekIndex?: number
}

function getMockWeek(mockWeekIndex?: number) {
  return (
    (typeof mockWeekIndex === 'number'
      ? parentReportWeeksMock[mockWeekIndex]
      : undefined) ??
    parentReportWeeksMock.at(-1) ??
    parentReportWeeksMock[0]
  )
}

function addDays(dateValue: string, dayOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  date.setDate(date.getDate() + dayOffset)

  return date.toISOString().slice(0, 10)
}

async function getParentDiaryEmotions({
  mockWeekIndex,
  startDate,
}: ParentMockDiaryEmotionParams): Promise<ParentDiaryEmotionResponseDto> {
  const mockWeek = getMockWeek(mockWeekIndex)

  return {
    emotionList: mockWeek.moods
      .map((mood, index) =>
        mood.emotionKey
          ? {
              emotionIcon: mood.emotionKey,
              targetDate: addDays(startDate, index),
            }
          : null,
      )
      .filter((point): point is NonNullable<typeof point> => point !== null),
  }
}

async function getParentStatusCard({
  childrenId,
}: ParentReportApiParams): Promise<ParentStatusCardDto | null> {
  if (!childrenId) {
    return null
  }

  return {
    ...parentStatusCardMock,
    userId: childrenId,
  }
}

async function getParentSleepScores({
  baseDate,
  mockWeekIndex,
}: ParentMockChartParams): Promise<ListResponseDto<ParentChartPointDto>> {
  const mockWeek = getMockWeek(mockWeekIndex)
  const contents = mockWeek.sleepScores.map((point, index) => ({
    date: addDays(baseDate, index),
    dayLabel: point.weekday,
    value: point.score,
  }))

  return {
    contents,
    count: contents.length,
  }
}

async function getParentHrAccRatios({
  baseDate,
  mockWeekIndex,
}: ParentMockChartParams): Promise<ListResponseDto<ParentChartPointDto>> {
  const mockWeek = getMockWeek(mockWeekIndex)
  const contents = mockWeek.stabilityScores.map((point, index) => ({
    date: addDays(baseDate, index),
    dayLabel: point.weekday,
    value: point.score,
  }))

  return {
    contents,
    count: contents.length,
  }
}

async function getParentRmssds({
  baseDate,
  mockWeekIndex,
}: ParentMockChartParams): Promise<ListResponseDto<ParentChartPointDto>> {
  const mockWeek = getMockWeek(mockWeekIndex)
  const contents = mockWeek.stabilityScores.map((point, index) => ({
    date: addDays(baseDate, index),
    dayLabel: point.weekday,
    value: point.score,
  }))

  return {
    contents,
    count: contents.length,
  }
}

const parentReportMockApi = {
  getParentDiaryEmotions,
  getParentHrAccRatios,
  getParentRmssds,
  getParentSleepScores,
  getParentStatusCard,
}

export {
  getParentDiaryEmotions,
  getParentHrAccRatios,
  getParentRmssds,
  getParentSleepScores,
  getParentStatusCard,
  parentReportMockApi,
}
