import { useState } from 'react'

import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'
import {
  parentReportWeeks,
  reportWeekdays,
  type ParentReportMood,
} from '../../features/guardian/constants/parentReport'

const STABILITY_CHART_WIDTH = 300
const STABILITY_CHART_HEIGHT = 180
const STABILITY_CHART_PADDING_X = 12
const STABILITY_CHART_PADDING_TOP = 12
const STABILITY_CHART_PADDING_BOTTOM = 26

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

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M12.5 5L7.5 10L12.5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="currentColor"
        strokeWidth="1.6"
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

function EmotionChip({ mood }: { mood: ParentReportMood }) {
  const toneClass = mood.tone ? ` parent-report-page__week-mood--${mood.tone}` : ''

  return (
    <div className="parent-report-page__week-day">
      <span className="parent-report-page__week-label">{mood.weekday}</span>
      <span
        className={`parent-report-page__week-mood${
          mood.emoji ? toneClass : ' parent-report-page__week-mood--empty'
        }`}
      >
        {mood.emoji}
      </span>
    </div>
  )
}

function getBarTone(score: number) {
  if (score <= 55) {
    return 'warning'
  }

  return 'default'
}

function createStabilityChartData(scores: typeof parentReportWeeks[number]['stabilityScores']) {
  const usableWidth = STABILITY_CHART_WIDTH - STABILITY_CHART_PADDING_X * 2
  const usableHeight =
    STABILITY_CHART_HEIGHT - STABILITY_CHART_PADDING_TOP - STABILITY_CHART_PADDING_BOTTOM
  const stepX = usableWidth / Math.max(scores.length - 1, 1)

  const points = scores.map((item, index) => {
    const x = STABILITY_CHART_PADDING_X + stepX * index
    const y =
      STABILITY_CHART_PADDING_TOP +
      ((100 - item.score) / 100) * usableHeight

    return {
      ...item,
      x,
      y,
    }
  })

  return {
    points,
    path: points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' '),
  }
}

function ParentReportPage() {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(1)
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const currentWeek = parentReportWeeks[selectedWeekIndex]
  const isPrevDisabled = selectedWeekIndex === 0
  const isNextDisabled = selectedWeekIndex === parentReportWeeks.length - 1
  const stabilityChart = createStabilityChartData(currentWeek.stabilityScores)

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
              지표만 공유합니다.
            </p>
          </div>
        </section>

        <section className="parent-report-page__week-nav" aria-label="리포트 주차 이동">
          <button
            type="button"
            className="parent-report-page__week-nav-button"
            onClick={() => setSelectedWeekIndex((previous) => previous - 1)}
            disabled={isPrevDisabled}
            aria-label="이전 주차 보기"
          >
            <ChevronLeftIcon />
          </button>
          <p className="parent-report-page__week-nav-label">{currentWeek.label}</p>
          <button
            type="button"
            className="parent-report-page__week-nav-button"
            onClick={() => setSelectedWeekIndex((previous) => previous + 1)}
            disabled={isNextDisabled}
            aria-label="다음 주차 보기"
          >
            <ChevronRightIcon />
          </button>
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
          </div>

          <div className="parent-report-page__card">
            <div className="parent-report-page__week-placeholder">
              {reportWeekdays.map((weekday) => {
                const mood = currentWeek.moods.find((item) => item.weekday === weekday)

                return (
                  <EmotionChip
                    key={`${currentWeek.id}-${weekday}`}
                    mood={mood ?? { weekday, emoji: null, tone: null }}
                  />
                )
              })}
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
              {currentWeek.sleepScores.map((item) => {
                const tone = getBarTone(item.score)

                return (
                <div key={`${currentWeek.id}-${item.weekday}`} className="parent-report-page__bar-column">
                  <span
                    className={`parent-report-page__bar-score${
                      tone === 'warning' ? ' is-warning' : ''
                    }`}
                  >
                    {item.score}
                  </span>
                  <span
                    className={`parent-report-page__bar${
                      tone === 'warning' ? ' is-warning' : ''
                    }`}
                    style={{ height: `${Math.max(44, item.score * 1.8)}px` }}
                  />
                  <span className="parent-report-page__bar-day">{item.weekday}</span>
                </div>
              )})}
            </div>
            <div className="parent-report-page__insight-line">{currentWeek.sleepInsight}</div>
          </div>
        </section>

        <section className="parent-report-page__section" aria-labelledby="nervous-system-report">
          <div className="parent-report-page__section-header">
            <div className="parent-report-page__section-title-wrap">
              <span className="parent-report-page__section-icon parent-report-page__section-icon--orange">
                <StabilityIcon />
              </span>
              <h2 id="nervous-system-report" className="parent-report-page__section-title">
                자율신경 안정도
              </h2>
              <div className="parent-report-page__info-wrap">
                <button
                  type="button"
                  className="parent-report-page__info-button"
                  onClick={() => setIsInfoOpen((previous) => !previous)}
                  aria-label="자율신경 안정도 안내"
                  aria-expanded={isInfoOpen}
                >
                  <InfoIcon />
                </button>
                {isInfoOpen ? (
                  <div className="parent-report-page__tooltip" role="dialog" aria-label="자율신경 안정도 안내">
                    <p className="parent-report-page__tooltip-copy">
                      일기에 나타난 감정 상태를 점수화해 보여줍니다. 높을수록 긍정적인 감정과
                      안정감이 높고, 낮을수록 긴장과 피로가 커졌다고 해석할 수 있어요.
                    </p>
                    <button
                      type="button"
                      className="parent-report-page__tooltip-close"
                      onClick={() => setIsInfoOpen(false)}
                    >
                      닫기
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="parent-report-page__card parent-report-page__card--line-chart">
            <div className="parent-report-page__line-chart-placeholder">
              <div className="parent-report-page__line-chart-grid" />
              <svg
                aria-hidden="true"
                className="parent-report-page__line-chart-plot"
                viewBox={`0 0 ${STABILITY_CHART_WIDTH} ${STABILITY_CHART_HEIGHT}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={stabilityChart.path}
                  stroke="#F4B895"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {stabilityChart.points.map((point) => (
                  <circle
                    key={`${currentWeek.id}-${point.weekday}`}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#F4B895"
                    stroke="white"
                    strokeWidth="3"
                  />
                ))}
              </svg>
              <div className="parent-report-page__line-chart-labels">
                {currentWeek.stabilityScores.map((point) => (
                  <span key={`${currentWeek.id}-${point.weekday}`}>{point.weekday}</span>
                ))}
              </div>
            </div>
            <div className="parent-report-page__insight-line">{currentWeek.stabilityInsight}</div>
          </div>
        </section>
      </div>
    </MobilePageLayout>
  )
}

export default ParentReportPage
