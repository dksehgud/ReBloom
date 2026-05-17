export type ParentNotificationActionTone = 'primary' | 'danger'

export type ParentNotificationAction = {
  key: 'confirm' | 'reject'
  label: string
  tone: ParentNotificationActionTone
}

export type ParentNotificationItem = {
  id: string
  childrenId?: string | null
  notificationType?: string
  tone: 'pink' | 'orange'
  icon: 'alert' | 'response'
  title: string
  timeLabel: string
  message: string
  unread: boolean
  highlightLabel?: string
  actions?: ParentNotificationAction[]
  selectedActionKey?: string
}

export const parentNotificationsMock: ParentNotificationItem[] = [
  {
    id: 'notification-attention-1',
    childrenId: 'mock-child-1',
    notificationType: 'RISK_ALERT',
    tone: 'pink',
    icon: 'alert',
    title: '주의 필요',
    timeLabel: '5시간 전',
    unread: true,
    message:
      '지민이가 AI 스피커와 이야기를 나눴습니다. 확인해보세요.',
    highlightLabel: '우울점수 : 68점',
    actions: [
      { key: 'reject', label: '불가', tone: 'danger' },
      { key: 'confirm', label: '확인', tone: 'primary' },
    ],
  },
  {
    id: 'notification-response-1',
    notificationType: 'CONVERSATION_ALERT',
    tone: 'orange',
    icon: 'response',
    title: '응답 요청',
    timeLabel: '1일 전',
    unread: true,
    message:
      '지금 한 번 지민이에게 관심을 표현해볼까요? 보호자님의 응답 여부를 선택해 주세요.',
  },
]
