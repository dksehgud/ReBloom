import { useLocation } from 'react-router-dom'

const COUNSELOR_MOCK_QUERY_KEY = 'mock'
const COUNSELOR_MOCK_ENABLED_VALUES = new Set(['1', 'true', 'yes'])

export function isCounselorMockModeSearch(search: string) {
  const searchParams = new URLSearchParams(search)
  const mockValue = searchParams.get(COUNSELOR_MOCK_QUERY_KEY)

  return mockValue
    ? COUNSELOR_MOCK_ENABLED_VALUES.has(mockValue.toLowerCase())
    : false
}

export function getCounselorMockSearch(search: string) {
  return isCounselorMockModeSearch(search)
    ? `?${COUNSELOR_MOCK_QUERY_KEY}=1`
    : ''
}

export function useCounselorMockMode() {
  const location = useLocation()

  return isCounselorMockModeSearch(location.search)
}
