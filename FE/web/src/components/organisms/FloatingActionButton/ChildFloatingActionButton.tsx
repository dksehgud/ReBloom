type ChildFloatingActionButtonProps = {
  ariaLabel?: string
  onClick?: () => void
}

function ChildFloatingActionButton({
  ariaLabel = '일기 작성',
  onClick,
}: ChildFloatingActionButtonProps) {
  return (
    <button
      type="button"
      className="child-floating-action-button"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="24"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 19L8.6 18.2L18.1 8.7C18.9 7.9 18.9 6.6 18.1 5.8V5.8C17.3 5 16 5 15.2 5.8L5.7 15.3L5 19Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path d="M13.8 7.2L16.8 10.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  )
}

export default ChildFloatingActionButton
