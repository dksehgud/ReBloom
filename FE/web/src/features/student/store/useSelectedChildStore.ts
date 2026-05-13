import { create } from 'zustand'

export type SelectedChild = {
  age?: number | null
  email?: string | null
  id: string
  name: string
}

type SelectedChildState = {
  selectedChild: SelectedChild | null
  setSelectedChild: (child: SelectedChild) => void
  clearSelectedChild: () => void
}

export const useSelectedChildStore = create<SelectedChildState>((set) => ({
  selectedChild: null,
  setSelectedChild: (selectedChild) => set({ selectedChild }),
  clearSelectedChild: () => set({ selectedChild: null }),
}))
