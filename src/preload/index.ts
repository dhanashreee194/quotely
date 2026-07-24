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
  },
  quotationTemplates: {
    list: () => ipcRenderer.invoke(IpcChannels.quotationTemplatesList),
    get: (id) => ipcRenderer.invoke(IpcChannels.quotationTemplatesGet, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.quotationTemplatesCreate, data),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.quotationTemplatesUpdate, id, data),
    remove: (id) => ipcRenderer.invoke(IpcChannels.quotationTemplatesRemove, id),
    setDefault: (id) => ipcRenderer.invoke(IpcChannels.quotationTemplatesSetDefault, id),
    sections: {
      create: (data) => ipcRenderer.invoke(IpcChannels.templateSectionsCreate, data),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.templateSectionsUpdate, id, data),
      remove: (id) => ipcRenderer.invoke(IpcChannels.templateSectionsRemove, id),
      reorder: (id, direction) =>
        ipcRenderer.invoke(IpcChannels.templateSectionsReorder, id, direction)
    },
    fields: {
      create: (data) => ipcRenderer.invoke(IpcChannels.customFieldsCreate, data),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.customFieldsUpdate, id, data),
      remove: (id) => ipcRenderer.invoke(IpcChannels.customFieldsRemove, id),
      reorder: (id, direction) => ipcRenderer.invoke(IpcChannels.customFieldsReorder, id, direction)
    },
    itemColumns: {
      create: (data) => ipcRenderer.invoke(IpcChannels.itemColumnsCreate, data),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.itemColumnsUpdate, id, data),
      remove: (id) => ipcRenderer.invoke(IpcChannels.itemColumnsRemove, id),
      reorder: (id, direction) => ipcRenderer.invoke(IpcChannels.itemColumnsReorder, id, direction)
    }
  },
  quotations: {
    list: (search) => ipcRenderer.invoke(IpcChannels.quotationsList, search),
    get: (id) => ipcRenderer.invoke(IpcChannels.quotationsGet, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.quotationsCreate, data),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.quotationsUpdate, id, data),
    remove: (id) => ipcRenderer.invoke(IpcChannels.quotationsRemove, id),
    finalize: (id) => ipcRenderer.invoke(IpcChannels.quotationsFinalize, id),
    setStatus: (id, status) => ipcRenderer.invoke(IpcChannels.quotationsSetStatus, id, status),
    duplicate: (id) => ipcRenderer.invoke(IpcChannels.quotationsDuplicate, id),
    revise: (id) => ipcRenderer.invoke(IpcChannels.quotationsRevise, id)
  },
  numbering: {
    get: () => ipcRenderer.invoke(IpcChannels.numberingGet),
    update: (patch) => ipcRenderer.invoke(IpcChannels.numberingUpdate, patch),
    peekNext: () => ipcRenderer.invoke(IpcChannels.numberingPeek)
  },
  documents: {
    getModel: (quotationId) => ipcRenderer.invoke(IpcChannels.documentsGetModel, quotationId),
    exportPdf: (quotationId) => ipcRenderer.invoke(IpcChannels.documentsExportPdf, quotationId),
    print: (quotationId) => ipcRenderer.invoke(IpcChannels.documentsPrint, quotationId),
    notifyReady: () => {
      ipcRenderer.send(IpcChannels.documentsReady)
    }
  },
  backup: {
    create: () => ipcRenderer.invoke(IpcChannels.backupCreate),
    pick: () => ipcRenderer.invoke(IpcChannels.backupPick),
    restore: (zipPath) => ipcRenderer.invoke(IpcChannels.backupRestore, zipPath)
  },
  audit: {
    list: (filters) => ipcRenderer.invoke(IpcChannels.auditList, filters),
    actions: () => ipcRenderer.invoke(IpcChannels.auditActions)
  },
  export: {
    csv: (kind) => ipcRenderer.invoke(IpcChannels.exportCsv, kind)
  },
  dashboard: {
    getSummary: () => ipcRenderer.invoke(IpcChannels.dashboardGetSummary)
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
