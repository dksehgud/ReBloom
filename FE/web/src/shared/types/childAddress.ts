export type ChildAddress = {
  baseAddress: string
  detailAddress: string
}

export function formatChildAddress(address: ChildAddress) {
  return [address.baseAddress.trim(), address.detailAddress.trim()]
    .filter(Boolean)
    .join(' ')
}
