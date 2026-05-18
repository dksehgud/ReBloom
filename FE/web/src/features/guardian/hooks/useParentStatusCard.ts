import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '../../../shared/api/client'
import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { getParentReportApi } from '../../report/services/parentReportService'
import type { ParentStatusCardDto } from '../../report/types/parentReport'
import { useParentMockMode } from './useParentMockMode'

type UseParentStatusCardResult = {
  errorMessage?: string
  isError: boolean
  isLoading: boolean
  refetch: () => Promise<void>
  statusCard: ParentStatusCardDto | null
}

function getStatusCardErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return '이 아이의 상태 카드를 조회할 권한이 없어요.'
    }

    if (error.status === 404) {
      return '연결된 아이 정보를 찾지 못했어요. 아이 연결 상태를 다시 확인해 주세요.'
    }

    if (error.status >= 500) {
      return '서버 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.'
    }
  }

  return '서버 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.'
}

export function useParentStatusCard(
  childrenId?: string | null,
): UseParentStatusCardResult {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useParentMockMode()
  const parentReportApi = useMemo(
    () => getParentReportApi(isMockMode),
    [isMockMode],
  )
  const [statusCard, setStatusCard] = useState<ParentStatusCardDto | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(childrenId))
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const loadStatusCard = useCallback(async () => {
    if (!childrenId) {
      setStatusCard(null)
      setIsError(false)
      setErrorMessage(undefined)
      setIsLoading(false)
      return
    }

    if (!accessToken && !isMockMode) {
      setStatusCard(null)
      setIsError(false)
      setErrorMessage(undefined)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)
      setErrorMessage(undefined)

      const nextStatusCard = await parentReportApi.getParentStatusCard({
        accessToken,
        childrenId,
      })

      setStatusCard(nextStatusCard)
    } catch (error) {
      setStatusCard(null)
      setIsError(true)
      setErrorMessage(getStatusCardErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, childrenId, isMockMode, parentReportApi])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStatusCard()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadStatusCard])

  return {
    errorMessage,
    isError,
    isLoading,
    refetch: loadStatusCard,
    statusCard,
  }
}
