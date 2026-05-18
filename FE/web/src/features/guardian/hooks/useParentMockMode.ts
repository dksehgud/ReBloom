const PARENT_WEBVIEW_MODE = 'webview'

export function isParentMockModeSearch(search: string) {
  void search
  return false
}

export function getParentMockSearch(search: string) {
  const currentParams = new URLSearchParams(search)
  const nextParams = new URLSearchParams()
  const mode = currentParams.get('mode')

  if (mode === PARENT_WEBVIEW_MODE) {
    nextParams.set('mode', mode)
  }

  const nextSearch = nextParams.toString()

  return nextSearch ? `?${nextSearch}` : ''
}

export function useParentMockMode() {
  return false
}
