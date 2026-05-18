import type { DashboardMetricPoint } from '../../../types/dashboard'

type BarChartProps = {
  data: DashboardMetricPoint[]
}

function BarChart({ data }: BarChartProps) {
  return (
    <div className="counselor-bar-chart" aria-label="수면 점수 추이">
      {data.map((bar) => {
        const adjustedValue = bar.value
        const hasValue = bar.hasValue ?? true
        const isWarning = bar.variant === 'warning'

        return (
          <div className="counselor-bar-chart-item" key={bar.label}>
            <div className="counselor-bar-track">
              {hasValue ? (
                <>
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
                </>
              ) : null}
            </div>
            <strong>{bar.label}</strong>
          </div>
        )
      })}
    </div>
  )
}

export default BarChart
