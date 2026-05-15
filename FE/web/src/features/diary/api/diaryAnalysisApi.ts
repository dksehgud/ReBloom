import { apiRequest } from '../../../shared/api/client'

const REPORT_API_PREFIX = '/report/api/v1'

type DiaryAnalysisRequest = {
  diary_id: string
  user_id: string
  target_date: string
  emotion_icon: string
  content: string
}

function requestDiaryAnalysis(request: DiaryAnalysisRequest) {
  return apiRequest<void>(`${REPORT_API_PREFIX}/analyses/diaries`, {
    method: 'POST',
    body: request,
    errorMessage: '일기 분석 요청에 실패했습니다.',
  })
}

export { requestDiaryAnalysis }
