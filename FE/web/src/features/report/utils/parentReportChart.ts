import type { ParentReportWeek } from '../constants/parentReport'

const STABILITY_CHART_WIDTH = 300
const STABILITY_CHART_HEIGHT = 180
const STABILITY_CHART_PADDING_LEFT = 34
const STABILITY_CHART_PADDING_RIGHT = 12
const STABILITY_CHART_PADDING_TOP = 12
const STABILITY_CHART_PADDING_BOTTOM = 26
const STABILITY_CHART_Y_AXIS_MAX = 300
const STABILITY_CHART_Y_AXIS_TICKS = [300, 240, 180, 120, 60, 0] as const

function createStabilityChartData(scores: ParentReportWeek['stabilityScores']) {
  const usableWidth =
    STABILITY_CHART_WIDTH - STABILITY_CHART_PADDING_LEFT - STABILITY_CHART_PADDING_RIGHT
  const usableHeight =
    STABILITY_CHART_HEIGHT - STABILITY_CHART_PADDING_TOP - STABILITY_CHART_PADDING_BOTTOM
  const stepX = usableWidth / Math.max(scores.length - 1, 1)
  const getY = (score: number) => {
    const clampedScore = Math.max(0, Math.min(STABILITY_CHART_Y_AXIS_MAX, score))

    return (
      STABILITY_CHART_PADDING_TOP +
      ((STABILITY_CHART_Y_AXIS_MAX - clampedScore) / STABILITY_CHART_Y_AXIS_MAX) *
        usableHeight
    )
  }
  const isVisiblePoint = (point: ParentReportWeek['stabilityScores'][number]) =>
    point.hasValue ?? true

  const points = scores.map((item, index) => {
    const x = STABILITY_CHART_PADDING_LEFT + stepX * index
    const y = getY(item.score)

    return {
      ...item,
      x,
      y,
    }
  })
  const pathSegments: (typeof points)[] = []

  points.forEach((point, index) => {
    if (!isVisiblePoint(point)) {
      return
    }

    const previousPoint = points[index - 1]
    const shouldStartSegment = !previousPoint || !isVisiblePoint(previousPoint)

    if (shouldStartSegment) {
      pathSegments.push([point])
      return
    }

    pathSegments[pathSegments.length - 1]?.push(point)
  })

  return {
    axisTicks: STABILITY_CHART_Y_AXIS_TICKS.map((value) => ({
      value,
      y: getY(value),
    })),
    pathSegments: pathSegments
      .filter((segment) => segment.length > 1)
      .map((segment) =>
        segment
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
          .join(' '),
      ),
    points,
    verticalGuides: points.map((point) => ({
      weekday: point.weekday,
      x: point.x,
      y1: STABILITY_CHART_PADDING_TOP,
      y2: STABILITY_CHART_HEIGHT - STABILITY_CHART_PADDING_BOTTOM,
    })),
    weekdayLabels: points.map((point) => ({
      weekday: point.weekday,
      x: point.x,
      y: STABILITY_CHART_HEIGHT - 4,
    })),
  }
}

export {
  STABILITY_CHART_HEIGHT,
  STABILITY_CHART_PADDING_LEFT,
  STABILITY_CHART_PADDING_RIGHT,
  STABILITY_CHART_WIDTH,
  createStabilityChartData,
}
