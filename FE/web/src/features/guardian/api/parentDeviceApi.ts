import { apiRequest } from '../../../shared/api/client'
import type {
  ParentDeviceBaseResponseDto,
  ParentDeviceDeleteParams,
  ParentDeviceListResponseDto,
  ParentDeviceRegisterParams,
  ParentDeviceRequestParams,
  ParentDeviceResponseDto,
  ParentDeviceTypeParams,
} from '../types/parentDevice'

const AUTH_API_PREFIX = '/auth/api/v1'

class ParentDeviceApiError extends Error {
  code?: string

  constructor(message: string, code?: string | null) {
    super(message)
    this.name = 'ParentDeviceApiError'
    this.code = code ?? undefined
  }
}

const parentDeviceApiPaths = {
  byType: ({ childrenId, deviceType }: Omit<ParentDeviceTypeParams, 'accessToken'>) =>
    `${AUTH_API_PREFIX}/parents/devices/${encodeURIComponent(
      childrenId,
    )}/type/${encodeURIComponent(deviceType)}`,
  deleteBySerial: ({
    childrenId,
    serialNumber,
  }: Omit<ParentDeviceDeleteParams, 'accessToken'>) =>
    `${AUTH_API_PREFIX}/parents/devices/${encodeURIComponent(
      childrenId,
    )}/serial/${encodeURIComponent(serialNumber)}`,
  list: ({ childrenId }: Omit<ParentDeviceRequestParams, 'accessToken'>) =>
    `${AUTH_API_PREFIX}/parents/devices/${encodeURIComponent(childrenId)}/`,
  register: ({ childrenId }: Omit<ParentDeviceRequestParams, 'accessToken'>) =>
    `${AUTH_API_PREFIX}/parents/devices/${encodeURIComponent(childrenId)}`,
}

function unwrapParentDeviceResponse<T>(
  response: ParentDeviceBaseResponseDto<T> | T | null,
  fallbackMessage: string,
): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const body = response as ParentDeviceBaseResponseDto<T>

    if (body.code) {
      throw new ParentDeviceApiError(body.message ?? fallbackMessage, body.code)
    }

    return (body.data ?? null) as T
  }

  return response as T
}

async function getParentDevices({
  accessToken,
  childrenId,
}: ParentDeviceRequestParams): Promise<ParentDeviceListResponseDto> {
  const fallbackMessage = '기기 목록을 불러오지 못했습니다.'
  const response = await apiRequest<
    | ParentDeviceBaseResponseDto<ParentDeviceListResponseDto>
    | ParentDeviceListResponseDto
    | null
  >(parentDeviceApiPaths.list({ childrenId }), {
    accessToken,
    errorMessage: fallbackMessage,
  })

  return (
    unwrapParentDeviceResponse(response, fallbackMessage) ?? {
      contents: [],
      count: 0,
    }
  )
}

async function registerParentDevice({
  accessToken,
  childrenId,
  payload,
}: ParentDeviceRegisterParams): Promise<ParentDeviceResponseDto> {
  const fallbackMessage = '기기 등록에 실패했습니다.'
  const response = await apiRequest<
    | ParentDeviceBaseResponseDto<ParentDeviceResponseDto>
    | ParentDeviceResponseDto
    | null
  >(parentDeviceApiPaths.register({ childrenId }), {
    accessToken,
    body: payload,
    errorMessage: fallbackMessage,
    method: 'POST',
  })

  return unwrapParentDeviceResponse(response, fallbackMessage)
}

async function getParentDeviceByType({
  accessToken,
  childrenId,
  deviceType,
}: ParentDeviceTypeParams): Promise<ParentDeviceResponseDto | null> {
  const fallbackMessage = '기기 정보를 불러오지 못했습니다.'
  const response = await apiRequest<
    | ParentDeviceBaseResponseDto<ParentDeviceResponseDto>
    | ParentDeviceResponseDto
    | null
  >(parentDeviceApiPaths.byType({ childrenId, deviceType }), {
    accessToken,
    errorMessage: fallbackMessage,
  })

  return unwrapParentDeviceResponse(response, fallbackMessage)
}

async function deleteParentDevice({
  accessToken,
  childrenId,
  serialNumber,
}: ParentDeviceDeleteParams): Promise<void> {
  const fallbackMessage = '기기 삭제에 실패했습니다.'
  const response = await apiRequest<ParentDeviceBaseResponseDto<void> | null>(
    parentDeviceApiPaths.deleteBySerial({ childrenId, serialNumber }),
    {
      accessToken,
      errorMessage: fallbackMessage,
      method: 'DELETE',
    },
  )

  unwrapParentDeviceResponse(response, fallbackMessage)
}

const parentDeviceApi = {
  deleteParentDevice,
  getParentDeviceByType,
  getParentDevices,
  registerParentDevice,
}

export type {
  ParentDeviceDeleteParams,
  ParentDeviceRegisterParams,
  ParentDeviceRequestParams,
  ParentDeviceTypeParams,
}

export {
  deleteParentDevice,
  getParentDeviceByType,
  getParentDevices,
  ParentDeviceApiError,
  parentDeviceApi,
  parentDeviceApiPaths,
  registerParentDevice,
}
