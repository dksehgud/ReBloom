import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiActivity,
  FiBell,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiHeart,
  FiMenu,
  FiMessageSquare,
  FiMoon,
  FiSettings,
  FiUserPlus,
  FiX,
} from 'react-icons/fi'

import DashboardCard from '../../features/counselor/components/dashboard/DashboardCard'
import MetricTag from '../../features/counselor/components/dashboard/MetricTag'
import WeekNavigator from '../../features/counselor/components/dashboard/WeekNavigator'
import {
  DEFAULT_EXPRESSION_WEEK_INDEX,
  INITIAL_DASHBOARD_WEEK_INDEXES,
  biometricRatio,
  counselorProfile,
  createMockComment,
  dashboardInfoMessages,
  emotionFlowModeTabs,
  emotionFlowPeriods,
  expressionTabs,
  expressionWeeks,
  hrvTrend,
  initialChildList,
  initialConnectionRequests,
  initialObservationComments,
  observationRecordsByWeek,
  sleepEfficiency,
  sleepScoreBars,
} from '../../features/counselor/mocks/dashboardMockData'
import type {
  CounselorConnectionRequest,
  DashboardWeekIndexes,
  DashboardWeekSection,
  EmotionFlowMode,
  EmotionFlowPoint,
  EmotionFlowSeries,
  ExpressionFilter,
  ObservationComment,
  ObservationRecord,
} from '../../features/counselor/types/dashboard'
import {
  formatCommentCreatedAt,
  getFilteredTimelineDays,
} from '../../features/counselor/utils/dashboardTimeline'
import DiaryEmotionIcon from '../../features/diary/components/DiaryEmotionIcon'
import type { DiaryEmotionKey } from '../../features/diary/constants/diaryEmotions'

function clampMetricValue(value: number) {
  return Math.max(0, Math.min(100, value))
}

function getWeekAdjustedValue(
  value: number,
  weekIndex: number,
  pointIndex: number,
  childId = 1,
) {
  const weekDelta = (weekIndex - DEFAULT_EXPRESSION_WEEK_INDEX) * 5
  const rhythmDelta = pointIndex % 2 === 0 ? weekDelta : -Math.round(weekDelta / 2)
  const childDelta = childId === 1 ? 0 : ((childId % 5) - 2) * 3

  return clampMetricValue(value + rhythmDelta + childDelta)
}

function getWeekAdjustedLineData(
  data: Array<{ label: string; value: number; emotionKey?: DiaryEmotionKey }>,
  weekIndex: number,
  childId = 1,
) {
  return data.map((item, index) => ({
    ...item,
    value: getWeekAdjustedValue(item.value, weekIndex, index, childId),
  }))
}

