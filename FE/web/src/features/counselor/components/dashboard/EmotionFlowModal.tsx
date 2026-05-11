import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

import {
  emotionFlowModeTabs,
  emotionFlowPeriods,
} from '../../mocks/dashboardMockData'
import type { EmotionFlowMode } from '../../types/dashboard'
import EmotionFlowLineChart from './charts/EmotionFlowLineChart'

type EmotionFlowModalProps = {
  onClose: () => void
}

function EmotionFlowModal({ onClose }: EmotionFlowModalProps) {
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

export default EmotionFlowModal
