type ChildDiaryNotificationTooltipProps = {
  message: string
}

function ChildDiaryNotificationTooltip({
  message,
}: ChildDiaryNotificationTooltipProps) {
  return (
    <div className="child-diary-notification-tooltip" role="note">
      {message}
    </div>
  )
}

export default ChildDiaryNotificationTooltip