function BarChart({ weekIndex, childId }: { weekIndex: number; childId: number }) {
  return (
    <div className="counselor-bar-chart" aria-label="수면 점수 추이">
      {sleepScoreBars.map((bar, index) => {
        const adjustedValue = getWeekAdjustedValue(bar.value, weekIndex, index, childId)
        const isWarning = bar.variant === 'warning'

        return (
          <div className="counselor-bar-chart-item" key={bar.label}>
            <div className="counselor-bar-track">
              <span
                className={`counselor-bar-score${isWarning ? ' is-warning' : ''}`}
                style={{ bottom: `calc(${adjustedValue}% + 6px)` }}
              >
                {adjustedValue}
              </span>
              <span
                className={`counselor-bar-fill${isWarning ? ' is-warning' : ''}`}
                style={{ height: `${adjustedValue}%` }}
              />
            </div>
            <strong>{bar.label}</strong>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({
  data,
  color,
  showLine = true,
  showEmoji = false,
}: {
  data: Array<{ label: string; value: number; emotionKey?: DiaryEmotionKey }>
  color: string
  showLine?: boolean
  showEmoji?: boolean
}) {
  const width = 520
  const height = 180
  const paddingX = 46
  const paddingTop = 18
  const paddingBottom = 30
  const chartHeight = height - paddingTop - paddingBottom
  const gap = (width - paddingX * 2) / (data.length - 1)
  const points = data.map((item, index) => {
    const x = paddingX + gap * index
    const y = paddingTop + chartHeight - (item.value / 100) * chartHeight
    return { ...item, x, y }
  })
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <svg
      className="counselor-line-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="주간 추이 그래프"
    >
      {[100, 75, 50, 25, 0].map((value) => {
        const y = paddingTop + chartHeight - (value / 100) * chartHeight
        return (
          <g key={value}>
            <line x1={paddingX} x2={width - 24} y1={y} y2={y} />
            <text x={18} y={y + 4}>
              {value}
            </text>
          </g>
        )
      })}
      {showLine ? <path d={path} style={{ stroke: color }} /> : null}
      {points.map((point) => (
        <g key={point.label}>
          {showLine ? <circle cx={point.x} cy={point.y} r={4.8} style={{ fill: color }} /> : null}
          {showEmoji && point.emotionKey ? (
            <foreignObject
              className="counselor-line-chart-emotion"
              x={point.x - 11}
              y={point.y - 34}
              width="22"
              height="22"
            >
              <DiaryEmotionIcon
                emotionKey={point.emotionKey}
                size={22}
                className="counselor-line-chart-emotion-icon"
              />
            </foreignObject>
          ) : null}
          <text className="counselor-line-chart-label" x={point.x} y={height - 8}>
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function EmotionFlowLineChart({ data }: { data: EmotionFlowPoint[] }) {
  const width = 590
  const height = 246
  const paddingLeft = 56
  const paddingRight = 26
  const paddingTop = 22
  const paddingBottom = 38
  const maxValue = 27
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const horizontalGap = data.length > 1 ? chartWidth / (data.length - 1) : 0
  const ticks = [27, 18, 9, 0]
  const seriesColors: Record<EmotionFlowSeries, string> = {
    diary: '#344966',
    conversation: '#88b5c4',
  }

  const getX = (index: number) =>
    data.length > 1 ? paddingLeft + horizontalGap * index : paddingLeft + chartWidth / 2
  const getY = (value: number) => paddingTop + chartHeight - (value / maxValue) * chartHeight
  const buildPath = (series: EmotionFlowSeries) =>
    data
      .map((item, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command} ${getX(index)} ${getY(item[series])}`
      })
      .join(' ')

  return (
    <svg
      className="counselor-emotion-flow-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="일기와 대화 감정 흐름 선 그래프"
    >
      {ticks.map((tick) => {
        const y = getY(tick)
        return (
          <g key={tick}>
            <line
              className="counselor-emotion-flow-grid"
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
            />
            <text className="counselor-emotion-flow-axis" x={paddingLeft - 12} y={y + 4}>
              {tick}
            </text>
          </g>
        )
      })}
      <path
        className="counselor-emotion-flow-line is-diary"
        d={buildPath('diary')}
        style={{ stroke: seriesColors.diary }}
      />
      <path
        className="counselor-emotion-flow-line is-conversation"
        d={buildPath('conversation')}
        style={{ stroke: seriesColors.conversation }}
      />
      {data.map((item, index) => (
        <text
          className="counselor-emotion-flow-label"
          key={item.label}
          x={getX(index)}
          y={height - 10}
        >
          {item.label}
        </text>
      ))}
    </svg>
  )
}

function ObservationList({
  records,
  comments,
  onSelect,
}: {
  records: ObservationRecord[]
  comments: Record<string, ObservationComment | null>
  onSelect: (record: ObservationRecord) => void
}) {
  return (
    <div className="counselor-observation-list">
      {records.length === 0 ? (
        <p className="counselor-observation-empty">선택한 주차의 관찰 기록이 없습니다.</p>
      ) : null}
      {records.map((record) => (
        <button
          type="button"
          className="counselor-observation-card"
          key={record.id}
          onClick={() => onSelect(record)}
        >
          <div className="counselor-observation-date">
            <strong>{record.date}</strong>
            <span>{record.day}</span>
          </div>
          <div className="counselor-observation-content">
            <MetricTag tone="green">{record.mood}</MetricTag>
            <p>{record.text}</p>
            {comments[record.reportId] ? (
              <span className="counselor-comment-link">
                <FiMessageSquare aria-hidden="true" />
                상담사 코멘트 1개
              </span>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  )
}

function ObservationCommentModal({
  record,
  comment,
  onClose,
  onSave,
  onDelete,
}: {
  record: ObservationRecord
  comment: ObservationComment | null
  onClose: () => void
  onSave: (record: ObservationRecord, context: string) => void
  onDelete: (reportId: string, commentId: string) => void
}) {
  const [draft, setDraft] = useState('')
  const trimmedDraft = draft.trim()

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!trimmedDraft) {
      return
    }

    onSave(record, trimmedDraft)
    setDraft('')
  }

  return (
    <div className="counselor-observation-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="counselor-observation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="counselor-observation-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="counselor-observation-modal-header">
          <h2 id="counselor-observation-modal-title">
            {record.date} <span>{record.day}</span>
          </h2>
          <button
            type="button"
            className="counselor-observation-modal-close"
            aria-label="아이 관찰 기록 닫기"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="counselor-observation-modal-body">
          <span className="counselor-observation-modal-tag">{record.mood}</span>
          <div className="counselor-observation-modal-summary">{record.text}</div>

          <form className="counselor-observation-comment-panel" onSubmit={handleSubmit}>
            <div className="counselor-observation-comment-title">
              <FiMessageSquare aria-hidden="true" />
              <strong>상담사의 코멘트</strong>
            </div>

            {comment ? (
              <div className="counselor-observation-comment-item">
                <span className="counselor-observation-comment-dot" aria-hidden="true" />
                <div>
                  <div className="counselor-observation-comment-meta">
                    <span>{formatCommentCreatedAt(comment.createdAt)}</span>
                    <button type="button" onClick={() => onDelete(record.reportId, comment.commentId)}>
                      삭제
                    </button>
                  </div>
                  <p>{comment.context}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="counselor-observation-comment-empty">
                  아직 작성된 코멘트가 없습니다.
                </p>
                <div className="counselor-observation-comment-form">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="코멘트를 입력하세요..."
                    aria-label="상담사 코멘트"
                  />
                  <button type="submit" disabled={!trimmedDraft}>
                    코멘트 추가
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}

function EmotionFlowModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<EmotionFlowMode>('monthly')
  const [periodIndex, setPeriodIndex] = useState(0)
  const periods = emotionFlowPeriods[mode]
  const currentPeriod = periods[periodIndex] ?? periods[0]
  const isFirstPeriod = periodIndex === 0
  const isLastPeriod = periodIndex === periods.length - 1

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleModeChange = (nextMode: EmotionFlowMode) => {
    setMode(nextMode)
    setPeriodIndex(0)
  }

  return (
    <div className="counselor-emotion-flow-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="counselor-emotion-flow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="counselor-emotion-flow-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="counselor-emotion-flow-header">
          <div className="counselor-emotion-flow-topbar">
            <h2 id="counselor-emotion-flow-title">감정 흐름 크게보기</h2>
            <button
              type="button"
              className="counselor-emotion-flow-close"
              aria-label="감정 흐름 크게보기 닫기"
              onClick={onClose}
            >
              <FiX aria-hidden="true" />
            </button>
          </div>

          <div className="counselor-emotion-flow-tabs" role="tablist" aria-label="감정 흐름 기간">
            {emotionFlowModeTabs.map((tab) => (
              <button
                type="button"
                role="tab"
                key={tab.key}
                aria-selected={mode === tab.key}
                className={mode === tab.key ? 'is-active' : undefined}
                onClick={() => handleModeChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="counselor-emotion-flow-body">
          <div className="counselor-emotion-flow-period">
            <button
              type="button"
              aria-label="이전 기간"
              disabled={isFirstPeriod}
              onClick={() => setPeriodIndex((current) => Math.max(0, current - 1))}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <strong>{currentPeriod.label}</strong>
            <button
              type="button"
              aria-label="다음 기간"
              disabled={isLastPeriod}
              onClick={() => setPeriodIndex((current) => Math.min(periods.length - 1, current + 1))}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="counselor-emotion-flow-legend" aria-label="그래프 범례">
            <span>
              <i className="is-diary" aria-hidden="true" />
              일기
            </span>
            <span>
              <i className="is-conversation" aria-hidden="true" />
              대화
            </span>
          </div>

          <div className="counselor-emotion-flow-chart-panel">
            <EmotionFlowLineChart data={currentPeriod.points} />
          </div>
        </div>
      </section>
    </div>
  )
}

function ExpressionAnalysis({
  maxHeight,
  weekIndex,
  childId,
  onPrevWeek,
  onNextWeek,
}: {
  maxHeight?: number
  weekIndex: number
  childId: number
  onPrevWeek: () => void
  onNextWeek: () => void
}) {
  const [activeFilter, setActiveFilter] = useState<ExpressionFilter>('all')
  const [isEmotionFlowOpen, setIsEmotionFlowOpen] = useState(false)
  const currentWeek = expressionWeeks[weekIndex]
  const currentTrend = getWeekAdjustedLineData(
    currentWeek.trend[activeFilter],
    weekIndex,
    childId,
  )
  const visibleTimelineDays = getFilteredTimelineDays(currentWeek.days, activeFilter)
  const isFirstWeek = weekIndex === 0
  const isLastWeek = weekIndex === expressionWeeks.length - 1

  return (
    <DashboardCard
      title="최근 표현 분석"
      className="counselor-expression-card"
      info={dashboardInfoMessages.expression}
      style={maxHeight ? { height: maxHeight, maxHeight } : undefined}
    >
      <div className="counselor-expression-tabs" aria-label="분석 범위">
        <div className="counselor-expression-tab-group">
          {expressionTabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={activeFilter === tab.key ? 'is-active' : undefined}
              aria-pressed={activeFilter === tab.key}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="counselor-expression-more"
          onClick={() => setIsEmotionFlowOpen(true)}
        >
          감정 흐름 크게보기
        </button>
      </div>

      <WeekNavigator
        label={currentWeek.label}
        isFirst={isFirstWeek}
        isLast={isLastWeek}
        onPrev={onPrevWeek}
        onNext={onNextWeek}
      />

      <div className="counselor-ai-summary">
        <span>AI 분석 인사이트</span>
        <p>{currentWeek.insight}</p>
      </div>

      <div className="counselor-expression-chart">
        <LineChart
          data={currentTrend}
          color="#88b5c4"
          showLine={activeFilter !== 'diary'}
          showEmoji={activeFilter !== 'conversation'}
        />
      </div>

      <div className="counselor-timeline">
        {visibleTimelineDays.length > 0 ? (
          visibleTimelineDays.map((day) => (
            <section className="counselor-timeline-day" key={day.id}>
              <h4>{day.date}</h4>
              <div className="counselor-timeline-items">
                {day.entries.map((entry) => (
                  <article className="counselor-timeline-entry" key={entry.id}>
                    <MetricTag tone={entry.type === 'diary' ? 'green' : 'blue'}>
                      {entry.type === 'diary' ? '일기' : '대화'}
                    </MetricTag>
                    <div>
                      {entry.time ? <span className="entry-time">{entry.time}</span> : null}
                      {entry.emotionKey ? (
                        <DiaryEmotionIcon
                          emotionKey={entry.emotionKey}
                          size={24}
                          className="entry-emotion"
                        />
                      ) : null}
                      <p>{entry.content}</p>
                      <div className="entry-tags">
                        {entry.tags.map((tag, index) => (
                          <MetricTag
                            key={`${entry.id}-${tag}`}
                            tone={index === 0 ? 'orange' : 'neutral'}
                          >
                            {tag}
                          </MetricTag>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className="counselor-timeline-empty">해당 주차에 표시할 표현 기록이 없습니다.</p>
        )}
      </div>
      {isEmotionFlowOpen ? <EmotionFlowModal onClose={() => setIsEmotionFlowOpen(false)} /> : null}
    </DashboardCard>
  )
}

function formatConnectionRequestedAt(requestedAt: string) {
  const date = new Date(requestedAt)

  if (Number.isNaN(date.getTime())) {
    return requestedAt
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

type CounselorConnectionModalProps = {
  requests: CounselorConnectionRequest[]
  onAccept: (request: CounselorConnectionRequest) => void
  onReject: (requestId: number) => void
  onClose: () => void
}

function CounselorConnectionModal({
  requests,
  onAccept,
  onReject,
  onClose,
}: CounselorConnectionModalProps) {
  return (
    <div className="counselor-connection-modal-overlay" role="presentation">
      <section
        aria-labelledby="counselor-connection-modal-title"
        aria-modal="true"
        className="counselor-connection-modal"
        role="dialog"
      >
        <header className="counselor-connection-modal-header">
          <div>
            <span className="counselor-connection-modal-kicker">
              <FiBell aria-hidden="true" /> 연결 신청
            </span>
            <h2 id="counselor-connection-modal-title">상담사 연결 요청</h2>
            <p>보호자가 보낸 상담 연결 신청을 확인하고 수락 또는 거절할 수 있어요.</p>
          </div>
          <button
            type="button"
            className="counselor-connection-modal-close"
            aria-label="연결 신청 알림 닫기"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="counselor-connection-modal-body">
          {requests.length > 0 ? (
            requests.map((request) => (
              <article className="counselor-connection-card" key={request.id}>
                <div className="counselor-connection-card-icon" aria-hidden="true">
                  <FiUserPlus />
                </div>
                <div className="counselor-connection-card-copy">
                  <strong>
                    {request.parentName} 보호자가 {request.child.name} 아동의 상담사
                    연결을 신청했어요.
                  </strong>
                  <p>
                    {request.child.meta} · 보호자 : {request.parentName}
                  </p>
                  <small>
                    {request.parentEmail} · {formatConnectionRequestedAt(request.requestedAt)}
                  </small>
                </div>
                <div className="counselor-connection-card-actions">
                  <button
                    type="button"
                    className="is-secondary"
                    onClick={() => onReject(request.id)}
                  >
                    거절
                  </button>
                  <button type="button" onClick={() => onAccept(request)}>
                    <FiCheck aria-hidden="true" /> 수락
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="counselor-connection-empty">
              확인할 상담사 연결 신청이 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function CounselorDashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [childItems, setChildItems] = useState(initialChildList)
  const [selectedChildId, setSelectedChildId] = useState(initialChildList[0].id)
  const [connectionRequests, setConnectionRequests] = useState(initialConnectionRequests)
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [weekIndexes, setWeekIndexes] = useState<DashboardWeekIndexes>(
    INITIAL_DASHBOARD_WEEK_INDEXES,
  )
  const [analysisCardHeight, setAnalysisCardHeight] = useState<number>()
  const [selectedObservation, setSelectedObservation] = useState<ObservationRecord | null>(null)
  const [observationComments, setObservationComments] = useState(initialObservationComments)
  const mainColumnRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const getWeekControls = (section: DashboardWeekSection) => {
    const weekIndex = weekIndexes[section]
    const currentWeek = expressionWeeks[weekIndex]

    return {
      weekIndex,
      currentWeek,
      isFirstWeek: weekIndex === 0,
      isLastWeek: weekIndex === expressionWeeks.length - 1,
      goPrevWeek: () => {
        setWeekIndexes((current) => ({
          ...current,
          [section]: Math.max(0, current[section] - 1),
        }))
      },
      goNextWeek: () => {
        setWeekIndexes((current) => ({
          ...current,
          [section]: Math.min(expressionWeeks.length - 1, current[section] + 1),
        }))
      },
    }
  }

  const observationWeek = getWeekControls('observation')
  const sleepScoreWeek = getWeekControls('sleepScore')
  const sleepEfficiencyWeek = getWeekControls('sleepEfficiency')
  const expressionWeek = getWeekControls('expression')
  const biometricRatioWeek = getWeekControls('biometricRatio')
  const autonomicWeek = getWeekControls('autonomic')
  const currentObservationRecords =
    observationRecordsByWeek[observationWeek.currentWeek.id] ?? []
  const selectedChildProfile =
    childItems.find((child) => child.id === selectedChildId) ?? childItems[0]
  const selectedObservationComment = selectedObservation
    ? observationComments[selectedObservation.reportId] ?? null
    : null

  const handleSelectChild = (childId: number) => {
    setSelectedChildId(childId)
    setSelectedObservation(null)
    setWeekIndexes(INITIAL_DASHBOARD_WEEK_INDEXES)
  }

  const handleAcceptConnectionRequest = (request: CounselorConnectionRequest) => {
    const acceptedChild = {
      ...request.child,
      registeredAt: new Date().toISOString(),
    }

    setChildItems((current) =>
      [acceptedChild, ...current.filter((child) => child.id !== acceptedChild.id)].sort(
        (first, second) =>
          new Date(second.registeredAt).getTime() - new Date(first.registeredAt).getTime(),
      ),
    )
    setConnectionRequests((current) =>
      current.filter((candidate) => candidate.id !== request.id),
    )
    handleSelectChild(acceptedChild.id)
  }

  const handleRejectConnectionRequest = (requestId: number) => {
    setConnectionRequests((current) =>
      current.filter((request) => request.id !== requestId),
    )
  }

  const handleSaveObservationComment = (record: ObservationRecord, context: string) => {
    setObservationComments((current) => ({
      ...current,
      [record.reportId]: createMockComment(record.id, context, new Date().toISOString()),
    }))
  }

  const handleDeleteObservationComment = (reportId: string, commentId: string) => {
    void commentId

    setObservationComments((current) => ({
      ...current,
      [reportId]: null,
    }))
  }

  useEffect(() => {
    const columnElement = mainColumnRef.current

    if (!columnElement) return undefined

    const updateAnalysisHeight = () => {
      const shouldMatchColumns = window.matchMedia('(min-width: 901px)').matches

      if (!shouldMatchColumns) {
        setAnalysisCardHeight(undefined)
        return
      }

      setAnalysisCardHeight(Math.round(columnElement.getBoundingClientRect().height))
    }

    updateAnalysisHeight()

    const resizeObserver = new ResizeObserver(updateAnalysisHeight)
    resizeObserver.observe(columnElement)
    window.addEventListener('resize', updateAnalysisHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateAnalysisHeight)
    }
  }, [])

  return (
    <main
      className={`counselor-dashboard${
        isSidebarCollapsed ? ' is-sidebar-collapsed' : ''
      }`}
    >
      <aside className="counselor-dashboard-sidebar">
        <header className="counselor-dashboard-brand">
          <div>
            <h1>RE:BLOOM</h1>
            <p>상담사 대시보드</p>
          </div>
          <button
            type="button"
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="counselor-sidebar-toggle"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
          >
            {isSidebarCollapsed ? (
              <FiMenu aria-hidden="true" />
            ) : (
              <FiChevronLeft aria-hidden="true" />
            )}
          </button>
        </header>

        <nav className="counselor-child-list" aria-label="상담 아동 목록">
          {childItems.map((child) => (
            <button
              type="button"
              className={child.id === selectedChildId ? 'is-selected' : undefined}
              key={child.id}
              onClick={() => handleSelectChild(child.id)}
            >
              <span className="counselor-child-avatar" aria-hidden="true">
                {child.name.slice(0, 1)}
              </span>
              <span className="counselor-child-summary">
                <strong>{child.name}</strong>
                <em>{child.meta}</em>
              </span>
              <small className="counselor-child-subtext">{child.subText}</small>
            </button>
          ))}
        </nav>

        <footer className="counselor-dashboard-sidebar-footer">
          <div className="counselor-dashboard-sidebar-profile">
            <span className="counselor-dashboard-sidebar-avatar" aria-hidden="true">
              {counselorProfile.name.slice(0, 1)}
            </span>
            <strong>{counselorProfile.name} 상담자님</strong>
          </div>
          <button
            type="button"
            aria-label="설정 페이지로 이동"
            className="counselor-dashboard-sidebar-settings"
            onClick={() => navigate('/counselor/settings')}
          >
            <FiSettings aria-hidden="true" />
          </button>
        </footer>
      </aside>

      <section className="counselor-dashboard-main">
        <div className="counselor-dashboard-content">
          <header className="counselor-dashboard-hero">
            <div>
              <h2>{selectedChildProfile.name} 님의 관찰 일지</h2>
              <p className="counselor-dashboard-profile-meta" aria-label="상담 아동 정보">
                <span>{selectedChildProfile.age}</span>
                <span>{selectedChildProfile.gender}</span>
                <span>보호자 : {selectedChildProfile.guardianName}</span>
              </p>
            </div>
          </header>

          <div className="counselor-dashboard-grid">
            <div
              className="counselor-dashboard-column"
              aria-label="대시보드 주요 정보"
              ref={mainColumnRef}
            >
              <DashboardCard
                title="아이 관찰 기록"
                info={dashboardInfoMessages.observation}
              >
                <WeekNavigator
                  label={observationWeek.currentWeek.label}
                  isFirst={observationWeek.isFirstWeek}
                  isLast={observationWeek.isLastWeek}
                  onPrev={observationWeek.goPrevWeek}
                  onNext={observationWeek.goNextWeek}
                />
                <ObservationList
                  records={currentObservationRecords}
                  comments={observationComments}
                  onSelect={setSelectedObservation}
                />
              </DashboardCard>

              <DashboardCard title="수면 점수 추이" info={dashboardInfoMessages.sleepScore}>
                <WeekNavigator
                  label={sleepScoreWeek.currentWeek.label}
                  isFirst={sleepScoreWeek.isFirstWeek}
                  isLast={sleepScoreWeek.isLastWeek}
                  onPrev={sleepScoreWeek.goPrevWeek}
                  onNext={sleepScoreWeek.goNextWeek}
                />
                <BarChart
                  weekIndex={sleepScoreWeek.weekIndex}
                  childId={selectedChildId}
                />
              </DashboardCard>

              <DashboardCard
                title="수면 효율 추이"
                info={dashboardInfoMessages.sleepEfficiency}
              >
                <WeekNavigator
                  label={sleepEfficiencyWeek.currentWeek.label}
                  isFirst={sleepEfficiencyWeek.isFirstWeek}
                  isLast={sleepEfficiencyWeek.isLastWeek}
                  onPrev={sleepEfficiencyWeek.goPrevWeek}
                  onNext={sleepEfficiencyWeek.goNextWeek}
                />
                <LineChart
                  data={getWeekAdjustedLineData(
                    sleepEfficiency,
                    sleepEfficiencyWeek.weekIndex,
                    selectedChildId,
                  )}
                  color="#f2a57d"
                />
                <p className="counselor-card-note">
                  수면 추세 시간 중 실제로 잠든 시간의 비율을 의미합니다.
                </p>
              </DashboardCard>
            </div>
            <div
              className="counselor-dashboard-column counselor-dashboard-column--analysis"
              aria-label="대시보드 분석 정보"
            >
              <ExpressionAnalysis
                maxHeight={analysisCardHeight}
                weekIndex={expressionWeek.weekIndex}
                childId={selectedChildId}
                onPrevWeek={expressionWeek.goPrevWeek}
                onNextWeek={expressionWeek.goNextWeek}
              />
            </div>
          </div>

          <section className="counselor-biometric-section">
            <div className="counselor-section-title">
              <h3>생체 데이터</h3>
            </div>
            <div className="counselor-biometric-grid">
              <DashboardCard
                title="행동 활성"
                info={dashboardInfoMessages.biometricRatio}
              >
                <WeekNavigator
                  label={biometricRatioWeek.currentWeek.label}
                  isFirst={biometricRatioWeek.isFirstWeek}
                  isLast={biometricRatioWeek.isLastWeek}
                  onPrev={biometricRatioWeek.goPrevWeek}
                  onNext={biometricRatioWeek.goNextWeek}
                />
                <LineChart
                  data={getWeekAdjustedLineData(
                    biometricRatio,
                    biometricRatioWeek.weekIndex,
                    selectedChildId,
                  )}
                  color="#6B9AC4"
                />
                <p className="counselor-card-note">
                  수요일에 행동 활성 지표가 유독 낮게 관찰되며 이후 점진적으로
                  활력을 회복하는 추세입니다.
                </p>
              </DashboardCard>

              <DashboardCard title="자율 신경 안정도" info={dashboardInfoMessages.autonomic}>
                <WeekNavigator
                  label={autonomicWeek.currentWeek.label}
                  isFirst={autonomicWeek.isFirstWeek}
                  isLast={autonomicWeek.isLastWeek}
                  onPrev={autonomicWeek.goPrevWeek}
                  onNext={autonomicWeek.goNextWeek}
                />
                <LineChart
                  data={getWeekAdjustedLineData(
                    hrvTrend,
                    autonomicWeek.weekIndex,
                    selectedChildId,
                  )}
                  color="#9b78f0"
                />
                <p className="counselor-card-note">
                  주말로 갈수록 RMSSD 수치가 상승하며 자율 신경 안정도가 개선이
                  되는 추세입니다.
                </p>
              </DashboardCard>
            </div>
          </section>

          <section className="counselor-dashboard-floating-summary" aria-label="요약 지표">
            <span>
              <FiFileText aria-hidden="true" /> 관찰 3건
            </span>
            <span>
              <FiMoon aria-hidden="true" /> 수면 주의
            </span>
            <span>
              <FiActivity aria-hidden="true" /> 활동 감소
            </span>
            <span>
              <FiHeart aria-hidden="true" /> 정서 안정 관찰
            </span>
          </section>
        </div>
      </section>

      {selectedObservation ? (
        <ObservationCommentModal
          record={selectedObservation}
          comment={selectedObservationComment}
          onClose={() => setSelectedObservation(null)}
          onSave={handleSaveObservationComment}
          onDelete={handleDeleteObservationComment}
        />
      ) : null}

      <button
        type="button"
        className="counselor-connection-floating-button"
        aria-label="상담사 연결 신청 알림 열기"
        onClick={() => setIsConnectionModalOpen(true)}
      >
        <FiBell aria-hidden="true" />
        {connectionRequests.length > 0 ? (
          <span>{connectionRequests.length}</span>
        ) : null}
      </button>

      {isConnectionModalOpen ? (
        <CounselorConnectionModal
          requests={connectionRequests}
          onAccept={handleAcceptConnectionRequest}
          onReject={handleRejectConnectionRequest}
          onClose={() => setIsConnectionModalOpen(false)}
        />
      ) : null}
    </main>
  )
}

export default CounselorDashboardPage
