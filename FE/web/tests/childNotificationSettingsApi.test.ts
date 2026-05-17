import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMock = vi.hoisted(() => ({
  API_BASE_URL: '/api',
  ApiError: class MockApiError extends Error {},
  apiRequest: vi.fn(),
}))

vi.mock('../src/shared/api/client', () => apiClientMock)

import {
  getChildDiaryNotificationSettings,
  mapChildNotificationSettingsResponse,
  mapDiaryNotificationSettingsToRequest,
  updateChildDiaryNotificationSettings,
} from '../src/features/notification/api/childNotificationSettingsApi'

const apiRequestMock = apiClientMock.apiRequest

beforeEach(() => {
  apiRequestMock.mockReset()
})

describe('child notification settings API', () => {
  it('loads diary notification settings and maps backend schedules to screen state', async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: {
        dailyFrequency: 2,
        isEnabled: true,
        quickSelect: 'WEEKDAYS',
        schedules: {
          contents: [
            { day: 'MONDAY', time: '09:00:00' },
            { day: 'TUESDAY', time: '09:00:00' },
            { day: 'MONDAY', time: '20:30:00' },
          ],
          count: 3,
        },
      },
    })

    await expect(getChildDiaryNotificationSettings('token')).resolves.toEqual({
      daysOfWeek: ['MON', 'TUE'],
      enabled: true,
      frequencyPerDay: 2,
      quickPreset: 'WEEKDAYS',
      times: ['09:00', '20:30'],
    })
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/notification/api/v1/notifications/settings',
      expect.objectContaining({ accessToken: 'token' }),
    )
  })

  it('saves diary notification settings with backend schedule day values', async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: {
        dailyFrequency: 2,
        isEnabled: true,
        quickSelect: 'CUSTOM',
        schedules: {
          contents: [
            { day: 'MONDAY', time: '09:00' },
            { day: 'WEDNESDAY', time: '20:30' },
          ],
          count: 2,
        },
      },
    })

    await expect(
      updateChildDiaryNotificationSettings(
        {
          daysOfWeek: ['MON', 'WED'],
          enabled: true,
          frequencyPerDay: 2,
          quickPreset: null,
          times: ['09:00', '20:30'],
        },
        'token',
      ),
    ).resolves.toMatchObject({
      daysOfWeek: ['MON', 'WED'],
      enabled: true,
      quickPreset: null,
      times: ['09:00', '20:30'],
    })
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/notification/api/v1/notifications/settings',
      expect.objectContaining({
        accessToken: 'token',
        body: {
          days: ['MONDAY', 'WEDNESDAY'],
          isEnabled: true,
          times: ['09:00', '20:30'],
        },
        method: 'PUT',
      }),
    )
  })

  it('falls back to everyday off-state when the settings response is empty', () => {
    expect(mapChildNotificationSettingsResponse(null)).toEqual({
      daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      enabled: false,
      frequencyPerDay: 1,
      quickPreset: null,
      times: [],
    })
  })

  it('filters empty times before sending update requests', () => {
    expect(
      mapDiaryNotificationSettingsToRequest({
        daysOfWeek: ['SAT', 'SUN'],
        enabled: false,
        frequencyPerDay: 3,
        quickPreset: 'WEEKENDS',
        times: ['08:00', '', '21:00'],
      }),
    ).toEqual({
      days: ['SATURDAY', 'SUNDAY'],
      isEnabled: false,
      times: ['08:00', '21:00'],
    })
  })
})
