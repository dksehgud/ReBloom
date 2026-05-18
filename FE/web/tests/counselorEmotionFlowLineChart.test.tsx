import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import EmotionFlowLineChart from '../src/features/counselor/components/dashboard/charts/EmotionFlowLineChart'

describe('counselor emotion flow line chart', () => {
  it('renders PHQ-8 score ticks from 0 to 24', () => {
    const markup = renderToStaticMarkup(
      <EmotionFlowLineChart
        data={[
          {
            conversation: 22,
            diary: 12,
            hasConversation: true,
            hasDiary: true,
            label: '5월 1주',
          },
        ]}
      />,
    )

    const axisValues = [
      ...markup.matchAll(
        /class="counselor-emotion-flow-axis"[^>]*>([^<]+)/g,
      ),
    ].map((match) => match[1])

    expect(axisValues).toEqual(['24', '18', '12', '6', '0'])
  })
})
