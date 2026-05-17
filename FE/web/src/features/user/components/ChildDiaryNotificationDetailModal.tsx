import { useEffect, useMemo, useState } from 'react'

import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'
import type {
  DiaryNotificationDay,
  DiaryNotificationSettings,
  DiaryNotificationTime,
} from '../types/diaryNotificationSettings'
import ChildDiaryNotificationTooltip from './ChildDiaryNotificationTooltip'

const DAY_OPTIONS = [
  { key: 'MON', label: '월' },
  { key: 'TUE', label: '화' },
  { key: 'WED', label: '수' },
  { key: 'THU', label: '목' },
  { key: 'FRI', label: '금' },
  { key: 'SAT', label: '토' },
  { key: 'SUN', label: '일' },
] as const

const FREQUENCY_OPTIONS = [1, 2, 3, 5] as const
const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50] as const
const WEEKDAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const
const WEEKEND_KEYS = ['SAT', 'SUN'] as const

type ChildDiaryNotificationDetailModalProps = {
  initialSettings: DiaryNotificationSettings
  onClose: () => void
  onSave: (settings: DiaryNotificationSettings) => void | Promise<void>
  errorMessage?: string
  isSaving?: boolean
}

type NotificationSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
}

function NotificationSwitch({ checked, onChange }: NotificationSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`child-diary-notification-switch ${
        checked ? 'is-checked' : ''
      }`}
      onClick={() => onChange(!checked)}
    >
      <span className="child-diary-notification-switch__thumb" />
    </button>
  )
}

function InfoIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 10V15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="7.25" fill="currentColor" r="1" />
    </svg>
  )
}

function formatHour(hour: number) {
  const period = hour >= 12 ? '오후' : '오전'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return `${period} ${displayHour}시`
}

