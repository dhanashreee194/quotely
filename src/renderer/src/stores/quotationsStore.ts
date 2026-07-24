import { create } from 'zustand'

type QuotationsUiState = {
  search: string
  setSearch: (search: string) => void
}

export const useQuotationsStore = create<QuotationsUiState>((set) => ({
  search: '',
  setSearch: (search) => set({ search })
}))
