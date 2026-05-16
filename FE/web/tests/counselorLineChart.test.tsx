import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import LineChart from '../src/features/counselor/components/dashboard/charts/LineChart'

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
})
