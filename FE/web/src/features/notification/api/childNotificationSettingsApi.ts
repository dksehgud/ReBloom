import { apiRequest } from '../../../shared/api/client'
import {
  DIARY_NOTIFICATION_DAYS,
  DIARY_NOTIFICATION_FREQUENCIES,
  type DiaryNotificationDay,
  type DiaryNotificationQuickPreset,
  type DiaryNotificationSettings,
  type DiaryNotificationTime,
} from '../../user/types/diaryNotificationSettings'

type ChildNotificationBaseResponseDto<T> = {
  code?: string | null
  data?: T | null
  message?: string | null
}

type BackendScheduleDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

type BackendQuickSelect = 'EVERYDAY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM'

type NotificationScheduleResponseDto = {
  day?: BackendScheduleDay | null
  time?: string | null
}

type ChildDiaryNotificationSettingsResponseDto = {
  dailyFrequency?: number | null
  isEnabled?: boolean | null
  quickSelect?: BackendQuickSelect | null
  schedules?: {
    contents?: NotificationScheduleResponseDto[] | null
    count?: number | null
  } | null
}

type ChildDiaryNotificationSettingsRequestDto = {
  days: BackendScheduleDay[]
  isEnabled: boolean
  times: string[]
}

const NOTIFICATION_SETTINGS_PATH = '/notification/api/v1/notifications/settings'

const BACKEND_DAY_BY_FRONTEND_DAY: Record<DiaryNotificationDay, BackendScheduleDay> = {
  FRI: 'FRIDAY',
  MON: 'MONDAY',
  SAT: 'SATURDAY',
  SUN: 'SUNDAY',
  THU: 'THURSDAY',
  TUE: 'TUESDAY',
  WED: 'WEDNESDAY',
}

const FRONTEND_DAY_BY_BACKEND_DAY: Record<BackendScheduleDay, DiaryNotificationDay> = {
  FRIDAY: 'FRI',
  MONDAY: 'MON',
  SATURDAY: 'SAT',
  SUNDAY: 'SUN',
  THURSDAY: 'THU',
  TUESDAY: 'TUE',
  WEDNESDAY: 'WED',
}

function isBaseResponse<T>(
  body: ChildNotificationBaseResponseDto<T> | T,
): body is ChildNotificationBaseResponseDto<T> {
  return typeof body === 'object' && body !== null && 'data' in body
}

function unwrapBaseResponse<T>(
  body: ChildNotificationBaseResponseDto<T> | T | null,
): T | null {
  if (!body) {
    return null
  }

  if (isBaseResponse(body)) {
    return body.data ?? null
  }

  return body
}

function normalizeQuickPreset(
  quickSelect?: BackendQuickSelect | null,
): DiaryNotificationQuickPreset {
  if (!quickSelect || quickSelect === 'CUSTOM') {
    return null
  }

  return quickSelect
}

function normalizeTime(time?: string | null): DiaryNotificationTime | null {
  if (!time) {
    return null
  }

  const match = time.match(/^(\d{2}):(\d{2})(?::\d{2})?$/)

  if (!match) {
    return null
  }

  return `${match[1]}:${match[2]}` as DiaryNotificationTime
}

function normalizeFrequency(
  dailyFrequency: number | null | undefined,
  timesCount: number,
): DiaryNotificationSettings['frequencyPerDay'] {
  if (
    DIARY_NOTIFICATION_FREQUENCIES.some((frequency) => frequency === dailyFrequency)
  ) {
    return dailyFrequency as DiaryNotificationSettings['frequencyPerDay']
  }

  if (DIARY_NOTIFICATION_FREQUENCIES.some((frequency) => frequency === timesCount)) {
    return timesCount as DiaryNotificationSettings['frequencyPerDay']
  }

  return 1
}

function mapChildNotificationSettingsResponse(
  response: ChildDiaryNotificationSettingsResponseDto | null,
): DiaryNotificationSettings {
  const schedules = response?.schedules?.contents ?? []
  const orderedScheduleDays = new Set<DiaryNotificationDay>()
  const scheduleTimes = new Set<DiaryNotificationTime>()

  schedules.forEach((schedule) => {
    if (schedule.day) {
      orderedScheduleDays.add(FRONTEND_DAY_BY_BACKEND_DAY[schedule.day])
    }

    const normalizedTime = normalizeTime(schedule.time)

    if (normalizedTime) {
      scheduleTimes.add(normalizedTime)
    }
  })

  const daysOfWeek = DIARY_NOTIFICATION_DAYS.filter((day) =>
    orderedScheduleDays.has(day),
  )
  const times = Array.from(scheduleTimes)
  const frequencyPerDay = normalizeFrequency(response?.dailyFrequency, times.length)

  return {
    daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [...DIARY_NOTIFICATION_DAYS],
    enabled: response?.isEnabled ?? false,
    frequencyPerDay,
    quickPreset: normalizeQuickPreset(response?.quickSelect),
    times,
  }
}

function mapDiaryNotificationSettingsToRequest(
  settings: DiaryNotificationSettings,
): ChildDiaryNotificationSettingsRequestDto {
  return {
    days: settings.daysOfWeek.map((day) => BACKEND_DAY_BY_FRONTEND_DAY[day]),
    isEnabled: settings.enabled,
    times: settings.times.filter(Boolean),
  }
}

async function getChildDiaryNotificationSettings(
  accessToken?: string | null,
): Promise<DiaryNotificationSettings> {
  const body = await apiRequest<
    | ChildNotificationBaseResponseDto<ChildDiaryNotificationSettingsResponseDto>
    | ChildDiaryNotificationSettingsResponseDto
    | null
  >(NOTIFICATION_SETTINGS_PATH, {
    accessToken,
    errorMessage: '일기 알림 설정을 불러오지 못했습니다.',
  })

  return mapChildNotificationSettingsResponse(unwrapBaseResponse(body))
}

async function updateChildDiaryNotificationSettings(
  settings: DiaryNotificationSettings,
  accessToken?: string | null,
): Promise<DiaryNotificationSettings> {
  const body = await apiRequest<
    | ChildNotificationBaseResponseDto<ChildDiaryNotificationSettingsResponseDto>
    | ChildDiaryNotificationSettingsResponseDto
    | null
  >(NOTIFICATION_SETTINGS_PATH, {
    accessToken,
    body: mapDiaryNotificationSettingsToRequest(settings),
    errorMessage: '일기 알림 설정을 저장하지 못했습니다.',
    method: 'PUT',
  })

  return mapChildNotificationSettingsResponse(unwrapBaseResponse(body))
}

const childNotificationSettingsApi = {
  getChildDiaryNotificationSettings,
  updateChildDiaryNotificationSettings,
}

export {
  childNotificationSettingsApi,
  getChildDiaryNotificationSettings,
  mapChildNotificationSettingsResponse,
  mapDiaryNotificationSettingsToRequest,
  updateChildDiaryNotificationSettings,
}
export type {
  BackendQuickSelect,
  BackendScheduleDay,
  ChildDiaryNotificationSettingsRequestDto,
  ChildDiaryNotificationSettingsResponseDto,
}
