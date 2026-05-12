export type Coordinates = {
  latitude: number
  longitude: number
}

type KakaoGeocoderResult = {
  x: string
  y: string
}

type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR'

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void
        services: {
          Geocoder: new () => {
            addressSearch: (
              address: string,
              callback: (result: KakaoGeocoderResult[], status: KakaoStatus) => void,
            ) => void
          }
          Status: {
            OK: KakaoStatus
          }
        }
      }
    }
  }
}

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk'

function getKakaoMapAppKey() {
  return import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim()
}

export function loadKakaoMapScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not defined'))
  }

  if (window.kakao?.maps?.services) {
    return Promise.resolve()
  }

  const appKey = getKakaoMapAppKey()
  if (!appKey) {
    return Promise.reject(new Error('Kakao Maps 앱 키가 설정되지 않았습니다.'))
  }

  const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null

  return new Promise<void>((resolve, reject) => {
    const handleLoad = () => {
      window.kakao?.maps.load(() => resolve())
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Kakao Maps SDK를 불러오지 못했습니다.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = KAKAO_MAP_SCRIPT_ID
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`
    script.async = true
    script.onload = handleLoad
    script.onerror = () => reject(new Error('Kakao Maps SDK를 불러오지 못했습니다.'))
    document.body.appendChild(script)
  })
}

export async function geocodeAddress(address: string): Promise<Coordinates> {
  const trimmedAddress = address.trim()

  if (!trimmedAddress) {
    throw new Error('주소를 입력해주세요.')
  }

  await loadKakaoMapScript()

  return new Promise<Coordinates>((resolve, reject) => {
    const geocoder = new window.kakao!.maps.services.Geocoder()

    geocoder.addressSearch(trimmedAddress, (result, status) => {
      if (status !== window.kakao!.maps.services.Status.OK || result.length === 0) {
        reject(new Error('주소의 위도/경도를 찾지 못했습니다.'))
        return
      }

      resolve({
        latitude: Number(result[0].y),
        longitude: Number(result[0].x),
      })
    })
  })
}
