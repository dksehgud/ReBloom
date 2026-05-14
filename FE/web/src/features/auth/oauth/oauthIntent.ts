type OAuthIntent = 'default' | 'counselor'

const OAUTH_INTENT_KEY = 'rebloom-oauth-intent'

function saveOAuthIntent(intent: OAuthIntent) {
  window.sessionStorage.setItem(OAUTH_INTENT_KEY, intent)
}

function consumeOAuthIntent(): OAuthIntent {
  const intent = window.sessionStorage.getItem(OAUTH_INTENT_KEY)
  window.sessionStorage.removeItem(OAUTH_INTENT_KEY)

  return intent === 'counselor' ? 'counselor' : 'default'
}

export type { OAuthIntent }
export { consumeOAuthIntent, saveOAuthIntent }
