import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'
import { DEFAULT_EXPRESSION_WEEK_INDEX } from '../mocks/dashboardMockData'

type DashboardMetricPoint = {
  label: string
  value: number
  emotionKey?: DiaryEmotionKey
}

function clampMetricValue(value: number) {
  return Math.max(0, Math.min(100, value))
}

function getWeekAdjustedValue(
  value: number,
  weekIndex: number,
  pointIndex: number,
  childId = 1,
) {
  const weekDelta = (weekIndex - DEFAULT_EXPRESSION_WEEK_INDEX) * 5
  const rhythmDelta = pointIndex % 2 === 0 ? weekDelta : -Math.round(weekDelta / 2)
  const childDelta = childId === 1 ? 0 : ((childId % 5) - 2) * 3

  return clampMetricValue(value + rhythmDelta + childDelta)
}

function getWeekAdjustedLineData(
  data: DashboardMetricPoint[],
  weekIndex: number,
  childId = 1,
) {
  return data.map((item, index) => ({
    ...item,
    value: getWeekAdjustedValue(item.value, weekIndex, index, childId),
  }))
}

export type { DashboardMetricPoint }
export { getWeekAdjustedLineData, getWeekAdjustedValue }
