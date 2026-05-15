import {
  normalizeConnectedChild,
  normalizeConnectedCounselor,
} from '../services/parentRelationMapper'
import {
  parentConnectedChildDtoMock,
  parentConnectedCounselorDtoMock,
  parentCounselorProfilesMock,
} from '../mocks/parentRelation'
import type {
  ParentConnectedChild,
  ParentConnectedChildResponseDto,
  ParentConnectedCounselor,
  ParentConnectedCounselorDto,
  ParentConnectedCounselorResponseDto,
  ParentCounselorProfilesResponseDto,
  ParentCounselorRelationRequestDto,
  ParentCounselorRelationResponseDto,
  ParentCounselorProfileDto,
} from '../types/parentRelation'

async function getParentConnectedChild(): Promise<ParentConnectedChild> {
  const response: ParentConnectedChildResponseDto = {
    data: {
      ...parentConnectedChildDtoMock,
      childrenId: parentConnectedChildDtoMock.childrenId ?? 'mock-child-jimin',
      connected: true,
    },
    message: 'mock parent child relation loaded',
  }

  return normalizeConnectedChild(response.data)
}

async function getParentConnectedCounselor(): Promise<ParentConnectedCounselor> {
  const response: ParentConnectedCounselorResponseDto = {
    data: parentConnectedCounselorDtoMock,
    message: 'mock parent counselor relation loaded',
  }

  return normalizeConnectedCounselor(response.data)
}

async function searchParentCounselors(
  email: string,
): Promise<ParentCounselorProfileDto[]> {
  const normalizedEmail = email.trim().toLowerCase()
  const contents = parentCounselorProfilesMock.filter((profile) =>
    profile.email?.toLowerCase().includes(normalizedEmail),
  )
  const response: ParentCounselorProfilesResponseDto = {
    data: {
      contents,
      count: contents.length,
    },
    message: 'mock counselor profile search loaded',
  }

  return response.data?.contents ?? []
}

async function requestParentCounselorRelation(
  counselorEmail: string,
): Promise<ParentConnectedCounselor> {
  const request: ParentCounselorRelationRequestDto = {
    counselorEmail,
  }
  const matchedProfile =
    parentCounselorProfilesMock.find(
      (profile) =>
        profile.email?.toLowerCase() === request.counselorEmail.toLowerCase(),
    ) ?? parentCounselorProfilesMock[0]
  const response: ParentCounselorRelationResponseDto = {
    data: {
      counselorId: parentConnectedCounselorDtoMock.counselorId,
      relationStatus: 'PENDING',
    },
    message: 'mock counselor relation requested',
  }
  const connectedCounselor: ParentConnectedCounselorDto = {
    ...response.data,
    email: matchedProfile?.email ?? request.counselorEmail,
    name: matchedProfile?.name ?? parentConnectedCounselorDtoMock.name,
  }

  return normalizeConnectedCounselor(connectedCounselor)
}

async function deleteParentCounselorRelation(): Promise<void> {
  return undefined
}

const parentRelationMockApi = {
  deleteParentCounselorRelation,
  getParentConnectedCounselor,
  getParentConnectedChild,
  requestParentCounselorRelation,
  searchParentCounselors,
}

export {
  deleteParentCounselorRelation,
  getParentConnectedCounselor,
  getParentConnectedChild,
  parentRelationMockApi,
  requestParentCounselorRelation,
  searchParentCounselors,
}
