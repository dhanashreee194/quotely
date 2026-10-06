import { create } from 'zustand'
import type { SessionUser } from '../../../shared/types'

type AuthState = {
  user: SessionUser | null
  /** True once the initial auth.current() check has completed. */
  checked: boolean
  setUser: (user: SessionUser | null) => void
  setChecked: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checked: false,
  setUser: (user) => set({ user }),
  setChecked: () => set({ checked: true })
}))
