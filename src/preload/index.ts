import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { QuotelyApi } from '../shared/api'
import { IpcChannels } from '../shared/ipc'

const api: QuotelyApi = {
  settings: {
    get: (key) => ipcRenderer.invoke(IpcChannels.settingsGet, key),
    set: (key, value) => ipcRenderer.invoke(IpcChannels.settingsSet, key, value)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error define in dts
  window.electron = electronAPI
  // @ts-expect-error define in dts
  window.api = api
}
