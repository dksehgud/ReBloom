import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { PasswordChangeRequest } from '../../auth/api/authApi'
import { useAppSessionStore } from '../../auth/store/useAppSessionStore'
import { useSelectedChildStore } from '../../student/store/useSelectedChildStore'
import { clearNativeAccessToken } from '../../../shared/utils/nativeTokenBridge'
import { getParentAccountApi } from '../services/parentAccountService'
import { getParentRelationApi } from '../services/parentRelationService'
import {
  isCounselorProfile,
  toCounselorCandidateFromConnectedCounselor,
  toCounselorCandidateFromProfile,
  toCounselorCandidateFromRelation,
} from '../services/parentSettingsService'
import type { ParentCounselorCandidate } from '../types/parentSettings'
import { useParentConnectedChild } from './useParentConnectedChild'
import { useParentMockMode } from './useParentMockMode'

function useParentSettingsScreen() {
  const accessToken = useAppSessionStore((state) => state.accessToken)
  const clearSession = useAppSessionStore((state) => state.clearSession)
  const currentUser = useAppSessionStore((state) => state.currentUser)
  const clearSelectedChild = useSelectedChildStore((state) => state.clearSelectedChild)
  const isMockMode = useParentMockMode()
  const parentAccountApi = useMemo(
    () => getParentAccountApi(isMockMode),
    [isMockMode],
  )
  const parentRelationApi = useMemo(
    () => getParentRelationApi(isMockMode),
    [isMockMode],
  )
  const navigate = useNavigate()
  const { selectedChild } = useParentConnectedChild()
  const [counselorLoadError, setCounselorLoadError] = useState('')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState(false)
  const [isCounselorLoading, setIsCounselorLoading] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [connectedCounselor, setConnectedCounselor] =
    useState<ParentCounselorCandidate | null>(null)

  const isCounselorConnected = connectedCounselor !== null
  const hasConnectedChild = Boolean(selectedChild?.id)
  const parentProfile = {
    email: currentUser?.email ?? '',
    name: currentUser?.name ?? '보호자',
  }
  const linkedChildName = selectedChild?.name ?? '아직 연결된 아이가 없습니다.'
  const linkedChildAgeLabel =
    typeof selectedChild?.age === 'number' ? `${selectedChild.age}세` : ''
  const linkedChildEmail = selectedChild?.email ?? ''
  const linkedChildId = selectedChild?.id ?? null

  useEffect(() => {
    let isCanceled = false

    const timeoutId = window.setTimeout(() => {
      if (!hasConnectedChild) {
        setConnectedCounselor(null)
        setCounselorLoadError('')
        setIsCounselorLoading(false)
        return
      }

      setIsCounselorLoading(true)
      setCounselorLoadError('')

      void parentRelationApi.getParentConnectedCounselor(accessToken)
        .then((counselor) => {
          if (isCanceled) return

          setConnectedCounselor(
            toCounselorCandidateFromConnectedCounselor(counselor),
          )
          setCounselorLoadError('')
        })
        .catch(() => {
          if (isCanceled) return

          setConnectedCounselor(null)
          setCounselorLoadError('상담사 연결 정보를 불러오지 못했습니다.')
        })
        .finally(() => {
          if (isCanceled) return

          setIsCounselorLoading(false)
        })
    }, 0)

    return () => {
      isCanceled = true
      window.clearTimeout(timeoutId)
    }
  }, [accessToken, hasConnectedChild, parentRelationApi])

  const handleVerifyCurrentPassword = useCallback(
    async (password: string) => {
      await parentAccountApi.verifyParentPassword(password, accessToken)
    },
    [accessToken, parentAccountApi],
  )

  const handleChangePassword = useCallback(
    async (payload: PasswordChangeRequest) => {
      await parentAccountApi.changeParentPassword(payload, accessToken)
    },
    [accessToken, parentAccountApi],
  )

  const handleLogout = useCallback(() => {
    clearSession()
    clearNativeAccessToken()
    clearSelectedChild()
    navigate('/login', { replace: true })
  }, [clearSelectedChild, clearSession, navigate])

  const handleSearchCounselor = useCallback(
    async (email: string) => {
      const counselors = await parentRelationApi.searchParentCounselors(
        email,
        accessToken,
      )
      const counselorProfiles = counselors.filter(isCounselorProfile)
      const matchedCounselor =
        counselorProfiles.find(
          (counselor) =>
            counselor.email?.toLowerCase() === email.trim().toLowerCase(),
        ) ?? counselorProfiles[0]

      if (!matchedCounselor) {
        return null
      }

      const relation = await parentRelationApi
        .getParentConnectedCounselor(accessToken)
        .catch(() => null)
      const matchedRelation =
        relation?.email?.toLowerCase() ===
        (matchedCounselor.email ?? email).toLowerCase()
          ? relation
          : null

      return toCounselorCandidateFromProfile(matchedCounselor, matchedRelation)
    },
    [accessToken, parentRelationApi],
  )

  const handleRequestCounselorRelation = useCallback(
    async (candidate: ParentCounselorCandidate) => {
      const counselor = await parentRelationApi.requestParentCounselorRelation(
        candidate.email,
        accessToken,
      )

      return toCounselorCandidateFromRelation(counselor, candidate)
    },
    [accessToken, parentRelationApi],
  )

  return {
    connectedCounselor,
    counselorLoadError,
    handleChangePassword,
    handleLogout,
    handleRequestCounselorRelation,
    handleSearchCounselor,
    handleVerifyCurrentPassword,
    hasConnectedChild,
    isCounselorConnected,
    isCounselorLoading,
    isCounselorModalOpen,
    isLogoutModalOpen,
    isPasswordModalOpen,
    linkedChildAgeLabel,
    linkedChildEmail,
    linkedChildId,
    linkedChildName,
    parentProfile,
    setConnectedCounselor,
    setIsCounselorModalOpen,
    setIsLogoutModalOpen,
    setIsPasswordModalOpen,
  }
}

export { useParentSettingsScreen }
