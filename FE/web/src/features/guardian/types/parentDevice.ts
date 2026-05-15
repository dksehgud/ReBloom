export type ParentDeviceType = 'WATCH' | 'IOT'

export type ParentDeviceRegisterRequestDto = {
  deviceType: ParentDeviceType
  serialNumber: string
}

export type ParentDeviceResponseDto = {
  childrenId?: string | null
  deviceId: number
  deviceType: ParentDeviceType
  serialNumber: string
}

export type ParentDeviceBaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

export type ParentDeviceListResponseDto = {
  contents?: ParentDeviceResponseDto[] | null
  count?: number | null
}

export type ParentDeviceRequestParams = {
  accessToken?: string | null
  childrenId: string
}

export type ParentDeviceRegisterParams = ParentDeviceRequestParams & {
  payload: ParentDeviceRegisterRequestDto
}

export type ParentDeviceTypeParams = ParentDeviceRequestParams & {
  deviceType: ParentDeviceType
}

export type ParentDeviceDeleteParams = ParentDeviceRequestParams & {
  serialNumber: string
}
