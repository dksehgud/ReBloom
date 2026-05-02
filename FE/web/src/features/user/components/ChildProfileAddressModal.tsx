import { useState } from 'react'

import AuthInput from '../../../components/auth/AuthInput'
import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'

type ChildProfileAddressModalProps = {
  profileName: string
  address: string
  onClose: () => void
  onSave: (address: string) => void
}

type DaumPostcodeData = {
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

function loadDaumPostcodeScript() {
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

function ChildProfileAddressModal({
  profileName,
  address,
  onClose,
  onSave,
}: ChildProfileAddressModalProps) {
  const [draftAddress, setDraftAddress] = useState('')
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)

  const handleOpenPostcode = async () => {
    try {
      setIsLoadingScript(true)
      setScriptError(null)
      await loadDaumPostcodeScript()

      const postcode = new window.daum!.Postcode({
        oncomplete: (data) => {
          const nextAddress = data.roadAddress || data.address || data.jibunAddress
          setDraftAddress(nextAddress)
        },
      })

      postcode.open({ popupTitle: '주소 검색' })
    } catch {
      setScriptError('주소 검색 창을 여는 데 실패했어요. 다시 시도해주세요.')
    } finally {
      setIsLoadingScript(false)
    }
  }

  const nextAddress = draftAddress.trim()

  return (
    <CommonModalLayout
      className="child-profile-address-modal"
      bodyClassName="child-profile-address-modal__body"
      actionsClassName="child-profile-address-modal__actions"
      title="사용자 정보 수정"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="auth-button is-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={`auth-button ${nextAddress ? 'is-primary' : 'is-neutral'}`}
            disabled={!nextAddress}
            onClick={() => onSave(nextAddress)}
          >
            저장
          </button>
        </>
      }
    >
      <div className="child-profile-address-modal__content">
        <div className="child-profile-address-modal__summary-card">
          <div className="child-profile-address-modal__profile">
            <span className="child-profile-address-modal__label">이름</span>
            <span className="child-profile-address-modal__value">{profileName}</span>
          </div>

          <div className="child-profile-address-modal__field">
            <div className="field-label-row">
              <span className="field-label">현재 주소</span>
            </div>
            <div className="child-profile-address-modal__address-box">
              <p className="child-profile-address-modal__address-text">
                {address || '등록된 주소가 없습니다.'}
              </p>
            </div>
          </div>

          <div className="child-profile-address-modal__field child-profile-address-modal__field--change">
            <div className="field-label-row">
              <span className="field-label">주소 변경하기</span>
            </div>
            <AuthInput
              label=""
              readOnly
              id="child-profile-next-address"
              placeholder="주소 검색 버튼으로 새 주소를 찾아주세요."
              value={draftAddress}
              action={
                <button
                  type="button"
                  className={`field-input-action ${
                    isLoadingScript ? 'is-disabled' : 'is-active'
                  }`}
                  disabled={isLoadingScript}
                  onClick={handleOpenPostcode}
                >
                  {isLoadingScript ? '불러오는 중' : '주소 검색'}
                </button>
              }
              error={scriptError ?? undefined}
            />
            <p className="child-profile-address-modal__field-help">
              {scriptError
                ? scriptError
                : '검색한 새 주소가 이곳에 표시돼요.'}
            </p>
          </div>
        </div>
      </div>
    </CommonModalLayout>
  )
}

export default ChildProfileAddressModal
