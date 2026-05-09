import type { ReactNode } from 'react'
import {
  FiActivity,
  FiFileText,
  FiHeart,
  FiInfo,
  FiMessageSquare,
  FiMoon,
  FiSettings,
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
  tone?: 'green' | 'neutral'
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
}: {
  data: Array<{ label: string; value: number }>
  color: string
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

function CounselorDashboardPage() {
  return (
    <main className="counselor-dashboard">
      <aside className="counselor-dashboard-sidebar">
        <header className="counselor-dashboard-brand">
          <div>
            <h1>RE:BLOOM</h1>
            <p>상담사 대시보드</p>
          </div>
          <button type="button" aria-label="설정">
            <FiSettings aria-hidden="true" />
          </button>
        </header>

        <nav className="counselor-child-list" aria-label="상담 아동 목록">
          {childList.map((child, index) => (
            <button
              type="button"
              className={index === 0 ? 'is-selected' : undefined}
              key={child.id}
            >
              <span>
                <strong>{child.name}</strong>
                <em>{child.meta}</em>
              </span>
              <small>{child.subText}</small>
              <StatusBadge status={child.status} />
            </button>
          ))}
        </nav>
      </aside>

      <section className="counselor-dashboard-main">
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
          <div className="counselor-dashboard-column" aria-label="대시보드 분석 정보" />
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
      </section>
    </main>
  )
}

export default CounselorDashboardPage
