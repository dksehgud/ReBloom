import { useEffect, useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { getParentObservationList } from '../api/parentObservationApi'
import type { ParentObservationRecord } from '../types/parentObservation'

type UseParentObservationListResult = {
  currentYear: number
  currentMonth: number
  records: ParentObservationRecord[]
  markedDays: number[]
  isLoading: boolean
  isError: boolean
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

export function useParentObservationList(
  childrenId?: string,
): UseParentObservationListResult {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(4)
  const [records, setRecords] = useState<ParentObservationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadRecords() {
      try {
        setIsLoading(true)
        setIsError(false)

        const response = await getParentObservationList({
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
  }, [accessToken, childrenId, currentMonth, currentYear])

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
    setCurrentYear(nextMonth.year)
    setCurrentMonth(nextMonth.month)
  }

  return {
    currentYear,
    currentMonth,
    records,
    markedDays,
    isLoading,
    isError,
    handlePreviousMonth,
    handleNextMonth,
  }
}
