import { useState } from 'react'

import DiaryEmotionIcon from '../../../diary/components/DiaryEmotionIcon'
import {
  dashboardInfoMessages,
  expressionTabs,
  expressionWeeks,
} from '../../mocks/dashboardMockData'
import type { ExpressionFilter } from '../../types/dashboard'
import { getFilteredTimelineDays } from '../../utils/dashboardTimeline'
import { getWeekAdjustedLineData } from '../../utils/dashboardMetrics'
import DashboardCard from './DashboardCard'
import EmotionFlowModal from './EmotionFlowModal'
import MetricTag from './MetricTag'
import WeekNavigator from './WeekNavigator'
import LineChart from './charts/LineChart'

type ExpressionAnalysisProps = {
  maxHeight?: number
  weekIndex: number
  childId: number
  onPrevWeek: () => void
  onNextWeek: () => void
}

function ExpressionAnalysis({
  maxHeight,
  weekIndex,
  childId,
  onPrevWeek,
  onNextWeek,
}: ExpressionAnalysisProps) {
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

export default ExpressionAnalysis
