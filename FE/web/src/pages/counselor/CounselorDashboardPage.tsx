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
  FiX,
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

type ExpressionFilter = 'all' | 'diary' | 'conversation'

type ExpressionTrendPoint = {
  label: string
  value: number
  emotionKey?: DiaryEmotionKey
}

type ExpressionWeek = {
  id: string
  label: string
  insight: string
  trend: Record<ExpressionFilter, ExpressionTrendPoint[]>
  days: TimelineDay[]
}

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

const expressionTabs: Array<{ key: ExpressionFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'diary', label: '일기' },
  { key: 'conversation', label: '대화' },
]

const DEFAULT_EXPRESSION_WEEK_INDEX = 1

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

const expressionWeeks: ExpressionWeek[] = [
  {
    id: '2026-04-week-4',
    label: '2026년 4월 4주차',
    insight:
      '지난 주에는 대화에서 부정 표현이 먼저 나타난 뒤 일기에서 불안 표현이 이어졌습니다. 주말에는 회복 표현이 함께 관찰됩니다.',
    trend: {
      all: [
        { label: '월', value: 36, emotionKey: 'tired' },
        { label: '화', value: 52, emotionKey: 'calm' },
        { label: '수', value: 49, emotionKey: 'sad' },
        { label: '목', value: 61, emotionKey: 'happy' },
        { label: '금', value: 54, emotionKey: 'calm' },
        { label: '토', value: 70, emotionKey: 'excited' },
        { label: '일', value: 64, emotionKey: 'happy' },
      ],
      diary: [
        { label: '월', value: 38, emotionKey: 'tired' },
        { label: '화', value: 48, emotionKey: 'calm' },
        { label: '수', value: 44, emotionKey: 'sad' },
        { label: '목', value: 58, emotionKey: 'happy' },
        { label: '금', value: 55, emotionKey: 'calm' },
        { label: '토', value: 68, emotionKey: 'excited' },
        { label: '일', value: 63, emotionKey: 'happy' },
      ],
      conversation: [
        { label: '월', value: 30 },
        { label: '화', value: 44 },
        { label: '수', value: 58 },
        { label: '목', value: 54 },
        { label: '금', value: 47 },
        { label: '토', value: 62 },
        { label: '일', value: 59 },
      ],
    },
    days: [
      {
        id: 11,
        date: '4월 22일 (수)',
        entries: [
          {
            id: 11,
            type: 'diary',
            emotionKey: 'sad',
            content: '수업 시간에 집중이 잘 안 되었고, 집에 와서도 조금 멍한 느낌이 이어졌어요.',
            tags: ['집중 저하', '무기력'],
          },
          {
            id: 12,
            type: 'conversation',
            time: '20:12 - 20:18',
            content: '"그냥 혼자 있고 싶어"',
            tags: ['회피', '피로'],
          },
        ],
      },
      {
        id: 12,
        date: '4월 25일 (토)',
        entries: [
          {
            id: 13,
            type: 'diary',
            emotionKey: 'excited',
            content: '오랜만에 밖에 나가서 산책했어요. 바람이 시원해서 기분이 조금 좋아졌어요.',
            tags: ['활동 증가', '회복'],
          },
        ],
      },
    ],
  },
  {
    id: '2026-05-week-1',
    label: '2026년 5월 1주차',
    insight:
      '최근 3일간 부모와의 갈등을 바탕으로 다음과 같은 제안을 하고 있습니다. 부모님은 자녀가 약간 섬세한 감정 표현을 할 때 바로 질문하기보다 가볍게 함께할 수 있는 활동을 제안하는 편이 좋습니다.',
    trend: {
      all: expressionTrend,
      diary: [
        { label: '월', value: 44, emotionKey: 'calm' },
        { label: '화', value: 62, emotionKey: 'happy' },
        { label: '수', value: 55, emotionKey: 'angry' },
        { label: '목', value: 50, emotionKey: 'tired' },
        { label: '금', value: 60, emotionKey: 'calm' },
        { label: '토', value: 72, emotionKey: 'excited' },
        { label: '일', value: 66, emotionKey: 'happy' },
      ],
      conversation: [
        { label: '월', value: 38 },
        { label: '화', value: 52 },
        { label: '수', value: 64 },
        { label: '목', value: 48 },
        { label: '금', value: 55 },
        { label: '토', value: 60 },
        { label: '일', value: 58 },
      ],
    },
    days: timelineDays,
  },
  {
    id: '2026-05-week-2',
    label: '2026년 5월 2주차',
    insight:
      '이번 주에는 일기에서 긍정 표현이 늘었고, 대화에서는 보호자에게 확인을 요청하는 문장이 반복되었습니다.',
    trend: {
      all: [
        { label: '월', value: 56, emotionKey: 'calm' },
        { label: '화', value: 61, emotionKey: 'happy' },
        { label: '수', value: 63, emotionKey: 'calm' },
        { label: '목', value: 67, emotionKey: 'happy' },
        { label: '금', value: 59, emotionKey: 'tired' },
        { label: '토', value: 73, emotionKey: 'excited' },
        { label: '일', value: 76, emotionKey: 'happy' },
      ],
      diary: [
        { label: '월', value: 58, emotionKey: 'calm' },
        { label: '화', value: 64, emotionKey: 'happy' },
        { label: '수', value: 66, emotionKey: 'calm' },
        { label: '목', value: 70, emotionKey: 'happy' },
        { label: '금', value: 61, emotionKey: 'tired' },
        { label: '토', value: 76, emotionKey: 'excited' },
        { label: '일', value: 78, emotionKey: 'happy' },
      ],
      conversation: [
        { label: '월', value: 42 },
        { label: '화', value: 46 },
        { label: '수', value: 50 },
        { label: '목', value: 55 },
        { label: '금', value: 48 },
        { label: '토', value: 60 },
        { label: '일', value: 62 },
      ],
    },
    days: [
      {
        id: 21,
        date: '5월 6일 (수)',
        entries: [
          {
            id: 21,
            type: 'diary',
            emotionKey: 'calm',
            content: '숙제를 일찍 끝내고 좋아하는 음악을 들었어요. 마음이 조금 차분해졌어요.',
            tags: ['차분함', '자기 조절'],
          },
          {
            id: 22,
            type: 'conversation',
            time: '19:40 - 19:44',
            content: '"나 오늘 잘한 거 맞지?"',
            tags: ['확인 요청', '칭찬 욕구'],
          },
        ],
      },
      {
        id: 22,
        date: '5월 9일 (토)',
        entries: [
          {
            id: 23,
            type: 'diary',
            emotionKey: 'excited',
            content: '가족이랑 같이 게임을 했어요. 많이 웃어서 기분이 좋았어요.',
            tags: ['가족 활동', '긍정 표현'],
          },
        ],
      },
    ],
  },
]

