export type ParentConnectedChildDto = {
  age?: number | null
  childrenId?: string | null
  connected: boolean
  email?: string | null
  name?: string | null
}

export type ParentConnectedChild = {
  age: number | null
  connected: boolean
  email: string | null
  id: string | null
  name: string | null
}

export type ParentConnectedChildResponseDto = {
  code?: string | null
  data?: ParentConnectedChildDto | null
  message?: string | null
}
