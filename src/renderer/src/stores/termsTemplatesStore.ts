import { create } from 'zustand'

type TermsTemplatesUiState = {
  dialogOpen: boolean
  editingId: number | null
  openCreate: () => void
  openEdit: (id: number) => void
  closeDialog: () => void
}

export const useTermsTemplatesStore = create<TermsTemplatesUiState>((set) => ({
  dialogOpen: false,
  editingId: null,
  openCreate: () => set({ dialogOpen: true, editingId: null }),
  openEdit: (id) => set({ dialogOpen: true, editingId: id }),
  closeDialog: () => set({ dialogOpen: false, editingId: null })
}))
