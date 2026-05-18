import { DEFAULT_EXPRESSION_WEEK_INDEX } from '../mocks/dashboardMockData'
import type { DashboardMetricPoint } from '../types/dashboard'

type MetricAdjustmentOptions = {
  maxValue?: number
}

const DEFAULT_METRIC_MAX_VALUE = 100

function clampMetricValue(value: number, maxValue = DEFAULT_METRIC_MAX_VALUE) {
  return Math.max(0, Math.min(maxValue, value))
}

function formatMetricValue(value: number, maxValue: number) {
  return Number.isInteger(maxValue) ? Math.round(value) : Number(value.toFixed(2))
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
  options: MetricAdjustmentOptions = {},
) {
  const maxValue = options.maxValue ?? DEFAULT_METRIC_MAX_VALUE
  const weekDelta = (weekIndex - DEFAULT_EXPRESSION_WEEK_INDEX) * maxValue * 0.05
  const counterWeekDelta = Number.isInteger(maxValue)
    ? Math.round(weekDelta / 2)
    : weekDelta / 2
  const rhythmDelta = pointIndex % 2 === 0 ? weekDelta : -counterWeekDelta
  const childSeed = getChildMetricSeed(childId)
  const childDelta =
    childId === 'mock-child-1' ? 0 : ((childSeed % 5) - 2) * maxValue * 0.03

  return formatMetricValue(
    clampMetricValue(value + rhythmDelta + childDelta, maxValue),
    maxValue,
  )
}

function getWeekAdjustedLineData(
  data: DashboardMetricPoint[],
  weekIndex: number,
  childId = 'mock-child-1',
  options: MetricAdjustmentOptions = {},
) {
  return data.map((item, index) => ({
    ...item,
    value: getWeekAdjustedValue(item.value, weekIndex, index, childId, options),
  }))
}

export type { DashboardMetricPoint }
export { getWeekAdjustedLineData, getWeekAdjustedValue }
