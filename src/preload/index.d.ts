import { ElectronAPI } from '@electron-toolkit/preload'
import type { QuotelyApi } from '../shared/api'

declare global {
  interface Window {
    electron: ElectronAPI
    api: QuotelyApi
  }
}

export {}
