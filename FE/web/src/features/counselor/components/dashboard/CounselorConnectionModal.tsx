import { FiBell, FiCheck, FiUserPlus, FiX } from 'react-icons/fi'

import type { CounselorConnectionRequest } from '../../types/dashboard'

type CounselorConnectionModalProps = {
  requests: CounselorConnectionRequest[]
  canRejectRequests?: boolean
  error?: string
  isLoading?: boolean
  onAccept: (request: CounselorConnectionRequest) => void | Promise<void>
  onReject: (requestId: string) => void
  onClose: () => void
}

function formatConnectionRequestedAt(requestedAt: string) {
  const date = new Date(requestedAt)

  if (Number.isNaN(date.getTime())) {
    return requestedAt
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function CounselorConnectionModal({
  requests,
  canRejectRequests = false,
  error,
  isLoading = false,
  onAccept,
  onReject,
  onClose,
}: CounselorConnectionModalProps) {
  return (
    <div className="counselor-connection-modal-overlay" role="presentation">
      <section
        aria-labelledby="counselor-connection-modal-title"
        aria-modal="true"
        className="counselor-connection-modal"
        role="dialog"
      >
        <header className="counselor-connection-modal-header">
          <div>
            <span className="counselor-connection-modal-kicker">
              <FiBell aria-hidden="true" /> 연결 신청
            </span>
            <h2 id="counselor-connection-modal-title">상담사 연결 요청</h2>
            <p>보호자가 보낸 상담 연결 신청을 확인하고 수락 또는 거절할 수 있어요.</p>
          </div>
          <button
            type="button"
            className="counselor-connection-modal-close"
            aria-label="연결 신청 알림 닫기"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="counselor-connection-modal-body">
          {isLoading ? (
            <p className="counselor-connection-empty">
              상담사 연결 신청을 불러오는 중입니다.
            </p>
          ) : null}

          {!isLoading && error ? (
            <p className="counselor-connection-empty is-error">{error}</p>
          ) : null}

          {!isLoading && !error && requests.length > 0 ? (
            requests.map((request) => (
              <article className="counselor-connection-card" key={request.id}>
                <div className="counselor-connection-card-icon" aria-hidden="true">
                  <FiUserPlus />
                </div>
                <div className="counselor-connection-card-copy">
                  <strong>
                    {request.parentName} 보호자가 {request.child.name} 아동의 상담사
                    연결을 신청했어요.
                  </strong>
                  <p>
                    {request.child.meta} · 보호자 : {request.parentName}
                  </p>
                  <small>
                    {request.parentEmail} · {formatConnectionRequestedAt(request.requestedAt)}
                  </small>
                </div>
                <div className="counselor-connection-card-actions">
                  {canRejectRequests ? (
                    <button
                      type="button"
                      className="is-secondary"
                      onClick={() => onReject(request.id)}
                    >
                      거절
                    </button>
                  ) : null}
                  <button type="button" onClick={() => onAccept(request)}>
                    <FiCheck aria-hidden="true" /> 수락
                  </button>
                </div>
              </article>
            ))
          ) : null}

          {!isLoading && !error && requests.length === 0 ? (
            <p className="counselor-connection-empty">
              확인할 상담사 연결 신청이 없습니다.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default CounselorConnectionModal
