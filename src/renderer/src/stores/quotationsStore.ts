import { create } from 'zustand'
import type { QuotationListFilters } from '../../../shared/dataManagement'
import type { QuotationStatus } from '../../../shared/types'

type QuotationsUiState = {
  search: string
  customerId: number | ''
  status: QuotationStatus | ''
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  setSearch: (search: string) => void
  setCustomerId: (customerId: number | '') => void
  setStatus: (status: QuotationStatus | '') => void
  setDateFrom: (dateFrom: string) => void
  setDateTo: (dateTo: string) => void
  setAmountMin: (amountMin: string) => void
  setAmountMax: (amountMax: string) => void
  resetFilters: () => void
  toFilters: () => QuotationListFilters
}

const empty = {
  search: '',
  customerId: '' as number | '',
  status: '' as QuotationStatus | '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: ''
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const useQuotationsStore = create<QuotationsUiState>((set, get) => ({
  ...empty,
  setSearch: (search) => set({ search }),
  setCustomerId: (customerId) => set({ customerId }),
  setStatus: (status) => set({ status }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setDateTo: (dateTo) => set({ dateTo }),
  setAmountMin: (amountMin) => set({ amountMin }),
  setAmountMax: (amountMax) => set({ amountMax }),
  resetFilters: () => set({ ...empty }),
  toFilters: () => {
    const state = get()
    return {
      search: state.search.trim() || undefined,
      customerId: state.customerId === '' ? null : state.customerId,
      status: state.status,
      dateFrom: state.dateFrom || undefined,
      dateTo: state.dateTo || undefined,
      amountMin: parseOptionalNumber(state.amountMin),
      amountMax: parseOptionalNumber(state.amountMax)
    }
  }
}))
