import DiaryEmotionIcon from '../../../../diary/components/DiaryEmotionIcon'
import type { DiaryEmotionKey } from '../../../../diary/constants/diaryEmotions'

type LineChartPoint = {
  label: string
  value: number
  emotionKey?: DiaryEmotionKey
  hasConversation?: boolean
  hasValue?: boolean
}

type LineChartProps = {
  data: LineChartPoint[]
  color: string
  showLine?: boolean
  showEmoji?: boolean
  xAxisLabels?: string[]
  yAxisMax?: number
  yAxisTicks?: readonly number[]
}

const DEFAULT_Y_AXIS_MAX = 100
const DEFAULT_Y_AXIS_TICKS = [100, 75, 50, 25, 0] as const

function LineChart({
  data,
  color,
  showLine = true,
  showEmoji = false,
  xAxisLabels,
  yAxisMax = DEFAULT_Y_AXIS_MAX,
  yAxisTicks = DEFAULT_Y_AXIS_TICKS,
}: LineChartProps) {
  const width = 520
  const height = 180
  const paddingX = 46
  const paddingTop = 18
  const paddingBottom = 30
  const chartHeight = height - paddingTop - paddingBottom
  const axisLabels = xAxisLabels?.length ? xAxisLabels : data.map((item) => item.label)
  const gap = (width - paddingX * 2) / Math.max(axisLabels.length - 1, 1)
  const getY = (value: number) => {
    const clampedValue = Math.max(0, Math.min(yAxisMax, value))

    return paddingTop + chartHeight - (clampedValue / yAxisMax) * chartHeight
  }
  const isVisiblePoint = (point: LineChartPoint) =>
    (point.hasConversation ?? true) && (point.hasValue ?? true)
  const points = data.map((item, index) => {
    const axisIndex = axisLabels.indexOf(item.label)
    const x = paddingX + gap * (axisIndex >= 0 ? axisIndex : index)
    const y = getY(item.value)
    return { ...item, x, y }
  })
  const lineSegments: (typeof points)[] = []

  points.forEach((point, index) => {
    if (!isVisiblePoint(point)) {
      return
    }

    const previousPoint = points[index - 1]
    const shouldStartSegment = !previousPoint || !isVisiblePoint(previousPoint)

    if (shouldStartSegment) {
      lineSegments.push([point])
      return
    }

    lineSegments[lineSegments.length - 1]?.push(point)
  })
  const paths = lineSegments
    .filter((segment) => segment.length > 1)
    .map((segment) =>
      segment
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' '),
    )

  return (
    <svg
      className="counselor-line-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="주간 추이 그래프"
    >
      {yAxisTicks.map((value) => {
        const y = getY(value)
        return (
          <g key={value}>
            <line x1={paddingX} x2={width - 24} y1={y} y2={y} />
            <text x={18} y={y + 4}>
              {value}
            </text>
          </g>
        )
      })}
      {showLine
        ? paths.map((path) => <path d={path} key={path} style={{ stroke: color }} />)
        : null}
      {points.map((point, index) => {
        const shouldShowDot = showLine && isVisiblePoint(point)

        return (
          <g key={`${point.label}-${index}`}>
            {shouldShowDot ? (
              <circle cx={point.x} cy={point.y} r={4.8} style={{ fill: color }} />
            ) : null}
            {showEmoji && point.emotionKey ? (
              <foreignObject
                className="counselor-line-chart-emotion"
                x={point.x - 11}
                y={point.y - 34}
                width="22"
                height="22"
              >
                <DiaryEmotionIcon
                  emotionKey={point.emotionKey}
                  size={22}
                  className="counselor-line-chart-emotion-icon"
                />
              </foreignObject>
            ) : null}
          </g>
        )
      })}
      {axisLabels.map((label, index) => (
        <text
          className="counselor-line-chart-label"
          key={`${label}-${index}`}
          x={paddingX + gap * index}
          y={height - 8}
        >
          {label}
        </text>
      ))}
    </svg>
  )
}

export type { LineChartPoint }
export default LineChart
