import type { EmotionFlowPoint, EmotionFlowSeries } from '../../../types/dashboard'
import {
  EXPRESSION_SCORE_MAX,
  EXPRESSION_SCORE_TICKS,
} from '../../../utils/expressionPrediction'

type EmotionFlowLineChartProps = {
  data: EmotionFlowPoint[]
}

function EmotionFlowLineChart({ data }: EmotionFlowLineChartProps) {
  const width = 590
  const height = 246
  const paddingLeft = 56
  const paddingRight = 26
  const paddingTop = 22
  const paddingBottom = 38
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const horizontalGap = data.length > 1 ? chartWidth / (data.length - 1) : 0
  const seriesColors: Record<EmotionFlowSeries, string> = {
    diary: '#344966',
    conversation: '#88b5c4',
  }
  const hasSeriesData: Record<EmotionFlowSeries, boolean> = {
    diary: data.some((point) => point.hasDiary ?? point.diary > 0),
    conversation: data.some(
      (point) => point.hasConversation ?? point.conversation > 0,
    ),
  }

  const getX = (index: number) =>
    data.length > 1 ? paddingLeft + horizontalGap * index : paddingLeft + chartWidth / 2
  const getY = (value: number) => {
    const clampedValue = Math.max(0, Math.min(EXPRESSION_SCORE_MAX, value))

    return paddingTop + chartHeight - (clampedValue / EXPRESSION_SCORE_MAX) * chartHeight
  }
  const buildPath = (series: EmotionFlowSeries) =>
    data
      .map((item, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command} ${getX(index)} ${getY(item[series])}`
      })
      .join(' ')

  return (
    <svg
      className="counselor-emotion-flow-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="일기와 대화 감정 흐름 선 그래프"
    >
      {EXPRESSION_SCORE_TICKS.map((tick) => {
        const y = getY(tick)
        return (
          <g key={tick}>
            <line
              className="counselor-emotion-flow-grid"
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
            />
            <text className="counselor-emotion-flow-axis" x={paddingLeft - 12} y={y + 4}>
              {tick}
            </text>
          </g>
        )
      })}
      {hasSeriesData.diary ? (
        <path
          className="counselor-emotion-flow-line is-diary"
          d={buildPath('diary')}
          style={{ stroke: seriesColors.diary }}
        />
      ) : null}
      {hasSeriesData.conversation ? (
        <path
          className="counselor-emotion-flow-line is-conversation"
          d={buildPath('conversation')}
          style={{ stroke: seriesColors.conversation }}
        />
      ) : null}
      {data.map((item, index) => (
        <text
          className="counselor-emotion-flow-label"
          key={`${item.label}-${index}`}
          x={getX(index)}
          y={height - 10}
        >
          {item.label}
        </text>
      ))}
    </svg>
  )
}

export default EmotionFlowLineChart
