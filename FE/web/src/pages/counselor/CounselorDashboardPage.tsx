import { useState, type ReactNode } from 'react'
import {
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiHeart,
  FiInfo,
  FiMenu,
  FiMessageSquare,
  FiMoon,
} from 'react-icons/fi'

type ChildStatus = 'active' | 'done'

type ChildListItem = {
  id: number
  name: string
  meta: string
  subText: string
  status?: ChildStatus
}

type ObservationRecord = {
  id: number
  date: string
  day: string
  mood: string
  text: string
  commentCount?: number
}

type TimelineEntry = {
  id: number
  type: 'diary' | 'conversation'
  time?: string
  emotion?: string
  content: string
  tags: string[]
}

type TimelineDay = {
  id: number
  date: string
  entries: TimelineEntry[]
}

const childList: ChildListItem[] = [
  {
    id: 1,
    name: '김주연',
    meta: '13세(남)',
    subText: '보호자 : 유주경',
    status: 'active',
  },
  { id: 2, name: '이온준', meta: '12세', subText: '10차', status: 'done' },
  { id: 3, name: '박민서', meta: '14세', subText: '10차' },
  { id: 4, name: '정민지', meta: '11세', subText: '14차', status: 'active' },
  { id: 5, name: '김나영', meta: '13세', subText: '7차', status: 'done' },
  { id: 6, name: '이동현', meta: '15세', subText: '14차' },
  { id: 7, name: '박지우', meta: '12세', subText: '14차' },
]

const observationRecords: ObservationRecord[] = [
  {
    id: 1,
    date: '04/15',
    day: '화',
    mood: '침묵',
    text: '저녁 식사 때 말이 별로 없었음',
    commentCount: 1,
  },
  {
    id: 2,
    date: '04/14',
    day: '월',
    mood: '예민',
    text: '학교 얘기를 물어봤는데 짜증을 냄',
  },
  {
    id: 3,
    date: '04/13',
    day: '일',
    mood: '평온',
    text: '가족과 영화를 보며 편안해 보였음',
  },
]

const sleepScoreBars = [
  { label: '월', value: 78 },
  { label: '화', value: 92 },
  { label: '수', value: 56, variant: 'warning' },
  { label: '목', value: 70 },
  { label: '금', value: 76 },
  { label: '토', value: 86 },
  { label: '일', value: 80 },
]

const sleepEfficiency = [
  { label: '월', value: 48 },
  { label: '화', value: 43 },
  { label: '수', value: 78 },
  { label: '목', value: 52 },
  { label: '금', value: 43 },
  { label: '토', value: 37 },
  { label: '일', value: 40 },
]

const expressionTrend = [
  { label: '월', value: 42, emoji: '🙂' },
  { label: '화', value: 66, emoji: '😊' },
  { label: '수', value: 58, emoji: '😐' },
  { label: '목', value: 52, emoji: '😶' },
  { label: '금', value: 62, emoji: '🙂' },
  { label: '토', value: 74, emoji: '😊' },
  { label: '일', value: 68, emoji: '🙂' },
]

const biometricRatio = [
  { label: '월', value: 52 },
  { label: '화', value: 55 },
  { label: '수', value: 31 },
  { label: '목', value: 43 },
  { label: '금', value: 58 },
  { label: '토', value: 72 },
  { label: '일', value: 64 },
]

const hrvTrend = [
  { label: '월', value: 55 },
  { label: '화', value: 64 },
  { label: '수', value: 29 },
  { label: '목', value: 48 },
  { label: '금', value: 61 },
  { label: '토', value: 77 },
  { label: '일', value: 70 },
]

