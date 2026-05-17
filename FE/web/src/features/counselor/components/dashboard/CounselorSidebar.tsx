import { FiChevronLeft, FiMenu, FiSettings } from 'react-icons/fi'

import type { ChildListItem } from '../../types/dashboard'

type CounselorSidebarProps = {
  isCollapsed: boolean
  childItems: ChildListItem[]
  selectedChildId: string | null
  counselorName: string
  isLoadingChildren?: boolean
  childrenError?: string
  onToggle: () => void
  onSelectChild: (childId: string) => void
  onOpenSettings: () => void
}

function CounselorSidebar({
  isCollapsed,
  childItems,
  selectedChildId,
  counselorName,
  isLoadingChildren = false,
  childrenError,
  onToggle,
  onSelectChild,
  onOpenSettings,
}: CounselorSidebarProps) {
  return (
    <aside className="counselor-dashboard-sidebar">
      <header className="counselor-dashboard-brand">
        <div>
          <h1>RE:BLOOM</h1>
          <p>상담사 대시보드</p>
        </div>
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="counselor-sidebar-toggle"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <FiMenu aria-hidden="true" />
          ) : (
            <FiChevronLeft aria-hidden="true" />
          )}
        </button>
      </header>

      <nav className="counselor-child-list" aria-label="상담 아동 목록">
        {isLoadingChildren ? (
          <p className="counselor-child-list-state">
            상담 아동을 불러오는 중입니다.
          </p>
        ) : null}

        {!isLoadingChildren && childrenError ? (
          <p className="counselor-child-list-state is-error">{childrenError}</p>
        ) : null}

        {!isLoadingChildren && !childrenError && childItems.length === 0 ? (
          <p className="counselor-child-list-state">
            연결된 상담 아동이 없습니다.
          </p>
        ) : null}

        {!isLoadingChildren && !childrenError
          ? childItems.map((child) => (
              <button
                type="button"
                className={child.id === selectedChildId ? 'is-selected' : undefined}
                key={child.id}
                onClick={() => onSelectChild(child.id)}
              >
                <span className="counselor-child-avatar" aria-hidden="true">
                  {child.name.slice(0, 1)}
                </span>
                <span className="counselor-child-summary">
                  <span className="counselor-child-name">
                    <strong>{child.name}</strong>
                  </span>
                  <em>{child.meta}</em>
                </span>
                {child.hasUnreadParentObservation ? (
                  <span
                    className="counselor-child-unread-dot"
                    aria-label="새 부모 관찰기록 있음"
                  />
                ) : null}
                <small className="counselor-child-subtext">{child.subText}</small>
              </button>
            ))
          : null}
      </nav>

      <footer className="counselor-dashboard-sidebar-footer">
        <div className="counselor-dashboard-sidebar-profile">
          <strong>{counselorName} 상담사님</strong>
        </div>
        <button
          type="button"
          aria-label="설정 페이지로 이동"
          className="counselor-dashboard-sidebar-settings"
          onClick={onOpenSettings}
        >
          <FiSettings aria-hidden="true" />
        </button>
      </footer>
    </aside>
  )
}

export default CounselorSidebar
