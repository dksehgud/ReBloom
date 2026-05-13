import { useLocation } from 'react-router-dom'

const PARENT_MOCK_QUERY_KEY = 'mock'
const PARENT_MOCK_ENABLED_VALUES = new Set(['1', 'true', 'yes'])

export function isParentMockModeSearch(search: string) {
  const searchParams = new URLSearchParams(search)
  const mockValue = searchParams.get(PARENT_MOCK_QUERY_KEY)

  return mockValue
    ? PARENT_MOCK_ENABLED_VALUES.has(mockValue.toLowerCase())
    : false
}

export function getParentMockSearch(search: string) {
  return isParentMockModeSearch(search) ? `?${PARENT_MOCK_QUERY_KEY}=1` : ''
}

export function useParentMockMode() {
  const location = useLocation()

  return isParentMockModeSearch(location.search)
}
