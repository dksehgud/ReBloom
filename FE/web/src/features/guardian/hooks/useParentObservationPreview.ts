import { useEffect, useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { getParentObservationApi } from '../services/parentObservationService'
import type { ParentObservationPreviewItem } from '../types/parentObservation'
import { useParentMockMode } from './useParentMockMode'

type UseParentObservationPreviewResult = {
  records: ParentObservationPreviewItem[]
  isLoading: boolean
  isError: boolean
}

export function useParentObservationPreview(
  childrenId?: string,
): UseParentObservationPreviewResult {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useParentMockMode()
  const parentObservationApi = useMemo(
    () => getParentObservationApi(isMockMode),
    [isMockMode],
  )
  const [records, setRecords] = useState<ParentObservationPreviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPreview() {
      try {
        setIsLoading(true)
        setIsError(false)

        const response = await parentObservationApi.getParentObservationPreview({
          accessToken,
          childrenId,
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

    loadPreview()

    return () => {
      isMounted = false
    }
  }, [accessToken, childrenId, parentObservationApi])

  return {
    records,
    isLoading,
    isError,
  }
}
