import { useEffect, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { PARENT_OBSERVATION_PREVIEW_LIMIT } from '../constants/parentObservation'
import {
  getParentObservationPreview,
  mapObservationListItemToRecord,
  sortObservationRecords,
} from '../api/parentObservationApi'
import { parentObservationListMock } from '../mocks/parentObservationList'
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
  const [records, setRecords] = useState<ParentObservationPreviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPreview() {
      try {
        setIsLoading(true)
        setIsError(false)

        if (isMockMode) {
          if (!isMounted) {
            return
          }

          setRecords(
            sortObservationRecords(
              parentObservationListMock.map(mapObservationListItemToRecord),
            ).slice(0, PARENT_OBSERVATION_PREVIEW_LIMIT),
          )
          return
        }

        const response = await getParentObservationPreview({
          accessToken,
          childrenId,
          limit: PARENT_OBSERVATION_PREVIEW_LIMIT,
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
  }, [accessToken, childrenId, isMockMode])

  return {
    records,
    isLoading,
    isError,
  }
}