const timelineDays: TimelineDay[] = [
  {
    id: 1,
    date: '4월 15일 (월)',
    entries: [
      {
        id: 1,
        type: 'diary',
        emotion: '😊',
        content: '아빠랑 노는 일이었어요. 엄마가 커플 고양이를 사주었고, 지금 심심합니다.',
        tags: ['짜증 스러움', '기쁨'],
      },
    ],
  },
  {
    id: 2,
    date: '4월 16일 (화)',
    entries: [
      {
        id: 2,
        type: 'diary',
        emotion: '🙂',
        content: '오늘은 엄마에서 친구랑 놀았어요. 같이 숙제도 기분이 좋았어요.',
        tags: ['친구 공유', '공감'],
      },
      {
        id: 3,
        type: 'conversation',
        time: '09:03 - 09:10',
        content: '"무슨일?"',
        tags: ['부정'],
      },
    ],
  },
  {
    id: 3,
    date: '4월 17일 (수)',
    entries: [
      {
        id: 4,
        type: 'diary',
        emotion: '😐',
        content: '수학 시간에서 친구와 싸웠어요. 왜 싸웠는지 잘 모르겠어요. 집에 와서는 기분이 안 좋았어요.',
        tags: ['친구 문제', '불안'],
      },
      {
        id: 5,
        type: 'conversation',
        time: '18:30 - 18:40',
        content: '"다시 얘기하자 해줘"',
        tags: ['친구 공유', '유효'],
      },
    ],
  },
  {
    id: 4,
    date: '4월 19일 (금)',
    entries: [
      {
        id: 6,
        type: 'diary',
        emotion: '😰',
        content: '어디선가 화해했어요. 집에 와서도 기분이 좋았어요.',
        tags: ['친구 공유', '공감'],
      },
    ],
  },
]

function StatusBadge({ status }: { status?: ChildStatus }) {
  if (!status) {
    return null
  }

  return (
    <span className={`counselor-dashboard-status is-${status}`}>
      {status === 'done' ? '종료' : '진행'}
    </span>
  )
}

function MetricTag({
  children,
  tone = 'neutral',
}: {
  children: string
  tone?: 'blue' | 'green' | 'orange' | 'neutral'
}) {
  return <span className={`counselor-dashboard-tag is-${tone}`}>{children}</span>
}

