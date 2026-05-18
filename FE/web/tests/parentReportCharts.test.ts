import { describe, expect, it } from 'vitest'

import { createStabilityChartData } from '../src/features/report/utils/parentReportChart'

describe('parent report stability chart layout', () => {
  it('uses a 0 to 300 stability axis and aligns guides, labels, and points', () => {
    const chart = createStabilityChartData([
      { score: 120, weekday: 'Mon' as never },
      { score: 0, weekday: 'Tue' as never },
      { score: 300, weekday: 'Wed' as never },
    ])

    expect(chart.axisTicks.map((tick) => tick.value)).toEqual([
      300,
      240,
      180,
      120,
      60,
      0,
    ])
    expect(chart.points[0]?.y).toBeCloseTo(97.2, 1)
    expect(chart.points[1]?.y).toBe(154)
    expect(chart.points[2]?.y).toBe(12)
    expect(chart.verticalGuides.map((guide) => guide.x)).toEqual(
      chart.points.map((point) => point.x),
    )
    expect(chart.weekdayLabels.map((label) => label.x)).toEqual(
      chart.points.map((point) => point.x),
    )
  })
})
