import { create } from 'zustand'

type ProductsUiState = {
  search: string
  dialogOpen: boolean
  editingId: number | null
  setSearch: (search: string) => void
  openCreate: () => void
  openEdit: (id: number) => void
  closeDialog: () => void
}

export const useProductsStore = create<ProductsUiState>((set) => ({
  search: '',
  dialogOpen: false,
  editingId: null,
  setSearch: (search) => set({ search }),
  openCreate: () => set({ dialogOpen: true, editingId: null }),
  openEdit: (id) => set({ dialogOpen: true, editingId: id }),
  closeDialog: () => set({ dialogOpen: false, editingId: null })
}))
