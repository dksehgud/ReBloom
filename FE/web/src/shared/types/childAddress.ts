export type ChildAddress = {
  baseAddress: string
  detailAddress: string
  latitude?: number
  longitude?: number
}

export function formatChildAddress(address: ChildAddress) {
  return [address.baseAddress.trim(), address.detailAddress.trim()]
    .filter(Boolean)
    .join(' ')
}
