import { useEffect, useState, type FormEvent } from 'react'
import { FiMessageSquare, FiX } from 'react-icons/fi'

import type { ObservationComment, ObservationRecord } from '../../types/dashboard'
import { formatCommentCreatedAt } from '../../utils/dashboardTimeline'

type ObservationCommentModalProps = {
  comment: ObservationComment | null
  error?: string
  isCommentLoading?: boolean
  isSubmitting?: boolean
  record: ObservationRecord
  onClose: () => void
  onDelete: (reportId: string, commentId: string) => boolean | Promise<boolean>
  onSave: (record: ObservationRecord, context: string) => boolean | Promise<boolean>
}

function ObservationCommentModal({
  comment,
  error,
  isCommentLoading = false,
  isSubmitting = false,
  record,
  onClose,
  onDelete,
  onSave,
}: ObservationCommentModalProps) {
  const [draft, setDraft] = useState('')
  const trimmedDraft = draft.trim()

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!trimmedDraft || isSubmitting) {
      return
    }

    const didSave = await onSave(record, trimmedDraft)

    if (didSave) {
      setDraft('')
    }
  }

  const handleDelete = async (commentId: string) => {
    if (isSubmitting) {
      return
    }

    await onDelete(record.reportId, commentId)
  }

  return (
    <div className="counselor-observation-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="counselor-observation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="counselor-observation-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="counselor-observation-modal-header">
          <h2 id="counselor-observation-modal-title">
            {record.date} <span>{record.day}</span>
          </h2>
          <button
            type="button"
            className="counselor-observation-modal-close"
            aria-label="아이 관찰 기록 닫기"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="counselor-observation-modal-body">
          <span className="counselor-observation-modal-tag">{record.mood}</span>
          <div className="counselor-observation-modal-summary">{record.text}</div>

          <form className="counselor-observation-comment-panel" onSubmit={handleSubmit}>
            <div className="counselor-observation-comment-title">
              <FiMessageSquare aria-hidden="true" />
              <strong>상담사의 코멘트</strong>
            </div>

            {error ? (
              <p className="counselor-observation-comment-empty">{error}</p>
            ) : null}

            {isCommentLoading ? (
              <p className="counselor-observation-comment-empty">
                코멘트를 불러오는 중입니다.
              </p>
            ) : comment ? (
              <div className="counselor-observation-comment-item">
                <span className="counselor-observation-comment-dot" aria-hidden="true" />
                <div>
                  <div className="counselor-observation-comment-meta">
                    <span>{formatCommentCreatedAt(comment.createdAt)}</span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleDelete(comment.commentId)}
                    >
                      삭제
                    </button>
                  </div>
                  <p>{comment.context}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="counselor-observation-comment-empty">
                  아직 작성된 코멘트가 없습니다.
                </p>
                <div className="counselor-observation-comment-form">
                  <textarea
                    value={draft}
                    disabled={isSubmitting}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="코멘트를 입력하세요."
                    aria-label="상담사 코멘트"
                  />
                  <button type="submit" disabled={!trimmedDraft || isSubmitting}>
                    {isSubmitting ? '저장 중' : '코멘트 추가'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}

export default ObservationCommentModal
