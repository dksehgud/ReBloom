import type {
  ParentConnectedChild,
  ParentConnectedChildDto,
  ParentConnectedCounselorDto,
  ParentCounselorProfileDto,
} from '../types/parentRelation'

export const parentConnectedChildDtoMock: ParentConnectedChildDto = {
  age: 13,
  childrenId: 'mock-child-jimin',
  connected: true,
  email: 'jimin.child@rebloom.dev',
  name: '지민',
}

export const parentConnectedChildMock: ParentConnectedChild = {
  age: parentConnectedChildDtoMock.age ?? null,
  connected: parentConnectedChildDtoMock.connected,
  email: parentConnectedChildDtoMock.email ?? null,
  id: parentConnectedChildDtoMock.childrenId ?? null,
  name: parentConnectedChildDtoMock.name ?? null,
}

export const parentConnectedCounselorDtoMock: ParentConnectedCounselorDto = {
  counselorId: 'mock-counselor-harin',
  email: 'counselor@rebloom.dev',
  hospitalName: '리블룸 마음센터',
  name: '한하린',
  relationStatus: 'ACTIVE',
}

export const parentCounselorProfilesMock: ParentCounselorProfileDto[] = [
  {
    email: parentConnectedCounselorDtoMock.email,
    hospitalName: '리블룸 마음센터',
    name: parentConnectedCounselorDtoMock.name,
    userRole: 'COUNSELOR',
  },
]
