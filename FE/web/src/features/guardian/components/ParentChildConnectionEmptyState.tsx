type ParentChildConnectionEmptyStateProps = {
  className?: string
}

function ParentChildConnectionEmptyState({
  className,
}: ParentChildConnectionEmptyStateProps) {
  return (
    <section
      className={`parent-child-empty-state${className ? ` ${className}` : ''}`}
      role="status"
      aria-label="아이 연결 안내"
    >
      <h2 className="parent-child-empty-state__title">
        아직 연결된 아이가 없습니다.
      </h2>
      <p className="parent-child-empty-state__description">
        아이 계정 회원가입 시 부모 정보를 입력하면
        <br />
        보호자 앱에서 아이의 감정 기록과 리포트를 확인할 수 있어요.
      </p>
      <p className="parent-child-empty-state__note">
        아이 연결 후 상담사 연결을 진행할 수 있습니다.
      </p>
    </section>
  )
}

export default ParentChildConnectionEmptyState
