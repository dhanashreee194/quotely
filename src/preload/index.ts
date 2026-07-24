import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { QuotelyApi } from '../shared/api'
import { IpcChannels } from '../shared/ipc'

const api: QuotelyApi = {
  settings: {
    get: (key) => ipcRenderer.invoke(IpcChannels.settingsGet, key),
    set: (key, value) => ipcRenderer.invoke(IpcChannels.settingsSet, key, value)
  },
  company: {
    get: () => ipcRenderer.invoke(IpcChannels.companyGet),
    upsert: (data) => ipcRenderer.invoke(IpcChannels.companyUpsert, data)
  },
  customers: {
    list: (search) => ipcRenderer.invoke(IpcChannels.customersList, search),
    get: (id) => ipcRenderer.invoke(IpcChannels.customersGet, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.customersCreate, data),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.customersUpdate, id, data),
    remove: (id) => ipcRenderer.invoke(IpcChannels.customersRemove, id)
  },
  products: {
    list: (search) => ipcRenderer.invoke(IpcChannels.productsList, search),
    get: (id) => ipcRenderer.invoke(IpcChannels.productsGet, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.productsCreate, data),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.productsUpdate, id, data),
    remove: (id) => ipcRenderer.invoke(IpcChannels.productsRemove, id)
  },
  termsTemplates: {
    list: () => ipcRenderer.invoke(IpcChannels.termsList),
    create: (data) => ipcRenderer.invoke(IpcChannels.termsCreate, data),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.termsUpdate, id, data),
    remove: (id) => ipcRenderer.invoke(IpcChannels.termsRemove, id),
    reorder: (id, direction) => ipcRenderer.invoke(IpcChannels.termsReorder, id, direction)
  },
  chargeRules: {
    list: () => ipcRenderer.invoke(IpcChannels.chargeRulesList),
    create: (data) => ipcRenderer.invoke(IpcChannels.chargeRulesCreate, data),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.chargeRulesUpdate, id, data),
    remove: (id) => ipcRenderer.invoke(IpcChannels.chargeRulesRemove, id)
  },
  assets: {
    pickImage: (kind) => ipcRenderer.invoke(IpcChannels.assetsPickImage, kind),
    getDataUrl: (relativePath) => ipcRenderer.invoke(IpcChannels.assetsGetDataUrl, relativePath)
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
