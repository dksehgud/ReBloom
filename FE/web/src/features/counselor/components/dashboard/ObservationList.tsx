import { FiMessageSquare } from 'react-icons/fi'

import type { ObservationComment, ObservationRecord } from '../../types/dashboard'
import MetricTag from './MetricTag'

type ObservationListProps = {
  records: ObservationRecord[]
  comments: Record<string, ObservationComment | null>
  onSelect: (record: ObservationRecord) => void
}

function ObservationList({ records, comments, onSelect }: ObservationListProps) {
  return (
    <div className="counselor-observation-list">
      {records.length === 0 ? (
        <p className="counselor-observation-empty">선택한 주차의 관찰 기록이 없습니다.</p>
      ) : null}
      {records.map((record) => (
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
            {comments[record.reportId] ? (
              <span className="counselor-comment-link">
                <FiMessageSquare aria-hidden="true" />
                상담사 코멘트 1개
              </span>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  )
}

export default ObservationList
