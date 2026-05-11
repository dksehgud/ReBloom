import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

import type { WeekNavigatorProps } from '../../types/dashboard'

function WeekNavigator({ label, isFirst, isLast, onPrev, onNext }: WeekNavigatorProps) {
  return (
    <div className="counselor-card-week">
      <button type="button" aria-label="이전 주" disabled={isFirst} onClick={onPrev}>
        <FiChevronLeft aria-hidden="true" />
      </button>
      <strong>{label}</strong>
      <button type="button" aria-label="다음 주" disabled={isLast} onClick={onNext}>
        <FiChevronRight aria-hidden="true" />
      </button>
    </div>
  )
}

export default WeekNavigator
