import { useState } from 'react'

import AuthInput from '../../../components/auth/AuthInput'
import CommonModalLayout from '../../../components/organisms/Modal/CommonModalLayout'
import {
  formatChildAddress,
  type ChildAddress,
} from '../../../shared/types/childAddress'
import { openDaumPostcodePopup } from '../../../shared/utils/daumPostcode'
import { geocodeAddress } from '../../../shared/utils/kakaoGeocoder'

type ChildProfileAddressModalProps = {
  profileName: string
  address: ChildAddress
  onClose: () => void
  onSave: (address: ChildAddress) => void | Promise<void>
}

function ChildProfileAddressModal({
  profileName,
  address,
  onClose,
  onSave,
}: ChildProfileAddressModalProps) {
  const [draftAddress, setDraftAddress] = useState<ChildAddress>(address)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleOpenPostcode = async () => {
    try {
      setIsLoadingScript(true)
      setScriptError(null)

      await openDaumPostcodePopup(async (data) => {
        const nextAddress = data.roadAddress || data.address || data.jibunAddress

        try {
          const coords = await geocodeAddress(nextAddress)
          setDraftAddress((prev) => ({
            ...prev,
            baseAddress: nextAddress,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }))
        } catch (error) {
          setDraftAddress((prev) => ({
            ...prev,
            baseAddress: nextAddress,
            latitude: undefined,
            longitude: undefined,
          }))
          setScriptError(
            error instanceof Error ? error.message : '주소의 위도/경도를 찾지 못했습니다.',
          )
        }
      }, '프로필 주소 검색')
    } catch {
      setScriptError('주소 검색창을 여는 데 실패했어요. 기본 주소를 직접 입력해주세요.')
    } finally {
      setIsLoadingScript(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)

      const coords =
        draftAddress.latitude !== undefined && draftAddress.longitude !== undefined
          ? {
              latitude: draftAddress.latitude,
              longitude: draftAddress.longitude,
            }
          : await geocodeAddress(draftAddress.baseAddress)

      await onSave({
        ...draftAddress,
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : '주소를 저장하지 못했습니다.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const currentAddress = formatChildAddress(address)
  const nextAddress = formatChildAddress(draftAddress)
  const isSaveDisabled =
    isSaving || !draftAddress.baseAddress.trim() || !draftAddress.detailAddress.trim()

  return (
    <CommonModalLayout
      className="child-profile-address-modal"
      bodyClassName="child-profile-address-modal__body"
      actionsClassName="child-profile-address-modal__actions"
      title="프로필 상세"
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
            onClick={handleSave}
          >
            {isSaving ? '저장 중' : '저장'}
          </button>
        </>
      }
    >
      <div className="child-profile-address-modal__content">
        <div className="child-profile-address-modal__summary-card">
          <div className="child-profile-address-modal__profile">
            <span className="child-profile-address-modal__label">이름</span>
            <span className="child-profile-address-modal__value">
              {profileName || '이름 정보 없음'}
            </span>
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
              id="child-profile-next-base-address"
              label="기본 주소"
              onChange={(event) =>
                setDraftAddress((prev) => ({
                  ...prev,
                  baseAddress: event.target.value,
                  latitude: undefined,
                  longitude: undefined,
                }))
              }
              placeholder="주소 검색"
              value={draftAddress.baseAddress}
            />

            <AuthInput
              help={!draftAddress.detailAddress ? '상세 주소는 필수 입력 값이에요.' : undefined}
              id="child-profile-next-detail-address"
              label="상세 주소"
              onChange={(event) =>
                setDraftAddress((prev) => ({
                  ...prev,
                  detailAddress: event.target.value,
                }))
              }
              placeholder="상세 주소"
              value={draftAddress.detailAddress}
            />

            {saveError ? <p className="field-error">{saveError}</p> : null}
          </div>
        </div>
      </div>
    </CommonModalLayout>
  )
}

export default ChildProfileAddressModal
