type ParentNotificationPayloadDto = {
  childrenId?: string | null
  childrenName?: string | null
  childrenReportId?: string | null
  content?: string | null
  counselorId?: string | null
  counselorName?: string | null
  depressionScore?: number | null
  depressionScoreText?: string | null
  parentId?: string | null
  title?: string | null
}

type ParentNotificationDto = {
  createdAt: string
  deliveryStatus?: string | null
  id: number
  isRead: boolean
  notificationType: string
  payload?: ParentNotificationPayloadDto | null
}

type ParentNotificationSliceInfoDto = {
  first?: boolean
  hasNext?: boolean
  last?: boolean
  number?: number
  numberOfElements?: number
  size?: number
}

type ParentNotificationSortInfoDto = {
  empty?: boolean
  sorted?: boolean
  unsorted?: boolean
}

type ParentNotificationListDataDto = {
  contents?: ParentNotificationDto[]
  slice?: ParentNotificationSliceInfoDto
  sort?: ParentNotificationSortInfoDto | null
}

type ParentNotificationBaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

type ParentNotificationListRequest = {
  accessToken?: string | null
  isRead?: boolean
  page?: number
  size?: number
}

type ParentNotificationReadRequest = {
  accessToken?: string | null
  notificationId: number | string
}

export type {
  ParentNotificationBaseResponseDto,
  ParentNotificationDto,
  ParentNotificationListDataDto,
  ParentNotificationListRequest,
  ParentNotificationPayloadDto,
  ParentNotificationReadRequest,
}
