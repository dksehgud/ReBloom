import { describe, expect, it } from 'vitest'

import type { CounselorAnalysisContentResponseDto } from '../src/features/counselor/api/counselorDashboardApi'
import { mapAnalysisContentToExpressionAnalysis } from '../src/features/counselor/hooks/useCounselorDashboardState'

describe('counselor dashboard expression analysis mapping', () => {
  it('does not create conversation graph points for diary-only data', () => {
    const response: CounselorAnalysisContentResponseDto = {
      dailyGroups: [
        {
          conversationList: [],
          date: '2026-05-14',
          diaryList: [
            {
              analysisId: 'diary-analysis-1',
              emotionIcon: 'happy',
              prediction: '0.8',
              targetDate: '2026-05-14T10:00:00',
            },
          ],
        },
      ],
    }

    const analysis = mapAnalysisContentToExpressionAnalysis(response)

    expect(analysis.trend.all).toHaveLength(1)
    expect(analysis.trend.diary).toHaveLength(1)
    expect(analysis.trend.conversation).toEqual([])
  })

  it('does not create diary graph points for conversation-only data', () => {
    const response: CounselorAnalysisContentResponseDto = {
      dailyGroups: [
        {
          conversationList: [
            {
              analysisId: 'conversation-analysis-1',
              prediction: '65',
              startedAt: '2026-05-14T10:00:00',
            },
          ],
          date: '2026-05-14',
          diaryList: [],
        },
      ],
    }

    const analysis = mapAnalysisContentToExpressionAnalysis(response)

    expect(analysis.trend.all).toHaveLength(1)
    expect(analysis.trend.conversation).toHaveLength(1)
    expect(analysis.trend.diary).toEqual([])
  })
})
