import { apiRequest } from '../../../shared/api/client'

type CounselorDiaryChartPointDto = {
  targetDate: string
  emotionIcon?: string | null
  prediction?: string | null
}

type CounselorConversationChartPointDto = {
  startedAt: string
  endedAt?: string | null
  prediction?: string | null
}

type CounselorEmotionFlowResponseDto = {
  diaryList?: CounselorDiaryChartPointDto[] | null
  conversationList?: CounselorConversationChartPointDto[] | null
}

type CounselorDiaryAnalysisCardDto = {
  analysisId: string
  targetDate: string
  emotionIcon?: string | null
  embeddingText?: string | null
  prediction?: string | null
  keywords?: string[] | null
}

type CounselorConversationAnalysisCardDto = {
  analysisId: string
  startedAt: string
  endedAt?: string | null
  emotionIcon?: string | null
  embeddingText?: string | null
  prediction?: string | null
  aiInitiated?: boolean | null
  keywords?: string[] | null
}

type CounselorAnalysisDailyGroupDto = {
  date: string
  diaryList?: CounselorDiaryAnalysisCardDto[] | null
  conversationList?: CounselorConversationAnalysisCardDto[] | null
}

type CounselorAnalysisContentResponseDto = {
  summary?: string | null
  chart?: CounselorEmotionFlowResponseDto | null
  dailyGroups?: CounselorAnalysisDailyGroupDto[] | null
}

type CounselorDashboardDateRangeParams = {
  accessToken?: string | null
  childId: string
  endDate: string
  startDate: string
}

type CounselorEmotionFlowParams = {
  accessToken?: string | null
  baseDate: string
  childId: string
  period: 'WEEK' | 'MONTH' | 'YEAR'
  type?: 'ALL' | 'DIARY' | 'CONVERSATION'
}

const REPORT_API_PREFIX = '/report/api/v1'

const counselorDashboardApiPaths = {
  analysisContent: `${REPORT_API_PREFIX}/counselors/analyses/contents`,
  emotionFlow: `${REPORT_API_PREFIX}/counselors/analyses/emotion-flow`,
}

function createSearchPath(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)

  return `${path}?${searchParams.toString()}`
}

async function getCounselorAnalysisContent({
  accessToken,
  childId,
  endDate,
  startDate,
}: CounselorDashboardDateRangeParams) {
  return apiRequest<CounselorAnalysisContentResponseDto>(
    createSearchPath(counselorDashboardApiPaths.analysisContent, {
      childId,
      endDate,
      startDate,
    }),
    {
      accessToken,
      errorMessage: '상담사 대시보드 분석 데이터를 불러오지 못했습니다.',
    },
  )
}

async function getCounselorEmotionFlow({
  accessToken,
  baseDate,
  childId,
  period,
  type = 'ALL',
}: CounselorEmotionFlowParams) {
  return apiRequest<CounselorEmotionFlowResponseDto>(
    createSearchPath(counselorDashboardApiPaths.emotionFlow, {
      baseDate,
      childId,
      period,
      type,
    }),
    {
      accessToken,
      errorMessage: '상담사 감정 흐름 데이터를 불러오지 못했습니다.',
    },
  )
}

export type {
  CounselorAnalysisContentResponseDto,
  CounselorAnalysisDailyGroupDto,
  CounselorConversationAnalysisCardDto,
  CounselorConversationChartPointDto,
  CounselorDiaryAnalysisCardDto,
  CounselorDiaryChartPointDto,
  CounselorEmotionFlowResponseDto,
}
export {
  counselorDashboardApiPaths,
  getCounselorAnalysisContent,
  getCounselorEmotionFlow,
}
