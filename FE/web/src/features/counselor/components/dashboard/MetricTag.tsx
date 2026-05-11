type MetricTagProps = {
  children: string
  tone?: 'blue' | 'green' | 'orange' | 'neutral'
}

function MetricTag({ children, tone = 'neutral' }: MetricTagProps) {
  return <span className={`counselor-dashboard-tag is-${tone}`}>{children}</span>
}

export default MetricTag
