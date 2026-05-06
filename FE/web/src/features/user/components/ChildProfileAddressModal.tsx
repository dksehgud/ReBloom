import { useState } from 'react'

import AuthInput from '../../../components/auth/AuthInput'
import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'
import {
  formatChildAddress,
  type ChildAddress,
} from '../../../shared/types/childAddress'
import { openDaumPostcodePopup } from '../../../shared/utils/daumPostcode'

type ChildProfileAddressModalProps = {
  profileName: string
  address: ChildAddress
  onClose: () => void
  onSave: (address: ChildAddress) => void
}

function ChildProfileAddressModal({
  profileName,
  address,
  onClose,
  onSave,
}: ChildProfileAddressModalProps) {
  const [draftAddress, setDraftAddress] = useState<ChildAddress>(address)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)

  const handleOpenPostcode = async () => {
    try {
      setIsLoadingScript(true)
      setScriptError(null)

      await openDaumPostcodePopup(
        (data) => {
          const nextAddress = data.roadAddress || data.address || data.jibunAddress
          setDraftAddress((prev) => ({
            ...prev,
            baseAddress: nextAddress,
          }))
        },
        '프로필 주소 검색',
      )
    } catch {
      setScriptError('주소 검색창을 여는 데 실패했어요. 기본 주소를 직접 입력해 주세요.')
    } finally {
      setIsLoadingScript(false)
    }
  }

  const currentAddress = formatChildAddress(address)
  const nextAddress = formatChildAddress(draftAddress)
  const isSaveDisabled =
    !draftAddress.baseAddress.trim() || !draftAddress.detailAddress.trim()

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
            disabled={isSaveDisabled}
            onClick={() => onSave(draftAddress)}
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
                {currentAddress || '등록된 주소가 없습니다.'}
              </p>
            </div>
          </div>

          <div className="child-profile-address-modal__field child-profile-address-modal__field--change">
            <div className="field-label-row child-profile-address-modal__section-label-row">
              <span className="field-label">주소 변경</span>
            </div>

            <AuthInput
              label="기본 주소"
              id="child-profile-next-base-address"
              placeholder="주소 검색"
              value={draftAddress.baseAddress}
              action={
                <button
                  type="button"
                  className={`field-input-action ${
                    isLoadingScript ? 'is-disabled' : 'is-active'
                  } child-profile-address-modal__change-button`}
                  disabled={isLoadingScript}
                  onClick={handleOpenPostcode}
                >
                  {isLoadingScript ? '불러오는 중' : '검색'}
                </button>
              }
              error={scriptError ?? undefined}
              help={
                !draftAddress.baseAddress && !scriptError
                  ? '기본 주소는 필수 입력 값이에요.'
                  : undefined
              }
              onChange={(event) =>
                setDraftAddress((prev) => ({
                  ...prev,
                  baseAddress: event.target.value,
                }))
              }
            />

            <AuthInput
              label="상세 주소"
              id="child-profile-next-detail-address"
              placeholder="상세 주소"
              value={draftAddress.detailAddress}
              help={!draftAddress.detailAddress ? '상세 주소는 필수 입력 값이에요.' : undefined}
              onChange={(event) =>
                setDraftAddress((prev) => ({
                  ...prev,
                  detailAddress: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>
    </CommonModalLayout>
  )
}

export default ChildProfileAddressModal
