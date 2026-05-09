import { FiInfo, FiSettings } from 'react-icons/fi'

type ChildStatus = 'active' | 'done'

type ChildListItem = {
  id: number
  name: string
  meta: string
  subText: string
  status?: ChildStatus
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
          <div className="counselor-dashboard-column" aria-label="대시보드 주요 정보" />
          <div className="counselor-dashboard-column" aria-label="대시보드 분석 정보" />
        </div>

        <section className="counselor-biometric-section">
          <div className="counselor-section-title">
            <h3>생체 데이터</h3>
            <button type="button" aria-label="생체 데이터 안내">
              <FiInfo aria-hidden="true" />
            </button>
          </div>
          <div className="counselor-biometric-grid" />
        </section>
      </section>
    </main>
  )
}

export default CounselorDashboardPage
