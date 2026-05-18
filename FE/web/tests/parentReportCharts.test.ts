import { describe, expect, it } from 'vitest'

import { mapChartPointsToScores } from '../src/features/report/hooks/useParentReportData'
import { createStabilityChartData } from '../src/features/report/utils/parentReportChart'

describe('parent report chart data mapping', () => {
  it('keeps missing chart values separate from real zero values', () => {
    const scores = mapChartPointsToScores([
      { date: '2026-05-18', dayOfWeek: 'MONDAY', value: null },
      { date: '2026-05-19', dayOfWeek: 'TUESDAY', value: 0 },
      { date: '2026-05-20', dayOfWeek: 'WEDNESDAY', value: 42 },
    ])

    expect(scores[0]).toMatchObject({ hasValue: false, score: 0 })
    expect(scores[1]).toMatchObject({ hasValue: true, score: 0 })
    expect(scores[2]).toMatchObject({ hasValue: true, score: 42 })
  })

  it('uses a 0 to 300 stability axis and breaks lines around missing points', () => {
    const chart = createStabilityChartData([
      { hasValue: true, score: 120, weekday: 'Mon' as never },
      { hasValue: false, score: 0, weekday: 'Tue' as never },
      { hasValue: true, score: 300, weekday: 'Wed' as never },
    ])

    expect(chart.axisTicks.map((tick) => tick.value)).toEqual([
      300,
      240,
      180,
      120,
      60,
      0,
    ])
    expect(chart.pathSegments).toHaveLength(0)
    expect(chart.points[0]?.y).toBeCloseTo(97.2, 1)
    expect(chart.points[2]?.y).toBe(12)
    expect(chart.verticalGuides.map((guide) => guide.x)).toEqual(
      chart.points.map((point) => point.x),
    )
    expect(chart.weekdayLabels.map((label) => label.x)).toEqual(
      chart.points.map((point) => point.x),
    )
  })
})
