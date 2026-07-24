import { create } from 'zustand'

export type SettingsTab = 'company' | 'charges' | 'backup' | 'audit'

type SettingsUiState = {
  tab: SettingsTab
  chargeDialogOpen: boolean
  editingChargeId: number | null
  setTab: (tab: SettingsTab) => void
  openChargeCreate: () => void
  openChargeEdit: (id: number) => void
  closeChargeDialog: () => void
}

export const useSettingsStore = create<SettingsUiState>((set) => ({
  tab: 'company',
  chargeDialogOpen: false,
  editingChargeId: null,
  setTab: (tab) => set({ tab }),
  openChargeCreate: () => set({ chargeDialogOpen: true, editingChargeId: null }),
  openChargeEdit: (id) => set({ chargeDialogOpen: true, editingChargeId: id }),
  closeChargeDialog: () => set({ chargeDialogOpen: false, editingChargeId: null })
}))
