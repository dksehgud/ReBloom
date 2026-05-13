import DiaryEmotionIcon from '../../../../diary/components/DiaryEmotionIcon'
import type { DiaryEmotionKey } from '../../../../diary/constants/diaryEmotions'

type LineChartPoint = {
  label: string
  value: number
  emotionKey?: DiaryEmotionKey
}

type LineChartProps = {
  data: LineChartPoint[]
  color: string
  showLine?: boolean
  showEmoji?: boolean
}

function LineChart({
  data,
  color,
  showLine = true,
  showEmoji = false,
}: LineChartProps) {
  const width = 520
  const height = 180
  const paddingX = 46
  const paddingTop = 18
  const paddingBottom = 30
  const chartHeight = height - paddingTop - paddingBottom
  const gap = (width - paddingX * 2) / Math.max(data.length - 1, 1)
  const points = data.map((item, index) => {
    const x = paddingX + gap * index
    const y = paddingTop + chartHeight - (item.value / 100) * chartHeight
    return { ...item, x, y }
  })
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <svg
      className="counselor-line-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="주간 추이 그래프"
    >
      {[100, 75, 50, 25, 0].map((value) => {
        const y = paddingTop + chartHeight - (value / 100) * chartHeight
        return (
          <g key={value}>
            <line x1={paddingX} x2={width - 24} y1={y} y2={y} />
            <text x={18} y={y + 4}>
              {value}
            </text>
          </g>
        )
      })}
      {showLine ? <path d={path} style={{ stroke: color }} /> : null}
      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          {showLine ? <circle cx={point.x} cy={point.y} r={4.8} style={{ fill: color }} /> : null}
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
          <text className="counselor-line-chart-label" x={point.x} y={height - 8}>
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export type { LineChartPoint }
export default LineChart
