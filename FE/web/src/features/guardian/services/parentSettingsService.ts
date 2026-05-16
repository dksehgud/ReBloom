import type {
  ParentConnectedCounselor,
  ParentCounselorProfileDto,
} from '../types/parentRelation'
import type { ParentCounselorCandidate } from '../types/parentSettings'

function getCounselorStatusLabel(
  status: ParentCounselorCandidate['relationStatus'],
) {
  if (status === 'PENDING') return '요청중'
  if (status === 'ACTIVE') return '연결됨'

  return '연결됨'
}

function isCounselorProfile(profile: ParentCounselorProfileDto) {
  return profile.userRole?.toUpperCase() === 'COUNSELOR'
}

function toCounselorCandidateFromProfile(
  profile: ParentCounselorProfileDto,
  relation?: ParentConnectedCounselor | null,
): ParentCounselorCandidate {
  return {
    clinicName: profile.hospitalName?.trim() ?? '',
    email: relation?.email ?? profile.email ?? '',
    name: relation?.name ?? profile.name ?? '상담사',
    phoneNumber: '',
    relationStatus: relation?.relationStatus ?? null,
  }
}

function toCounselorCandidateFromRelation(
  counselor: ParentConnectedCounselor,
  fallback: ParentCounselorCandidate,
): ParentCounselorCandidate {
  return {
    clinicName: fallback.clinicName,
    email: counselor.email ?? fallback.email,
    name: counselor.name ?? fallback.name,
    phoneNumber: fallback.phoneNumber,
    relationStatus: counselor.relationStatus,
  }
}

function toCounselorCandidateFromConnectedCounselor(
  counselor: ParentConnectedCounselor,
): ParentCounselorCandidate | null {
  if (!counselor.connected) {
    return null
  }

  return {
    clinicName: counselor.hospitalName?.trim() ?? '',
    email: counselor.email ?? '',
    name: counselor.name ?? '상담사',
    phoneNumber: '',
    relationStatus: counselor.relationStatus,
  }
}

export {
  getCounselorStatusLabel,
  isCounselorProfile,
  toCounselorCandidateFromConnectedCounselor,
  toCounselorCandidateFromProfile,
  toCounselorCandidateFromRelation,
}
