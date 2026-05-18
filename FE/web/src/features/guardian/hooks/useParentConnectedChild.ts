import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import {
  type SelectedChild,
  useSelectedChildStore,
} from '../../student/store/useSelectedChildStore'
import { getParentRelationApi } from '../services/parentRelationService'
import type { ParentConnectedChild } from '../types/parentRelation'
import { useParentMockMode } from './useParentMockMode'

type UseParentConnectedChildResult = {
  connectedChild: ParentConnectedChild | null
  isError: boolean
  isLoading: boolean
  refetch: () => Promise<void>
  selectedChild: SelectedChild | null
}

export function useParentConnectedChild(): UseParentConnectedChildResult {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const isMockMode = useParentMockMode()
  const parentRelationApi = useMemo(
    () => getParentRelationApi(isMockMode),
    [isMockMode],
  )
  const clearSelectedChild = useSelectedChildStore((state) => state.clearSelectedChild)
  const selectedChild = useSelectedChildStore((state) => state.selectedChild)
  const setSelectedChild = useSelectedChildStore((state) => state.setSelectedChild)
  const [connectedChild, setConnectedChild] = useState<ParentConnectedChild | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadConnectedChild = useCallback(async () => {
    if (!accessToken && !isMockMode) {
      setConnectedChild(null)
      setIsError(false)
      setIsLoading(false)
      clearSelectedChild()
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)

      const child = await parentRelationApi.getParentConnectedChild(accessToken)
      setConnectedChild(child)

      if (child.connected && child.id) {
        setSelectedChild({
          age: child.age,
          email: child.email,
          id: child.id,
          name: child.name?.trim() || '자녀',
        })
        return
      }

      clearSelectedChild()
    } catch {
      setConnectedChild(null)
      setIsError(true)
      clearSelectedChild()
    } finally {
      setIsLoading(false)
    }
  }, [
    accessToken,
    clearSelectedChild,
    isMockMode,
    parentRelationApi,
    setSelectedChild,
  ])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadConnectedChild()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadConnectedChild])

  return {
    connectedChild,
    isError,
    isLoading,
    refetch: loadConnectedChild,
    selectedChild,
  }
}
