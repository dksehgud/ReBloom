import { FiMessageSquare } from 'react-icons/fi'

import type { ObservationComment, ObservationRecord } from '../../types/dashboard'
import MetricTag from './MetricTag'

type ObservationListProps = {
  comments: Record<string, ObservationComment | null | undefined>
  error?: string
  isLoading?: boolean
  records: ObservationRecord[]
  onSelect: (record: ObservationRecord) => void
}

function ObservationList({
  comments,
  error,
  isLoading = false,
  records,
  onSelect,
}: ObservationListProps) {
  return (
    <div className="counselor-observation-list">
      {isLoading ? (
        <p className="counselor-observation-empty">관찰 기록을 불러오는 중입니다.</p>
      ) : null}
      {!isLoading && error ? (
        <p className="counselor-observation-empty">{error}</p>
      ) : null}
      {!isLoading && !error && records.length === 0 ? (
        <p className="counselor-observation-empty">선택한 주차의 기록이 없습니다.</p>
      ) : null}
      {!isLoading && !error
        ? records.map((record) => (
            <button
              type="button"
              className="counselor-observation-card"
              key={record.id}
              onClick={() => onSelect(record)}
            >
              <div className="counselor-observation-date">
                <strong>{record.date}</strong>
                <span>{record.day}</span>
              </div>
              <div className="counselor-observation-content">
                <MetricTag tone="green">{record.mood}</MetricTag>
                <p>{record.text}</p>
                {comments[record.reportId] || record.hasComment ? (
                  <span className="counselor-comment-link">
                    <FiMessageSquare aria-hidden="true" />
                    상담사 코멘트 1개
                  </span>
                ) : null}
              </div>
            </button>
          ))
        : null}
    </div>
  )
}

export default ObservationList
