import { useCallback, useEffect, useState } from 'react'

import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import {
  type SelectedChild,
  useSelectedChildStore,
} from '../../student/store/useSelectedChildStore'
import { getParentConnectedChild } from '../api/parentRelationApi'
import { parentConnectedChildMock } from '../mocks/parentRelation'
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
  const clearSelectedChild = useSelectedChildStore((state) => state.clearSelectedChild)
  const selectedChild = useSelectedChildStore((state) => state.selectedChild)
  const setSelectedChild = useSelectedChildStore((state) => state.setSelectedChild)
  const [connectedChild, setConnectedChild] = useState<ParentConnectedChild | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(accessToken || isMockMode))
  const [isError, setIsError] = useState(false)

  const loadConnectedChild = useCallback(async () => {
    if (isMockMode) {
      setConnectedChild(parentConnectedChildMock)
      setSelectedChild({
        age: parentConnectedChildMock.age,
        email: parentConnectedChildMock.email,
        id: parentConnectedChildMock.id ?? 'mock-child',
        name: parentConnectedChildMock.name ?? '자녀',
      })
      setIsError(false)
      setIsLoading(false)
      return
    }

    if (!accessToken) {
      setConnectedChild(null)
      setIsError(false)
      setIsLoading(false)
      clearSelectedChild()
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)

      const child = await getParentConnectedChild(accessToken)
      setConnectedChild(child)

      if (child.connected && child.id) {
        setSelectedChild({
          age: child.age,
          email: child.email,
          id: child.id,
          name: child.name ?? '자녀',
        })
        return
      }

      clearSelectedChild()
    } catch (error) {
      console.error(error)
      setConnectedChild(null)
      setIsError(true)
      clearSelectedChild()
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, clearSelectedChild, isMockMode, setSelectedChild])

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
