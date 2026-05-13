const DAYS_PER_WEEK = 7
const THURSDAY_DAY_INDEX = 4

type WeekRangeBaseDateStrategy = 'start' | 'end'

type WeekRangeOptions = {
  baseDateStrategy?: WeekRangeBaseDateStrategy
  clampEndDateToToday?: boolean
  today?: Date
}

type WeekRange = {
  baseDate: string
  endDate: string
  id: string
  label: string
  startDate: string
}

function formatDateParam(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)

  return nextDate
}

function getMondayOfWeek(date: Date) {
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)

  const dayOfWeek = monday.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + mondayOffset)

  return monday
}

function getWeekLabelByEndDate(endDate: Date) {
  const thursday = addDays(getMondayOfWeek(endDate), THURSDAY_DAY_INDEX - 1)
  const firstDayOfLabelMonth = new Date(
    thursday.getFullYear(),
    thursday.getMonth(),
    1,
  )
  const daysUntilFirstThursday =
    (THURSDAY_DAY_INDEX - firstDayOfLabelMonth.getDay() + DAYS_PER_WEEK) %
    DAYS_PER_WEEK
  const firstThursday = addDays(firstDayOfLabelMonth, daysUntilFirstThursday)
  const weekOfMonth =
    Math.floor(
      (thursday.getTime() - firstThursday.getTime()) /
        (DAYS_PER_WEEK * 24 * 60 * 60 * 1000),
    ) + 1

  return `${thursday.getFullYear()}년 ${thursday.getMonth() + 1}월 ${weekOfMonth}주차`
}

function getWeekRangeByOffset(
  weekOffset: number,
  {
    baseDateStrategy = 'start',
    clampEndDateToToday = false,
    today = new Date(),
  }: WeekRangeOptions = {},
): WeekRange {
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)

  const startOfWeek = addDays(
    getMondayOfWeek(todayStart),
    weekOffset * DAYS_PER_WEEK,
  )
  const naturalEndOfWeek = addDays(startOfWeek, DAYS_PER_WEEK - 1)
  const endOfWeek =
    clampEndDateToToday && naturalEndOfWeek.getTime() > todayStart.getTime()
      ? todayStart
      : naturalEndOfWeek
  const startDate = formatDateParam(startOfWeek)
  const endDate = formatDateParam(endOfWeek)
  const baseDate = baseDateStrategy === 'end' ? endDate : startDate

  return {
    baseDate,
    endDate,
    id: `${startDate}_${endDate}`,
    label: getWeekLabelByEndDate(naturalEndOfWeek),
    startDate,
  }
}

function getWeekRangeByIndex(
  selectedWeekIndex: number,
  currentWeekIndex: number,
  options?: WeekRangeOptions,
) {
  return getWeekRangeByOffset(selectedWeekIndex - currentWeekIndex, options)
}

export type { WeekRange, WeekRangeOptions }
export {
  DAYS_PER_WEEK,
  formatDateParam,
  getMondayOfWeek,
  getWeekLabelByEndDate,
  getWeekRangeByIndex,
  getWeekRangeByOffset,
}