function formatTimeValue(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` as DiaryNotificationTime
}

function parseTimeValue(time: DiaryNotificationTime) {
  const [hour, minute] = time.split(':').map(Number)

  return {
    hour,
    minute,
  }
}

function normalizeTimes(
  times: DiaryNotificationTime[],
  frequencyPerDay: (typeof FREQUENCY_OPTIONS)[number],
) {
  return Array.from({ length: frequencyPerDay }, (_, index) => {
    return times[index] ?? ''
  })
}

function getQuickSelection(daysOfWeek: DiaryNotificationDay[]) {
  const isEveryday = DAY_OPTIONS.every(({ key }) => daysOfWeek.includes(key))
  const isWeekdays =
    WEEKDAY_KEYS.every((day) => daysOfWeek.includes(day)) &&
    !daysOfWeek.includes('SAT') &&
    !daysOfWeek.includes('SUN')
  const isWeekend =
    daysOfWeek.length === 2 &&
    WEEKEND_KEYS.every((day) => daysOfWeek.includes(day))

  if (isEveryday) return 'EVERYDAY'
  if (isWeekdays) return 'WEEKDAYS'
  if (isWeekend) return 'WEEKENDS'
  return null
}

function ChildDiaryNotificationDetailModal({
  initialSettings,
  onClose,
  onSave,
  errorMessage,
  isSaving = false,
}: ChildDiaryNotificationDetailModalProps) {
  const [draft, setDraft] = useState<DiaryNotificationSettings>(() => ({
    ...initialSettings,
    quickPreset: initialSettings.quickPreset ?? getQuickSelection(initialSettings.daysOfWeek),
    times: normalizeTimes(
      initialSettings.times,
      initialSettings.frequencyPerDay,
    ),
  }))
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const quickSelection = useMemo(
    () => getQuickSelection(draft.daysOfWeek),
    [draft.daysOfWeek],
  )
  const hasEmptyTimes = draft.enabled && draft.times.some((time) => !time)
  const hasDuplicateTimes =
    draft.enabled &&
    new Set(draft.times.filter(Boolean)).size !== draft.times.filter(Boolean).length
  const saveDisabled = isSaving || hasEmptyTimes || hasDuplicateTimes
  const helperMessage = hasEmptyTimes
    ? '알림 시간을 모두 선택해주세요.'
    : hasDuplicateTimes
      ? '중복되지 않게 알림 시간을 설정해주세요.'
      : errorMessage ?? ''

  useEffect(() => {
    if (!isTooltipVisible) return undefined

    const timeoutId = window.setTimeout(() => {
      setIsTooltipVisible(false)
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [isTooltipVisible])

  const toggleDay = (day: DiaryNotificationDay) => {
    setDraft((prev) => {
      const exists = prev.daysOfWeek.includes(day)
      const nextDays = exists
        ? prev.daysOfWeek.filter((value) => value !== day)
        : [...prev.daysOfWeek, day]

      return {
        ...prev,
        daysOfWeek: DAY_OPTIONS.map(({ key }) => key).filter((key) =>
          nextDays.includes(key),
        ),
        quickPreset: getQuickSelection(nextDays),
      }
    })
  }

  const applyPreset = (preset: 'EVERYDAY' | 'WEEKDAYS' | 'WEEKENDS') => {
    if (preset === 'EVERYDAY') {
      setDraft((prev) => ({
        ...prev,
        daysOfWeek: DAY_OPTIONS.map(({ key }) => key),
        quickPreset: preset,
      }))
      return
    }

    if (preset === 'WEEKDAYS') {
      setDraft((prev) => ({
        ...prev,
        daysOfWeek: [...WEEKDAY_KEYS],
        quickPreset: preset,
      }))
      return
    }

    setDraft((prev) => ({
      ...prev,
      daysOfWeek: [...WEEKEND_KEYS],
      quickPreset: preset,
    }))
  }

  const updateFrequency = (frequencyPerDay: (typeof FREQUENCY_OPTIONS)[number]) => {
    setDraft((prev) => ({
      ...prev,
      frequencyPerDay,
      times: normalizeTimes(prev.times, frequencyPerDay),
    }))
  }

  const updateTime = (
    index: number,
    part: 'hour' | 'minute',
    value: number | '',
  ) => {
    setDraft((prev) => {
      const nextTimes = [...prev.times]
      const currentValue =
        nextTimes[index] ?? normalizeTimes(prev.times, prev.frequencyPerDay)[index]

      if (value === '') {
        nextTimes[index] = ''

        return {
          ...prev,
          times: nextTimes,
        }
      }

      const current = currentValue
        ? parseTimeValue(currentValue)
        : { hour: 20, minute: 0 }
      const next = {
        hour: part === 'hour' ? value : current.hour,
        minute: part === 'minute' ? value : current.minute,
      }

      nextTimes[index] = formatTimeValue(next.hour, next.minute)

      return {
        ...prev,
        times: nextTimes,
      }
    })
  }

  return (
    <CommonModalLayout
      className={`child-diary-notification-detail-modal ${
        draft.enabled ? '' : 'is-collapsed'
      }`}
      bodyClassName="child-diary-notification-detail-modal__body"
      actionsClassName="child-diary-notification-detail-modal__actions"
      title="일기 작성 알림"
      titleAddon={
        <span className="child-diary-notification-detail-modal__info-wrap">
          <button
            type="button"
            className="child-diary-notification-detail-modal__info-button"
            aria-label="알림 안내 보기"
            onClick={() => setIsTooltipVisible(true)}
          >
            <InfoIcon />
          </button>
        </span>
      }
      onClose={onClose}
      showDivider
      headerContent={
        isTooltipVisible ? (
          <div className="child-diary-notification-detail-modal__tooltip-row">
            <ChildDiaryNotificationTooltip message={'감정 체크 알림은 하루 동안 정기적으로\n지금의 감정을 기록하도록 도와줘요.'} />
          </div>
        ) : null
      }
      actions={
        <>
          <button
            type="button"
            className="auth-button is-secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="auth-button is-primary"
            disabled={saveDisabled}
            onClick={() => void onSave(draft)}
          >
            저장
          </button>
        </>
      }
    >
      <div className="child-diary-notification-detail-modal__switch-row">
        <span className="child-diary-notification-detail-modal__switch-label">
          알림 켜기
        </span>
        <NotificationSwitch
          checked={draft.enabled}
          onChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
        />
      </div>

      {draft.enabled ? (
        <div className="child-diary-notification-detail-modal__content">
          <section className="child-diary-notification-detail-modal__section">
            <h3 className="child-diary-notification-detail-modal__section-title">
              요일 선택
            </h3>
            <div className="child-diary-notification-detail-modal__day-grid">
              {DAY_OPTIONS.map(({ key, label }) => {
                const selected = draft.daysOfWeek.includes(key)

                return (
                  <button
                    key={key}
                    type="button"
                    className={`child-diary-notification-detail-modal__day-chip ${
                      selected ? 'is-selected' : ''
                    }`}
                    onClick={() => toggleDay(key)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="child-diary-notification-detail-modal__section">
            <h3 className="child-diary-notification-detail-modal__section-title">
              빠른 선택
            </h3>
            <div className="child-diary-notification-detail-modal__preset-row">
              <button
                type="button"
                className={`child-diary-notification-detail-modal__preset ${
                  quickSelection === 'EVERYDAY' ? 'is-selected' : ''
                }`}
                onClick={() => applyPreset('EVERYDAY')}
              >
                매일
              </button>
              <button
                type="button"
                className={`child-diary-notification-detail-modal__preset ${
                  quickSelection === 'WEEKDAYS' ? 'is-selected' : ''
                }`}
                onClick={() => applyPreset('WEEKDAYS')}
              >
                평일만
              </button>
              <button
                type="button"
                className={`child-diary-notification-detail-modal__preset ${
                  quickSelection === 'WEEKENDS' ? 'is-selected' : ''
                }`}
                onClick={() => applyPreset('WEEKENDS')}
              >
                주말만
              </button>
            </div>
          </section>

          <section className="child-diary-notification-detail-modal__section">
            <h3 className="child-diary-notification-detail-modal__section-title">
              알림 빈도
            </h3>
            <div className="child-diary-notification-detail-modal__frequency-grid">
              {FREQUENCY_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`child-diary-notification-detail-modal__frequency-option ${
                    draft.frequencyPerDay === value ? 'is-selected' : ''
                  }`}
                  onClick={() => updateFrequency(value)}
                >
                  하루 {value}번
                </button>
              ))}
            </div>
          </section>

          <section className="child-diary-notification-detail-modal__section">
            <h3 className="child-diary-notification-detail-modal__section-title">
              알림 시간
            </h3>
            <div className="child-diary-notification-detail-modal__time-list">
              {draft.times.map((time, index) => {
                const parsed = time ? parseTimeValue(time) : null

                return (
                  <div
                    key={`${index}-${time}`}
                    className="child-diary-notification-detail-modal__time-item"
                  >
                    <span className="child-diary-notification-detail-modal__time-label">
                      {index + 1}번째 알림
                    </span>
                    <div className="child-diary-notification-detail-modal__time-row">
                      <label className="child-diary-notification-detail-modal__select-wrap">
                        <span className="sr-only">시간 선택</span>
                        <select
                          value={parsed?.hour ?? ''}
                          onChange={(event) =>
                            updateTime(
                              index,
                              'hour',
                              event.target.value === '' ? '' : Number(event.target.value),
                            )
                          }
                        >
                          <option value="">시간 선택</option>
                          {Array.from({ length: 24 }, (_, hourOption) => (
                            <option key={hourOption} value={hourOption}>
                              {formatHour(hourOption)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="child-diary-notification-detail-modal__select-wrap">
                        <span className="sr-only">분 선택</span>
                        <select
                          value={parsed?.minute ?? ''}
                          onChange={(event) =>
                            updateTime(
                              index,
                              'minute',
                              event.target.value === '' ? '' : Number(event.target.value),
                            )
                          }
                        >
                          <option value="">분 선택</option>
                          {MINUTE_OPTIONS.map((minuteOption) => (
                            <option key={minuteOption} value={minuteOption}>
                              {String(minuteOption).padStart(2, '0')} 분
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
            {helperMessage ? (
              <p className="child-diary-notification-detail-modal__helper">
                {helperMessage}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </CommonModalLayout>
  )
}

export type { DiaryNotificationDay, DiaryNotificationSettings } from '../types/diaryNotificationSettings'

export default ChildDiaryNotificationDetailModal
