import { useState, type CSSProperties } from 'react'

import DiaryEmotionIcon from '../../../diary/components/DiaryEmotionIcon'
import {
  dashboardInfoMessages,
  expressionTabs,
} from '../../mocks/dashboardMockData'
import type { DashboardExpressionAnalysis, ExpressionFilter } from '../../types/dashboard'
import { getFilteredTimelineDays } from '../../utils/dashboardTimeline'
import DashboardCard from './DashboardCard'
import EmotionFlowModal from './EmotionFlowModal'
import MetricTag from './MetricTag'
import WeekNavigator from './WeekNavigator'
import LineChart from './charts/LineChart'

type ExpressionAnalysisProps = {
  analysis: DashboardExpressionAnalysis
  error?: string
  isFirstWeek: boolean
  isLastWeek: boolean
  isLoading?: boolean
  maxHeight?: number
  weekLabel: string
  childId: string
  onPrevWeek: () => void
  onNextWeek: () => void
}

const DEFAULT_EXPRESSION_CARD_HEIGHT = 1092.5

function ExpressionAnalysis({
  analysis,
  error,
  isFirstWeek,
  isLastWeek,
  isLoading = false,
  maxHeight,
  weekLabel,
  childId,
  onPrevWeek,
  onNextWeek,
}: ExpressionAnalysisProps) {
  const [activeFilter, setActiveFilter] = useState<ExpressionFilter>('all')
  const [isEmotionFlowOpen, setIsEmotionFlowOpen] = useState(false)
  const currentTrend = analysis.trend[activeFilter]
  const visibleTimelineDays = getFilteredTimelineDays(analysis.days, activeFilter)
  const hasVisibleExpressionData =
    currentTrend.length > 0 || visibleTimelineDays.length > 0
  const summary = isLoading
    ? '분석 데이터를 불러오는 중입니다.'
    : error ?? (analysis.insight || '표시할 분석 요약이 없습니다.')

  return (
    <DashboardCard
      title="최근 표현 분석"
      className="counselor-expression-card"
      info={dashboardInfoMessages.expression}
      style={
        {
          '--counselor-expression-card-height': `${
            maxHeight ?? DEFAULT_EXPRESSION_CARD_HEIGHT
          }px`,
        } as CSSProperties
      }
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
          감정 흐름 크게 보기
        </button>
      </div>

      <div className="counselor-expression-scroll">
        <WeekNavigator
          label={weekLabel}
          isFirst={isFirstWeek}
          isLast={isLastWeek}
          onPrev={onPrevWeek}
          onNext={onNextWeek}
        />

        <div className="counselor-ai-summary">
          <span>AI 분석 인사이트</span>
          <p>{summary}</p>
        </div>

        {hasVisibleExpressionData ? (
          <>
            {currentTrend.length > 0 ? (
              <div className="counselor-expression-chart">
                <LineChart
                  data={currentTrend}
                  color="#88b5c4"
                  showLine={activeFilter !== 'diary'}
                  showEmoji={activeFilter !== 'conversation'}
                  xAxisLabels={analysis.weekLabels}
                />
              </div>
            ) : null}

            {visibleTimelineDays.length > 0 ? (
              <div className="counselor-timeline">
                {visibleTimelineDays.map((day) => (
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
                ))}
              </div>
            ) : (
              <p className="counselor-timeline-empty counselor-expression-empty">
                선택한 주차의 기록이 없습니다.
              </p>
            )}
          </>
        ) : (
          <p className="counselor-timeline-empty counselor-expression-empty">
            선택한 주차의 기록이 없습니다.
          </p>
        )}
      </div>
      {isEmotionFlowOpen ? (
        <EmotionFlowModal childId={childId} onClose={() => setIsEmotionFlowOpen(false)} />
      ) : null}
    </DashboardCard>
  )
}

export default ExpressionAnalysis
