import type { CounselorCommentResponseDto } from '../api/counselorCommentApi'
import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'

type ChildListItem = {
  id: string
  name: string
  meta: string
  subText: string
  age?: string
  gender?: string
  guardianName?: string
  registeredAt: string
  counselingStatus?: string
}

type CounselorConnectionRequest = {
  id: string
  parentName: string
  parentEmail: string
  child: ChildListItem
  requestedAt: string
  relationStatus?: string
}

type ObservationComment = CounselorCommentResponseDto

type ObservationRecord = {
  id: number | string
  childrenId: string
  reportId: string
  date: string
  day: string
  hasComment?: boolean
  mood: string
  text: string
  comment?: ObservationComment | null
}

type ObservationRecordSeed = Omit<ObservationRecord, 'childrenId' | 'reportId'> &
  Partial<Pick<ObservationRecord, 'childrenId' | 'reportId'>>

type TimelineEntry = {
  id: number
  type: 'diary' | 'conversation'
  time?: string
  emotionKey?: DiaryEmotionKey
  content: string
  tags: string[]
}

type TimelineDay = {
  id: number
  date: string
  entries: TimelineEntry[]
}

type ExpressionFilter = 'all' | 'diary' | 'conversation'

type ExpressionTrendPoint = {
  label: string
  value: number
  emotionKey?: DiaryEmotionKey
  hasConversation?: boolean
  variant?: string
}

type ExpressionWeek = {
  id: string
  label: string
  insight: string
  trend: Record<ExpressionFilter, ExpressionTrendPoint[]>
  days: TimelineDay[]
}

type WeekNavigatorProps = {
  label: string
  isFirst: boolean
  isLast: boolean
  onPrev: () => void
  onNext: () => void
}

type DashboardWeekSection =
  | 'observation'
  | 'sleepScore'
  | 'sleepEfficiency'
  | 'expression'
  | 'biometricRatio'
  | 'autonomic'

type DashboardWeekOffsets = Record<DashboardWeekSection, number>

type EmotionFlowMode = 'monthly' | 'yearly'

type EmotionFlowPoint = {
  label: string
  diary: number
  conversation: number
}

type EmotionFlowPeriod = {
  id: string
  label: string
  points: EmotionFlowPoint[]
}

type EmotionFlowSeries = 'diary' | 'conversation'

type DashboardMetricPoint = ExpressionTrendPoint

type DashboardExpressionAnalysis = {
  insight: string
  trend: Record<ExpressionFilter, DashboardMetricPoint[]>
  days: TimelineDay[]
}

export type {
  ChildListItem,
  CounselorConnectionRequest,
  DashboardExpressionAnalysis,
  DashboardMetricPoint,
  DashboardWeekOffsets,
  DashboardWeekSection,
  EmotionFlowMode,
  EmotionFlowPeriod,
  EmotionFlowPoint,
  EmotionFlowSeries,
  ExpressionFilter,
  ExpressionTrendPoint,
  ExpressionWeek,
  ObservationComment,
  ObservationRecord,
  ObservationRecordSeed,
  TimelineDay,
  TimelineEntry,
  WeekNavigatorProps,
}
