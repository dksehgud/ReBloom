export type ParentNotificationActionTone = 'primary' | 'danger'

export type ParentNotificationAction = {
  key: string
  label: string
  tone: ParentNotificationActionTone
}

export type ParentNotificationItem = {
  id: string
  tone: 'pink' | 'orange'
  title: string
  timeLabel: string
  message: string
  unread: boolean
  highlightLabel?: string
  actions?: ParentNotificationAction[]
  selectedActionKey?: string
}

export const parentNotifications: ParentNotificationItem[] = [
  {
    id: 'notification-attention-1',
    tone: 'pink',
    title: '주의 필요',
    timeLabel: '5시간 전',
    unread: true,
    message:
      '지민이가 조금 지쳐 있는 것 같아요. 수면 질이 평소보다 좋지 않고, 활동량이 저번 주에 비해 줄었어요.',
    highlightLabel: '우울점수 : 68점',
  },
  {
    id: 'notification-response-1',
    tone: 'orange',
    title: '응답 요청',
    timeLabel: '1일 전',
    unread: true,
    message:
      '상담사가 전달한 생활 리듬 점검 제안을 확인하고, 보호자님의 응답 여부를 선택해 주세요.',
    actions: [
      { key: 'decline', label: '불가', tone: 'danger' },
      { key: 'confirm', label: '확인', tone: 'primary' },
    ],
  },
]
