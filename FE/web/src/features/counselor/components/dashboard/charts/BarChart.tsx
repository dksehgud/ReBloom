import { sleepScoreBars } from '../../../mocks/dashboardMockData'
import { getWeekAdjustedValue } from '../../../utils/dashboardMetrics'

type BarChartProps = {
  weekIndex: number
  childId: number
}

function BarChart({ weekIndex, childId }: BarChartProps) {
  return (
    <div className="counselor-bar-chart" aria-label="수면 점수 추이">
      {sleepScoreBars.map((bar, index) => {
        const adjustedValue = getWeekAdjustedValue(bar.value, weekIndex, index, childId)
        const isWarning = bar.variant === 'warning'

        return (
          <div className="counselor-bar-chart-item" key={bar.label}>
            <div className="counselor-bar-track">
              <span
                className={`counselor-bar-score${isWarning ? ' is-warning' : ''}`}
                style={{ bottom: `calc(${adjustedValue}% + 6px)` }}
              >
                {adjustedValue}
              </span>
              <span
                className={`counselor-bar-fill${isWarning ? ' is-warning' : ''}`}
                style={{ height: `${adjustedValue}%` }}
              />
            </div>
            <strong>{bar.label}</strong>
          </div>
        )
      })}
    </div>
  )
}

export default BarChart
