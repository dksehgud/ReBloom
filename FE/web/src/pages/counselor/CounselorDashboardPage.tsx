import { FiInfo, FiSettings } from 'react-icons/fi'

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
