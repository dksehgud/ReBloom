import type {
  ParentConnectedChild,
  ParentConnectedChildDto,
  ParentConnectedCounselor,
  ParentConnectedCounselorDto,
  ParentCounselorRelationDto,
} from '../types/parentRelation'

function normalizeConnectedChild(
  child?: ParentConnectedChildDto | null,
): ParentConnectedChild {
  if (!child?.connected || !child.childrenId) {
    return {
      age: null,
      connected: false,
      email: null,
      id: null,
      name: null,
    }
  }

  return {
    age: child.age ?? null,
    connected: true,
    email: child.email ?? null,
    id: child.childrenId,
    name: child.name?.trim() || null,
  }
}

function normalizeConnectedCounselor(
  counselor?: ParentConnectedCounselorDto | ParentCounselorRelationDto | null,
): ParentConnectedCounselor {
  if (!counselor?.counselorId) {
    return {
      connected: false,
      email: null,
      hospitalName: null,
      id: null,
      name: null,
      relationStatus: null,
    }
  }

  return {
    connected: true,
    email: 'email' in counselor ? (counselor.email ?? null) : null,
    hospitalName:
      'hospitalName' in counselor ? (counselor.hospitalName ?? null) : null,
    id: counselor.counselorId,
    name: 'name' in counselor ? (counselor.name ?? null) : null,
    relationStatus: counselor.relationStatus ?? null,
  }
}

export { normalizeConnectedChild, normalizeConnectedCounselor }
