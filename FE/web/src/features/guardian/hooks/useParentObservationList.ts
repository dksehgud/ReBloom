import { useEffect, useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { getParentObservationApi } from '../services/parentObservationService'
import type { ParentObservationRecord } from '../types/parentObservation'
import { useParentMockMode } from './useParentMockMode'

type UseParentObservationListResult = {
  currentYear: number
  currentMonth: number
  records: ParentObservationRecord[]
  markedDays: number[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  handlePreviousMonth: () => void
  handleNextMonth: () => void
}

function moveMonth(year: number, month: number, diff: number) {
  const nextDate = new Date(year, month - 1 + diff, 1)

  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth() + 1,
  }
}

function isAfterCurrentMonth(year: number, month: number) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  return year > currentYear || (year === currentYear && month > currentMonth)
}

export function useParentObservationList(
  childrenId?: string,
): UseParentObservationListResult {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useParentMockMode()
  const parentObservationApi = useMemo(
    () => getParentObservationApi(isMockMode),
    [isMockMode],
  )
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1)
  const [records, setRecords] = useState<ParentObservationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadRecords() {
      try {
        setIsLoading(true)
        setIsError(false)

        const response = await parentObservationApi.getParentObservationList({
          accessToken,
          childrenId,
          year: currentYear,
          month: currentMonth,
        })

        if (!isMounted) {
          return
        }

        setRecords(response.records)
      } catch (error) {
        if (!isMounted) {
          return
        }

        console.error(error)
        setIsError(true)
        setRecords([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRecords()

    return () => {
      isMounted = false
    }
  }, [
    accessToken,
    childrenId,
    currentMonth,
    currentYear,
    parentObservationApi,
    reloadKey,
  ])

  const markedDays = useMemo(
    () => Array.from(new Set(records.map((record) => record.day))).sort((a, b) => a - b),
    [records],
  )

  const handlePreviousMonth = () => {
    const nextMonth = moveMonth(currentYear, currentMonth, -1)
    setCurrentYear(nextMonth.year)
    setCurrentMonth(nextMonth.month)
  }

  const handleNextMonth = () => {
    const nextMonth = moveMonth(currentYear, currentMonth, 1)

    if (isAfterCurrentMonth(nextMonth.year, nextMonth.month)) {
      return
    }

    setCurrentYear(nextMonth.year)
    setCurrentMonth(nextMonth.month)
  }

  const refetch = () => {
    setReloadKey((previous) => previous + 1)
  }

  return {
    currentYear,
    currentMonth,
    records,
    markedDays,
    isLoading,
    isError,
    refetch,
    handlePreviousMonth,
    handleNextMonth,
  }
}
