import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
  FiSettings,
} from 'react-icons/fi'

import DiaryEmotionIcon from '../../features/diary/components/DiaryEmotionIcon'
import type { DiaryEmotionKey } from '../../features/diary/constants/diaryEmotions'

type ChildListItem = {
  id: number
  name: string
  meta: string
  subText: string
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
  emotionKey?: DiaryEmotionKey
  content: string
  tags: string[]
}

type TimelineDay = {
  id: number
  date: string
  entries: TimelineEntry[]
}

const dashboardInfoMessages = {
  observation:
    '보호자가 기록한 아이의 일상 상태와 상담사 코멘트를 함께 확인하는 영역입니다.',
  sleepScore:
    '수면 시간, 규칙성, 회복 상태를 바탕으로 계산한 주간 수면 점수 추이입니다.',
  sleepEfficiency:
    '침대에 머문 시간 중 실제로 잠든 시간의 비율입니다. 낮을수록 수면의 질 저하를 의심할 수 있습니다.',
  expression:
    '최근 일기와 대화에서 반복적으로 나타난 감정 표현과 주요 문장을 모아 보여줍니다.',
  biometricRatio:
    '행동 활성은 신체 움직임 대비 심박 효율(ACC/HR+1)을 통해 정신운동 지체 유무를 나타내는 지표입니다.',
  autonomic:
    '자율 신경 안정도는 RMSSD를 산출하여 정서적 복원력 및 부교감 신경의 활성 상태를 반영하는 지표입니다.',
} as const

const counselorProfile = {
  name: '홍길동',
}

const selectedChildProfile = {
  name: '김주연',
  age: '13세',
  gender: '남',
  guardianName: '유주경',
}

const childList: ChildListItem[] = [
  {
    id: 1,
    name: '김주연',
    meta: '13세(남)',
    subText: '보호자 : 유주경',
  },
  { id: 2, name: '이온준', meta: '12세(남)', subText: '보호자 : 한서윤' },
  { id: 3, name: '박민서', meta: '14세(여)', subText: '보호자 : 박지현' },
  { id: 4, name: '정민지', meta: '11세(여)', subText: '보호자 : 정하늘' },
  { id: 5, name: '김나영', meta: '13세(여)', subText: '보호자 : 김도윤' },
  { id: 6, name: '이동현', meta: '15세(남)', subText: '보호자 : 이서진' },
  { id: 7, name: '박지우', meta: '12세(여)', subText: '보호자 : 박민정' },
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

const expressionTrend: Array<{ label: string; value: number; emotionKey: DiaryEmotionKey }> = [
  { label: '월', value: 42, emotionKey: 'calm' },
  { label: '화', value: 66, emotionKey: 'happy' },
  { label: '수', value: 58, emotionKey: 'angry' },
  { label: '목', value: 52, emotionKey: 'tired' },
  { label: '금', value: 62, emotionKey: 'calm' },
  { label: '토', value: 74, emotionKey: 'excited' },
  { label: '일', value: 68, emotionKey: 'happy' },
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
        emotionKey: 'happy',
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
        emotionKey: 'calm',
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
        emotionKey: 'angry',
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
        emotionKey: 'happy',
        content: '어디선가 화해했어요. 집에 와서도 기분이 좋았어요.',
        tags: ['친구 공유', '공감'],
      },
    ],
  },
]

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
  info,
  style,
}: {
  title: string
  children: ReactNode
  className?: string
  info?: string
  style?: CSSProperties
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  return (
    <section
      className={`counselor-dashboard-card${className ? ` ${className}` : ''}`}
      style={style}
    >
      <div className="counselor-dashboard-card-title">
        <h3>{title}</h3>
        {info ? (
          <span className="counselor-dashboard-info-wrap">
            <button
              type="button"
              className="counselor-dashboard-info-button"
              aria-label={`${title} 설명 보기`}
              aria-expanded={isInfoOpen}
              onClick={(event) => {
                event.stopPropagation()
                setIsInfoOpen((current) => !current)
              }}
            >
              <FiInfo aria-hidden="true" />
            </button>
            {isInfoOpen ? (
              <span
                className="counselor-dashboard-tooltip-row"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <span className="counselor-dashboard-tooltip" role="note">
                  {info}
                </span>
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
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
  data: Array<{ label: string; value: number; emotionKey?: DiaryEmotionKey }>
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

function ExpressionAnalysis({ maxHeight }: { maxHeight?: number }) {
  return (
    <DashboardCard
      title="최근 표현 분석"
      className="counselor-expression-card"
      info={dashboardInfoMessages.expression}
      style={maxHeight ? { height: maxHeight, maxHeight } : undefined}
    >
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
    </DashboardCard>
  )
}

function CounselorDashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [analysisCardHeight, setAnalysisCardHeight] = useState<number>()
  const mainColumnRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

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
                <ObservationList />
              </DashboardCard>

              <DashboardCard title="수면 점수 추이" info={dashboardInfoMessages.sleepScore}>
                <BarChart />
              </DashboardCard>

              <DashboardCard
                title="수면 효율 추이"
                info={dashboardInfoMessages.sleepEfficiency}
              >
                <LineChart data={sleepEfficiency} color="#f2a57d" />
                <p className="counselor-card-note">
                  수면 추세 시간 중 실제로 잠든 시간의 비율을 의미합니다.
                </p>
              </DashboardCard>
            </div>
            <div
              className="counselor-dashboard-column counselor-dashboard-column--analysis"
              aria-label="대시보드 분석 정보"
            >
              <ExpressionAnalysis maxHeight={analysisCardHeight} />
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
                <LineChart data={biometricRatio} color="#f2a57d" />
                <p className="counselor-card-note">
                  수요일에 행동 활성 지표가 유독 낮게 관찰되며 이후 점진적으로
                  활력을 회복하는 추세입니다.
                </p>
              </DashboardCard>

              <DashboardCard title="자율 신경 안정도" info={dashboardInfoMessages.autonomic}>
                <LineChart data={hrvTrend} color="#9b78f0" />
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
    </main>
  )
}

export default CounselorDashboardPage
