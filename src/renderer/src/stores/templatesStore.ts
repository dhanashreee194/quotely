import { create } from 'zustand'

type TemplatesUiState = {
  dialogOpen: boolean
  editingId: number | null
  openCreate: () => void
  openEdit: (id: number) => void
  closeDialog: () => void
}

export const useTemplatesStore = create<TemplatesUiState>((set) => ({
  dialogOpen: false,
  editingId: null,
  openCreate: () => set({ dialogOpen: true, editingId: null }),
  openEdit: (id) => set({ dialogOpen: true, editingId: id }),
  closeDialog: () => set({ dialogOpen: false, editingId: null })
}))
