import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import BarChart from '../src/features/counselor/components/dashboard/charts/BarChart'

describe('counselor bar chart metric rendering', () => {
  it('hides value labels and fills for missing metric points', () => {
    const markup = renderToStaticMarkup(
      <BarChart
        data={[
          { label: 'Mon', value: 0, hasValue: false },
          { label: 'Tue', value: 0, hasValue: true },
        ]}
      />,
    )

    expect(markup).toContain('Mon')
    expect(markup).toContain('Tue')
    expect(markup.match(/class="counselor-bar-fill/g)).toHaveLength(1)
    expect(markup.match(/class="counselor-bar-score/g)).toHaveLength(1)
  })
})