function DashboardCard({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`counselor-dashboard-card${className ? ` ${className}` : ''}`}>
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function BarChart() {
  return (
    <div className="counselor-bar-chart" aria-label="수면 점수 추이">
      {sleepScoreBars.map((bar) => (
        <div className="counselor-bar-chart-item" key={bar.label}>
          <div className="counselor-bar-track">
            <span
              className={bar.variant === 'warning' ? 'is-warning' : undefined}
              style={{ height: `${bar.value}%` }}
            />
          </div>
          <strong>{bar.label}</strong>
        </div>
      ))}
    </div>
  )
}

function LineChart({
  data,
  color,
  showEmoji = false,
}: {
  data: Array<{ label: string; value: number; emoji?: string }>
  color: string
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
      <path d={path} style={{ stroke: color }} />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r={4.8} style={{ fill: color }} />
          {showEmoji && point.emoji ? (
            <text className="counselor-line-chart-emoji" x={point.x} y={point.y - 12}>
              {point.emoji}
            </text>
          ) : null}
          <text className="counselor-line-chart-label" x={point.x} y={height - 8}>
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function ObservationList() {
  return (
    <div className="counselor-observation-list">
      {observationRecords.map((record) => (
        <article className="counselor-observation-card" key={record.id}>
          <div className="counselor-observation-date">
            <strong>{record.date}</strong>
            <span>{record.day}</span>
          </div>
          <div className="counselor-observation-content">
            <MetricTag tone="green">{record.mood}</MetricTag>
            <p>{record.text}</p>
            {record.commentCount ? (
              <button type="button" className="counselor-comment-link">
                <FiMessageSquare aria-hidden="true" />
                상담사 코멘트 {record.commentCount}개
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function ExpressionAnalysis() {
  return (
    <DashboardCard title="최근 표현 분석" className="counselor-expression-card">
      <div className="counselor-expression-tabs" aria-label="분석 범위">
        <button type="button" className="is-active">
          전체
        </button>
        <button type="button">일기</button>
        <button type="button">대화</button>
        <button type="button" className="counselor-expression-more">
          감정 흐름 크게보기
        </button>
      </div>

      <div className="counselor-expression-week">
        <button type="button" aria-label="이전 주">
          <FiChevronLeft aria-hidden="true" />
        </button>
        <strong>2026년 5월 1주차</strong>
        <button type="button" aria-label="다음 주">
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="counselor-ai-summary">
        <span>AI 분석 인사이트</span>
        <p>
          최근 3일간 부모와의 갈등을 바탕으로 다음과 같은 제안을 하고 있습니다.
          부모님은 자녀가 약간 섭섭해 보일 때 가벼운 공감 질문을 먼저 건네는
          것이 좋습니다.
        </p>
      </div>

      <div className="counselor-expression-chart">
        <LineChart data={expressionTrend} color="#88b5c4" showEmoji />
      </div>

      <div className="counselor-timeline">
        {timelineDays.map((day) => (
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
                    {entry.emotion ? (
                      <span className="entry-emotion" aria-hidden="true">
                        {entry.emotion}
                      </span>
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
    </DashboardCard>
  )
}

function CounselorDashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
          {childList.map((child, index) => (
            <button
              type="button"
              className={index === 0 ? 'is-selected' : undefined}
              key={child.id}
            >
              <span className="counselor-child-avatar" aria-hidden="true">
                {child.name.slice(0, 1)}
              </span>
              <span className="counselor-child-summary">
                <strong>{child.name}</strong>
                <em>{child.meta}</em>
              </span>
              <small className="counselor-child-subtext">{child.subText}</small>
              <StatusBadge status={child.status} />
            </button>
          ))}
        </nav>
      </aside>

      <section className="counselor-dashboard-main">
        <div className="counselor-dashboard-content">
          <header className="counselor-dashboard-hero">
            <div>
              <h2>김주연 님의 관찰 일지</h2>
              <p>
                <span>4차 회기 6회</span>
                <span>다음 일정: 12주 3일 21시</span>
              </p>
            </div>
            <time dateTime="2023-11-17">2023년 11월 17일 작성됨</time>
          </header>

          <div className="counselor-dashboard-grid">
            <div className="counselor-dashboard-column" aria-label="대시보드 주요 정보">
              <DashboardCard title="아이 관찰 기록">
                <ObservationList />
              </DashboardCard>

              <DashboardCard title="수면 점수 추이">
                <BarChart />
              </DashboardCard>

              <DashboardCard title="수면 효율 추이">
                <LineChart data={sleepEfficiency} color="#f2a57d" />
                <p className="counselor-card-note">
                  수면 추세 시간 중 실제로 잠든 시간의 비율을 의미합니다.
                </p>
              </DashboardCard>
            </div>
            <div className="counselor-dashboard-column" aria-label="대시보드 분석 정보">
              <ExpressionAnalysis />
            </div>
          </div>

          <section className="counselor-biometric-section">
            <div className="counselor-section-title">
              <h3>생체 데이터</h3>
              <button type="button" aria-label="생체 데이터 안내">
                <FiInfo aria-hidden="true" />
              </button>
            </div>
            <div className="counselor-biometric-grid">
              <DashboardCard title="비율 (HR + ACC)">
                <LineChart data={biometricRatio} color="#f2a57d" />
                <p className="counselor-card-note">
                  주간 활동 및 행동 패턴의 변화를 보여줍니다. 수요일 활동량
                  감소에 주목해주세요.
                </p>
              </DashboardCard>

              <DashboardCard title="자율신경 (HRV)">
                <LineChart data={hrvTrend} color="#9b78f0" />
                <p className="counselor-card-note">
                  주간 활동 및 행동 패턴의 변화를 보여줍니다. 수요일 활동량
                  감소에 주목해주세요.
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
    </main>
  )
}

export default CounselorDashboardPage
