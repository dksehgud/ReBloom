import { describe, expect, it, vi } from 'vitest'

import { getReportRange } from '../src/features/report/hooks/useParentReportData'
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

describe('parent report biometric week range', () => {
  it('uses the selected week end date as the biometric chart baseDate', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 19, 12))

    try {
      expect(getReportRange(2)).toMatchObject({
        baseDate: '2026-05-19',
        endDate: '2026-05-19',
        startDate: '2026-05-18',
      })
      expect(getReportRange(1)).toMatchObject({
        baseDate: '2026-05-17',
        endDate: '2026-05-17',
        startDate: '2026-05-11',
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
