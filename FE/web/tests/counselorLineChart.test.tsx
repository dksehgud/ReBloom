import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import LineChart from '../src/features/counselor/components/dashboard/charts/LineChart'
import {
  BIOMETRIC_RATIO_Y_AXIS_MAX,
  BIOMETRIC_RATIO_Y_AXIS_TICKS,
} from '../src/features/counselor/constants/dashboardChartAxis'

describe('counselor line chart conversation markers', () => {
  it('hides point dots for all-tab diary-only points', () => {
    const markup = renderToStaticMarkup(
      <LineChart
        data={[{ label: '월', value: 80, hasConversation: false }]}
        color="#88b5c4"
      />,
    )

    expect(markup).not.toContain('<circle')
    expect(markup).not.toContain('<path')
  })

  it('keeps point dots for points with conversation data', () => {
    const markup = renderToStaticMarkup(
      <LineChart
        data={[{ label: '월', value: 80, hasConversation: true }]}
        color="#88b5c4"
      />,
    )

    expect(markup).toContain('<circle')
  })

  it('keeps weekly x-axis labels fixed when trend data is sparse', () => {
    const markup = renderToStaticMarkup(
      <LineChart
        data={[
          { label: 'Fri', value: 80, hasConversation: true },
          { label: 'Sun', value: 60, hasConversation: true },
        ]}
        color="#88b5c4"
        xAxisLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
      />,
    )

    const labels = [
      ...markup.matchAll(
        /class="counselor-line-chart-label"[^>]*>([^<]+)/g,
      ),
    ].map((match) => match[1])
    const circleXs = [...markup.matchAll(/<circle cx="([^"]+)"/g)].map(
      (match) => Number(match[1]),
    )

    expect(labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(circleXs[0]).toBeCloseTo(331.3, 1)
    expect(circleXs[1]).toBeCloseTo(474, 1)
  })

  it('can render a PHQ-8 score axis without changing the default chart scale', () => {
    const markup = renderToStaticMarkup(
      <LineChart
        data={[{ label: '월', value: 12, hasConversation: true }]}
        color="#88b5c4"
        yAxisMax={24}
        yAxisTicks={[24, 18, 12, 6, 0]}
      />,
    )

    const axisValues = [...markup.matchAll(/<text x="18" y="[^"]+">([^<]+)/g)].map(
      (match) => match[1],
    )

    expect(axisValues).toEqual(['24', '18', '12', '6', '0'])
  })

  it('can render the biometric ratio axis using decimal ticks', () => {
    const markup = renderToStaticMarkup(
      <LineChart
        data={[{ label: '월', value: 0.9, hasConversation: true }]}
        color="#88b5c4"
        yAxisMax={BIOMETRIC_RATIO_Y_AXIS_MAX}
        yAxisTicks={BIOMETRIC_RATIO_Y_AXIS_TICKS}
      />,
    )

    const axisValues = [...markup.matchAll(/<text x="18" y="[^"]+">([^<]+)/g)].map(
      (match) => match[1],
    )

    expect(axisValues).toEqual(['1.5', '1.2', '0.9', '0.6', '0.3', '0'])
  })
})
