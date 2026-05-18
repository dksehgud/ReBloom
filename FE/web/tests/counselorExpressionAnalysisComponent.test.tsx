import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import ExpressionAnalysis from '../src/features/counselor/components/dashboard/ExpressionAnalysis'

describe('counselor expression analysis empty state', () => {
  it('shows one unified empty state when the selected week has no records', () => {
    const markup = renderToStaticMarkup(
      <ExpressionAnalysis
        analysis={{
          days: [],
          insight: '',
          trend: {
            all: [],
            conversation: [],
            diary: [],
          },
        }}
        childId="child-1"
        isFirstWeek={false}
        isLastWeek={false}
        weekLabel="2026년 5월 1주차"
        onNextWeek={() => undefined}
        onPrevWeek={() => undefined}
      />,
    )

    expect(markup).toContain('선택한 주차의 기록이 없습니다.')
    expect(markup.match(/counselor-expression-empty/g)).toHaveLength(1)
    expect(markup).not.toContain('counselor-expression-chart')
    expect(markup).not.toContain('counselor-timeline-day')
  })
})