const emotionFlowModeTabs: Array<{ key: EmotionFlowMode; label: string }> = [
  { key: 'monthly', label: '월간 보기' },
  { key: 'yearly', label: '연간 보기' },
]

const emotionFlowPeriods: Record<EmotionFlowMode, EmotionFlowPeriod[]> = {
  monthly: [
    {
      id: '2025-04-week-3',
      label: '2025년 4월 3주',
      points: [
        { label: '3월 4주', diary: 7, conversation: 5 },
        { label: '4월 1주', diary: 11, conversation: 8 },
        { label: '4월 2주', diary: 13, conversation: 6 },
        { label: '4월 3주', diary: 10, conversation: 12 },
      ],
    },
    {
      id: '2025-05-week-1',
      label: '2025년 5월 1주',
      points: [
        { label: '4월 2주', diary: 10, conversation: 8 },
        { label: '4월 3주', diary: 12, conversation: 10 },
        { label: '4월 4주', diary: 9, conversation: 13 },
        { label: '5월 1주', diary: 15, conversation: 11 },
      ],
    },
  ],
  yearly: [
    {
      id: '2025',
      label: '2025년',
      points: [
        { label: '2025.02', diary: 8, conversation: 6 },
        { label: '2025.03', diary: 6, conversation: 5 },
        { label: '2025.04', diary: 10, conversation: 6 },
        { label: '2025.05', diary: 13, conversation: 8 },
        { label: '2025.06', diary: 9, conversation: 7 },
        { label: '2025.07', diary: 12, conversation: 9 },
        { label: '2025.08', diary: 14, conversation: 10 },
        { label: '2025.09', diary: 10, conversation: 7 },
        { label: '2025.10', diary: 11, conversation: 8 },
        { label: '2025.11', diary: 15, conversation: 11 },
        { label: '2025.12', diary: 13, conversation: 10 },
      ],
    },
    {
      id: '2026',
      label: '2026년',
      points: [
        { label: '2026.01', diary: 9, conversation: 7 },
        { label: '2026.02', diary: 11, conversation: 8 },
        { label: '2026.03', diary: 12, conversation: 10 },
        { label: '2026.04', diary: 16, conversation: 12 },
        { label: '2026.05', diary: 14, conversation: 13 },
      ],
    },
  ],
}

function isTimelineEntryVisible(entry: TimelineEntry, filter: ExpressionFilter) {
  return filter === 'all' || entry.type === filter
}

function getFilteredTimelineDays(days: TimelineDay[], filter: ExpressionFilter) {
  return days
    .map((day) => ({
      ...day,
      entries: day.entries.filter((entry) => isTimelineEntryVisible(entry, filter)),
    }))
    .filter((day) => day.entries.length > 0)
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

function ExpressionAnalysis({ maxHeight }: { maxHeight?: number }) {
  const [activeFilter, setActiveFilter] = useState<ExpressionFilter>('all')
  const [activeWeekIndex, setActiveWeekIndex] = useState(DEFAULT_EXPRESSION_WEEK_INDEX)
  const [isEmotionFlowOpen, setIsEmotionFlowOpen] = useState(false)
  const currentWeek = expressionWeeks[activeWeekIndex]
  const currentTrend = currentWeek.trend[activeFilter]
  const visibleTimelineDays = getFilteredTimelineDays(currentWeek.days, activeFilter)
  const isFirstWeek = activeWeekIndex === 0
  const isLastWeek = activeWeekIndex === expressionWeeks.length - 1

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

      <div className="counselor-expression-week">
        <button
          type="button"
          aria-label="이전 주"
          disabled={isFirstWeek}
          onClick={() => setActiveWeekIndex((current) => Math.max(0, current - 1))}
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        <strong>{currentWeek.label}</strong>
        <button
          type="button"
          aria-label="다음 주"
          disabled={isLastWeek}
          onClick={() =>
            setActiveWeekIndex((current) => Math.min(expressionWeeks.length - 1, current + 1))
          }
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="counselor-ai-summary">
        <span>AI 분석 인사이트</span>
        <p>{currentWeek.insight}</p>
      </div>

      <div className="counselor-expression-chart">
        <LineChart
          data={currentTrend}
          color="#88b5c4"
          showEmoji={activeFilter === 'diary'}
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
