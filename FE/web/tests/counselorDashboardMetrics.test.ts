import { describe, expect, it } from 'vitest'

import {
  AUTONOMIC_Y_AXIS_MAX,
  BIOMETRIC_RATIO_Y_AXIS_MAX,
} from '../src/features/counselor/constants/dashboardChartAxis'
import { mapDashboardChartPoints } from '../src/features/counselor/hooks/useCounselorDashboardState'

describe('counselor dashboard biometric metric mapping', () => {
  it('keeps action activity values on the 0 to 1.5 range', () => {
    const points = mapDashboardChartPoints(
      [
        { date: '2026-05-18', value: 0.92 },
        { date: '2026-05-19', value: 2 },
      ],
      undefined,
      BIOMETRIC_RATIO_Y_AXIS_MAX,
    )

    expect(points.map((point) => point.value)).toEqual([0.92, 1.5])
  })

  it('keeps autonomic stability values above 100 on the 0 to 200 range', () => {
    const points = mapDashboardChartPoints(
      [
        { date: '2026-05-18', value: 128 },
        { date: '2026-05-19', value: 240 },
      ],
      undefined,
      AUTONOMIC_Y_AXIS_MAX,
    )

    expect(points.map((point) => point.value)).toEqual([128, 200])
  })
})
