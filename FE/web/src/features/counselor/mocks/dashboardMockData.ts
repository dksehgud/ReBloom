import type { DiaryEmotionKey } from '../../diary/constants/diaryEmotions'
import type {
  ChildListItem,
  CounselorConnectionRequest,
  DashboardWeekOffsets,
  EmotionFlowMode,
  EmotionFlowPeriod,
  ExpressionFilter,
  ExpressionWeek,
  ObservationComment,
  ObservationRecord,
  ObservationRecordSeed,
  TimelineDay,
} from '../types/dashboard'

const dashboardInfoMessages = {
  observation:
    '보호자가 기록한 아이의 일상 상태와 상담사 코멘트를 함께 확인하는 영역입니다.',
  sleepScore:
    '수면 시간, 규칙성, 회복 상태를 바탕으로 계산한 주간 수면 점수 추이입니다.',
  sleepEfficiency:
    '침대에 머문 시간 중 실제로 잠든 시간의 비율입니다. 높을수록 수면의 질이 안정적일 수 있습니다.',
  expression:
    '최근 일기와 대화에서 반복적으로 나타난 감정 표현과 주요 문장을 모아 보여줍니다.\n그래프는 가용한 생체 데이터와 언어표현 데이터를 융합하여 나온 PHQ-8 예측 점수 입니다.',
  biometricRatio:
    '행동 활성은 신체 움직임 대비 심박 효율(ACC/HR+1)을 통해 정신운동 지체 유무를 나타내는 지표입니다.',
  autonomic:
    '자율 신경 안정도는 RMSSD를 산출하여 정서적 복원력 및 부교감 신경의 활성 상태를 반영하는 지표입니다.',
} as const

const counselorProfile = {
  name: '홍길동',
}

const MOCK_CHILDREN_ID = '22222222-2222-2222-2222-222222222222'
const MOCK_COUNSELOR_ID = '55555555-5555-5555-5555-555555555555'

function getMockReportId(recordId: number | string) {
  return `11111111-1111-4111-8111-${String(recordId).padStart(12, '0')}`
}

function getMockCommentId(recordId: number | string) {
  return `44444444-4444-4444-8444-${String(recordId).padStart(12, '0')}`
}

function createMockComment(
  recordId: number | string,
  context: string,
  createdAt = '2026-05-07T21:00:00',
): ObservationComment {
  return {
    commentId: getMockCommentId(recordId),
    counselorId: MOCK_COUNSELOR_ID,
    reportId: getMockReportId(recordId),
    context,
    createdAt,
  }
}

function createObservationRecord(record: ObservationRecordSeed): ObservationRecord {
  return {
    ...record,
    childrenId: record.childrenId ?? MOCK_CHILDREN_ID,
    reportId: record.reportId ?? getMockReportId(record.id),
  }
}

const initialChildList: ChildListItem[] = [
  {
    id: 'mock-child-1',
    name: '김주연',
    meta: '13세(남)',
    subText: '보호자 : 유주경',
    age: '13세',
    gender: '남',
    guardianName: '유주경',
    registeredAt: '2026-05-08T09:20:00',
  },
  {
    id: 'mock-child-2',
    name: '이온준',
    meta: '12세(남)',
    subText: '보호자 : 한서윤',
    age: '12세',
    gender: '남',
    guardianName: '한서윤',
    registeredAt: '2026-05-06T14:12:00',
  },
  {
    id: 'mock-child-3',
    name: '박민서',
    meta: '14세(여)',
    subText: '보호자 : 박지현',
    age: '14세',
    gender: '여',
    guardianName: '박지현',
    registeredAt: '2026-05-05T10:45:00',
  },
  {
    id: 'mock-child-4',
    name: '정민지',
    meta: '11세(여)',
    subText: '보호자 : 정하늘',
    age: '11세',
    gender: '여',
    guardianName: '정하늘',
    registeredAt: '2026-05-03T17:30:00',
  },
  {
    id: 'mock-child-5',
    name: '김나영',
    meta: '13세(여)',
    subText: '보호자 : 김도윤',
    age: '13세',
    gender: '여',
    guardianName: '김도윤',
    registeredAt: '2026-05-01T08:50:00',
  },
]

const initialConnectionRequests: CounselorConnectionRequest[] = [
  {
    id: 'mock-request-101',
    parentName: '최유리',
    parentEmail: 'yuri.choi@example.com',
    requestedAt: '2026-05-11T09:18:00',
    child: {
      id: 'mock-child-8',
      name: '최하린',
      meta: '10세(여)',
      subText: '보호자 : 최유리',
      age: '10세',
      gender: '여',
      guardianName: '최유리',
      registeredAt: '2026-05-11T09:18:00',
    },
  },
  {
    id: 'mock-request-102',
    parentName: '문정우',
    parentEmail: 'jungwoo.moon@example.com',
    requestedAt: '2026-05-10T18:42:00',
    child: {
      id: 'mock-child-9',
      name: '문시온',
      meta: '12세(남)',
      subText: '보호자 : 문정우',
      age: '12세',
      gender: '남',
      guardianName: '문정우',
      registeredAt: '2026-05-10T18:42:00',
    },
  },
]

