import { useLocation } from 'react-router-dom'

const PARENT_MOCK_QUERY_KEY = 'mock'

function isEnabledMockValue(value: string | null) {
  const normalizedValue = value?.toLowerCase()

  return (
    normalizedValue === '1' ||
    normalizedValue === 'true' ||
    normalizedValue === 'yes'
  )
}

export function isParentMockModeSearch(search: string) {
  const searchParams = new URLSearchParams(search)

  return (
    isEnabledMockValue(searchParams.get(PARENT_MOCK_QUERY_KEY)) ||
    searchParams.get('mode') === PARENT_MOCK_QUERY_KEY
  )
}

export function getParentMockSearch(search: string) {
  const currentParams = new URLSearchParams(search)
  const nextParams = new URLSearchParams()
  const mode = currentParams.get('mode')

  if (isParentMockModeSearch(search)) {
    nextParams.set(PARENT_MOCK_QUERY_KEY, '1')
  }

  if (mode === 'webview') {
    nextParams.set('mode', mode)
  }

  const nextSearch = nextParams.toString()

  return nextSearch ? `?${nextSearch}` : ''
}

export function useParentMockMode() {
  const location = useLocation()

  return isParentMockModeSearch(location.search)
}
