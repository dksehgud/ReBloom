import { DEFAULT_EXPRESSION_WEEK_INDEX } from '../mocks/dashboardMockData'
import type { DashboardMetricPoint } from '../types/dashboard'

function clampMetricValue(value: number) {
  return Math.max(0, Math.min(100, value))
}

function getChildMetricSeed(childId: string) {
  return Array.from(childId).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  )
}

function getWeekAdjustedValue(
  value: number,
  weekIndex: number,
  pointIndex: number,
  childId = 'mock-child-1',
) {
  const weekDelta = (weekIndex - DEFAULT_EXPRESSION_WEEK_INDEX) * 5
  const rhythmDelta = pointIndex % 2 === 0 ? weekDelta : -Math.round(weekDelta / 2)
  const childSeed = getChildMetricSeed(childId)
  const childDelta = childId === 'mock-child-1' ? 0 : ((childSeed % 5) - 2) * 3

  return clampMetricValue(value + rhythmDelta + childDelta)
}

function getWeekAdjustedLineData(
  data: DashboardMetricPoint[],
  weekIndex: number,
  childId = 'mock-child-1',
) {
  return data.map((item, index) => ({
    ...item,
    value: getWeekAdjustedValue(item.value, weekIndex, index, childId),
  }))
}

export type { DashboardMetricPoint }
export { getWeekAdjustedLineData, getWeekAdjustedValue }
