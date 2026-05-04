type StatusMessageProps = {
  message: string
  variant?: 'help' | 'error' | 'success'
}

function StatusMessage({
  message,
  variant = 'help',
}: StatusMessageProps) {
  return (
    <p className={`status-message status-message--${variant}`}>{message}</p>
  )
}

export default StatusMessage
