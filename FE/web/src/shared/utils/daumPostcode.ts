export type DaumPostcodeData = {
  address: string
  roadAddress: string
  jibunAddress: string
  zonecode: string
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void
      }) => {
        open: (options?: { popupTitle?: string }) => void
      }
    }
  }
}

const DAUM_POSTCODE_SCRIPT_SRC =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

export function loadDaumPostcodeScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not defined'))
  }

  if (window.daum?.Postcode) {
    return Promise.resolve()
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${DAUM_POSTCODE_SCRIPT_SRC}"]`,
  )

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('postcode script failed to load')),
        { once: true },
      )
    })
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = DAUM_POSTCODE_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('postcode script failed to load'))
    document.body.appendChild(script)
  })
}

export async function openDaumPostcodePopup(
  oncomplete: (data: DaumPostcodeData) => void,
  popupTitle = '주소 검색',
) {
  await loadDaumPostcodeScript()

  const postcode = new window.daum!.Postcode({
    oncomplete,
  })

  postcode.open({ popupTitle })
}
