import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="parent-report-page__privacy-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.0001 1.66663L4.16675 4.16663V8.33329C4.16675 12.1875 6.65841 15.775 10.0001 16.6666C13.3417 15.775 15.8334 12.1875 15.8334 8.33329V4.16663L10.0001 1.66663Z"
        stroke="currentColor"
        strokeWidth="1.6657"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EmotionsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M5.83325 3.33337V6.66671M14.1666 3.33337V6.66671M3.33325 8.33337H16.6666M5.41659 11.6667H5.42492M9.99992 11.6667H10.0083M14.5833 11.6667H14.5916M5.41659 15H5.42492M9.99992 15H10.0083M14.5833 15H14.5916M4.99992 5H14.9999C15.9204 5 16.6666 5.74619 16.6666 6.66667V15.8334C16.6666 16.7538 15.9204 17.5 14.9999 17.5H4.99992C4.07944 17.5 3.33325 16.7538 3.33325 15.8334V6.66667C3.33325 5.74619 4.07944 5 4.99992 5Z"
        stroke="currentColor"
        strokeWidth="1.6657"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SleepIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M3.33325 16.6667H16.6666M5.83325 13.3334V10.8334M9.16659 13.3334V7.50004M12.4999 13.3334V9.16671M15.8333 13.3334V5.83337"
        stroke="currentColor"
        strokeWidth="1.6657"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StabilityIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M2.5 10H5.83333L8.33333 5L11.6667 15L14.1667 10H17.5"
        stroke="currentColor"
        strokeWidth="1.6657"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.23825" stroke="currentColor" strokeWidth="0.761753" />
      <path
        d="M8 7V10.5M8 5.25H8.01"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ParentReportHeader() {
  return (
    <div className="parent-home-page__header">
      <div className="parent-home-page__header-copy">
        <h1 className="parent-home-page__title">리포트</h1>
        <p className="parent-home-page__subtitle">지민이의 변화 흐름입니다.</p>
      </div>
    </div>
  )
}

function ParentReportPage() {
  return (
    <MobilePageLayout
      header={<ParentReportHeader />}
      className="parent-home-page parent-report-page"
      contentClassName="parent-report-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <div className="parent-report-page__body">
        <section className="parent-report-page__privacy-banner" aria-label="프라이버시 안내">
          <div className="parent-report-page__privacy-row">
            <ShieldIcon />
            <p className="parent-report-page__privacy-copy">
              자녀의 프라이버시 보호를 위해 대화 원문은 제공되지 않으며, 분석된 감정 패턴
              지표만 공유됩니다.
            </p>
          </div>
        </section>

        <section className="parent-report-page__section" aria-labelledby="weekly-emotion-report">
          <div className="parent-report-page__section-header">
            <div className="parent-report-page__section-title-wrap">
              <span className="parent-report-page__section-icon parent-report-page__section-icon--blue">
                <EmotionsIcon />
              </span>
              <h2 id="weekly-emotion-report" className="parent-report-page__section-title">
                이번 주 감정 기록
              </h2>
            </div>
            <button
              type="button"
              className="parent-report-page__link-button"
              disabled
              aria-disabled="true"
            >
              전체보기
            </button>
          </div>

          <div className="parent-report-page__card parent-report-page__card--compact">
            <div className="parent-report-page__week-placeholder">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                <div key={day} className="parent-report-page__week-day">
                  <span className="parent-report-page__week-label">{day}</span>
                  <span
                    className={`parent-report-page__week-mood parent-report-page__week-mood--${
                      index % 3 === 0 ? 'yellow' : index % 3 === 1 ? 'blue' : 'green'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="parent-report-page__section" aria-labelledby="sleep-score-report">
          <div className="parent-report-page__section-header">
            <div className="parent-report-page__section-title-wrap">
              <span className="parent-report-page__section-icon parent-report-page__section-icon--blue">
                <SleepIcon />
              </span>
              <h2 id="sleep-score-report" className="parent-report-page__section-title">
                수면 점수 추이
              </h2>
            </div>
          </div>

          <div className="parent-report-page__card parent-report-page__card--chart">
            <div className="parent-report-page__bar-chart-placeholder">
              {[80, 90, 50, 60, 70, 85, 75].map((score, index) => (
                <div key={`${score}-${index}`} className="parent-report-page__bar-column">
                  <span
                    className={`parent-report-page__bar-score${
                      score <= 50 ? ' is-warning' : ''
                    }`}
                  >
                    {score}
                  </span>
                  <span
                    className={`parent-report-page__bar${
                      score <= 50 ? ' is-warning' : ''
                    }`}
                    style={{ height: `${score * 1.8}px` }}
                  />
                  <span className="parent-report-page__bar-day">
                    {['월', '화', '수', '목', '금', '토', '일'][index]}
                  </span>
                </div>
              ))}
            </div>
            <div className="parent-report-page__insight-line">
              수요일의 수면 점수가 다른 날보다 낮습니다.
            </div>
          </div>
        </section>

        <section
          className="parent-report-page__section"
          aria-labelledby="nervous-system-report"
        >
          <div className="parent-report-page__section-header">
            <div className="parent-report-page__section-title-wrap">
              <span className="parent-report-page__section-icon parent-report-page__section-icon--orange">
                <StabilityIcon />
              </span>
              <h2 id="nervous-system-report" className="parent-report-page__section-title">
                자율신경 안정도
              </h2>
              <button
                type="button"
                className="parent-report-page__info-button"
                disabled
                aria-label="자율신경 안정도 안내"
                aria-disabled="true"
              >
                <InfoIcon />
              </button>
            </div>
          </div>

          <div className="parent-report-page__card parent-report-page__card--line-chart">
            <div className="parent-report-page__line-chart-placeholder">
              <div className="parent-report-page__line-chart-grid" />
              <svg
                aria-hidden="true"
                className="parent-report-page__line-chart-plot"
                viewBox="0 0 280 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 120L48 110L92 88L136 98L180 84L224 62L276 72"
                  stroke="#F4B895"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[
                  [4, 120],
                  [48, 110],
                  [92, 88],
                  [136, 98],
                  [180, 84],
                  [224, 62],
                  [276, 72],
                ].map(([cx, cy]) => (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#F4B895" stroke="white" strokeWidth="3" />
                ))}
              </svg>
              <div className="parent-report-page__line-chart-labels">
                {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>
            <div className="parent-report-page__insight-line">
              자율신경 안정도가 주말로 갈수록 개선되는 추세입니다.
            </div>
          </div>
        </section>
      </div>
    </MobilePageLayout>
  )
}

export default ParentReportPage