const observationRecords: ObservationRecord[] = ([
  {
    id: 1,
    date: '04/15',
    day: '화',
    mood: '침묵',
    text: '저녁 식사 때 말이 별로 없었음',
    comment: createMockComment(1, '아이에게 이렇게 이렇게 다가가 보세요'),
  },
  {
    id: 2,
    date: '04/14',
    day: '월',
    mood: '예민',
    text: '등교 이야기를 물어보는 데 짜증을 냄',
  },
  {
    id: 3,
    date: '04/13',
    day: '일',
    mood: '평온',
    text: '가족과 대화를 보며 편안해 보였음',
  },
  {
    id: 4,
    date: '04/12',
    day: '토',
    mood: '평온',
    text: '가족과 외출 후 편안하게 쉬었음',
  },
] satisfies ObservationRecordSeed[]).map(createObservationRecord)

const observationRecordsByWeek: Record<string, ObservationRecord[]> = {
  '2026-04-week-4': ([
    {
      id: 101,
      date: '04/22',
      day: '수',
      mood: '불안',
      text: '등교 전 준비 시간이 길어지고 작은 소리에 예민하게 반응함',
    },
    {
      id: 102,
      date: '04/21',
      day: '화',
      mood: '침묵',
      text: '저녁 식사 중 대화 참여가 적고 고개를 자주 숙임',
    },
    {
      id: 103,
      date: '04/20',
      day: '월',
      mood: '평온',
      text: '주말 저녁에 가족과 함께 간식을 먹으며 편안하게 쉬었음',
    },
  ] satisfies ObservationRecordSeed[]).map(createObservationRecord),
  '2026-05-week-1': observationRecords,
  '2026-05-week-2': ([
    {
      id: 201,
      date: '05/08',
      day: '금',
      mood: '활발',
      text: '친구와 있었던 일을 먼저 이야기하며 표정이 밝아짐',
    },
    {
      id: 202,
      date: '05/07',
      day: '목',
      mood: '평온',
      text: '숙제를 마친 뒤 스스로 정리하고 차분하게 마무리함',
    },
    {
      id: 203,
      date: '05/06',
      day: '수',
      mood: '예민',
      text: '잠들기 전 걱정을 반복해서 말하고 보호자 확인을 요청함',
    },
    {
      id: 204,
      date: '05/05',
      day: '화',
      mood: '활발',
      text: '외출 중 주변 풍경을 이야기하며 웃음이 많았음',
    },
  ] satisfies ObservationRecordSeed[]).map(createObservationRecord),
}

const allObservationRecords = Object.values(observationRecordsByWeek).flat()

const initialObservationComments = allObservationRecords.reduce<
  Record<string, ObservationComment | null>
>((comments, record) => {
  comments[record.reportId] = record.comment ?? null
  return comments
}, {})

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
const INITIAL_DASHBOARD_WEEK_OFFSETS: DashboardWeekOffsets = {
  observation: 0,
  sleepScore: 0,
  sleepEfficiency: 0,
  expression: 0,
  biometricRatio: 0,
  autonomic: 0,
}

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
    date: '4월 15일 (화)',
    entries: [
      {
        id: 1,
        type: 'diary',
        emotionKey: 'happy',
        content: '오늘은 좋은 일이 있었어요. 엄마가 커플 고양이를 사주셨고, 지금 사랑합니다.',
        tags: ['기쁨', '애정 표현'],
      },
    ],
  },
  {
    id: 2,
    date: '4월 16일 (수)',
    entries: [
      {
        id: 2,
        type: 'diary',
        emotionKey: 'calm',
        content: '오늘은 엄마와 친구 이야기를 했어요. 같이 숙제를 해서 기분이 좋아요.',
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
    date: '4월 17일 (목)',
    entries: [
      {
        id: 4,
        type: 'diary',
        emotionKey: 'angry',
        content: '수학 시간에서 친구와 싸웠어요. 왜 싸웠는지 잘 모르겠어요.',
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
]

const expressionWeeks: ExpressionWeek[] = [
  {
    id: '2026-04-week-4',
    label: '2026년도 4월 4주차',
    insight:
      '지난 주에는 대화에서 부정 표현이 먼저 나타났지만 일기에서는 불안 표현이 이어졌습니다. 주말에는 회복 표현이 함께 관찰됩니다.',
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
    days: timelineDays.slice(0, 2),
  },
  {
    id: '2026-05-week-1',
    label: '2026년도 5월 1주차',
    insight:
      '최근 3일간 부모와의 갈등을 바탕으로 다음과 같은 제안을 하고 있습니다. 바로 질문하기보다 가볍게 함께하는 행동이 좋습니다.',
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
    label: '2026년도 5월 2주차',
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
    days: timelineDays.slice(1),
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

export {
  DEFAULT_EXPRESSION_WEEK_INDEX,
  INITIAL_DASHBOARD_WEEK_OFFSETS,
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
}
