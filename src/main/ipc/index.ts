import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/ipc'
import type {
  AssetKind,
  ChargeRuleInput,
  CompanyProfileInput,
  CustomerInput,
  ProductInput,
  ReorderDirection,
  TermsTemplateInput
} from '../../shared/types'
import { getAssetDataUrl, pickImage } from './assets'
import {
  createChargeRule,
  listChargeRules,
  removeChargeRule,
  updateChargeRule
} from './chargeRules'
import { getCompanyProfile, upsertCompanyProfile } from './company'
import {
  createCustomer,
  getCustomer,
  listCustomers,
  removeCustomer,
  updateCustomer
} from './customers'
import {
  createProduct,
  getProduct,
  listProducts,
  removeProduct,
  updateProduct
} from './products'
import { getSetting, setSetting } from './settings'
import {
  createTermsTemplate,
  listTermsTemplates,
  removeTermsTemplate,
  reorderTermsTemplate,
  updateTermsTemplate
} from './termsTemplates'

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.settingsGet, (_event, key: string) => getSetting(key))
  ipcMain.handle(IpcChannels.settingsSet, (_event, key: string, value: string) =>
    setSetting(key, value)
  )

  ipcMain.handle(IpcChannels.companyGet, () => getCompanyProfile())
  ipcMain.handle(IpcChannels.companyUpsert, (_event, data: CompanyProfileInput) =>
    upsertCompanyProfile(data)
  )

  ipcMain.handle(IpcChannels.customersList, (_event, search?: string) => listCustomers(search))
  ipcMain.handle(IpcChannels.customersGet, (_event, id: number) => getCustomer(id))
  ipcMain.handle(IpcChannels.customersCreate, (_event, data: CustomerInput) => createCustomer(data))
  ipcMain.handle(IpcChannels.customersUpdate, (_event, id: number, data: CustomerInput) =>
    updateCustomer(id, data)
  )
  ipcMain.handle(IpcChannels.customersRemove, (_event, id: number) => removeCustomer(id))

  ipcMain.handle(IpcChannels.productsList, (_event, search?: string) => listProducts(search))
  ipcMain.handle(IpcChannels.productsGet, (_event, id: number) => getProduct(id))
  ipcMain.handle(IpcChannels.productsCreate, (_event, data: ProductInput) => createProduct(data))
  ipcMain.handle(IpcChannels.productsUpdate, (_event, id: number, data: ProductInput) =>
    updateProduct(id, data)
  )
  ipcMain.handle(IpcChannels.productsRemove, (_event, id: number) => removeProduct(id))

  ipcMain.handle(IpcChannels.termsList, () => listTermsTemplates())
  ipcMain.handle(IpcChannels.termsCreate, (_event, data: TermsTemplateInput) =>
    createTermsTemplate(data)
  )
  ipcMain.handle(IpcChannels.termsUpdate, (_event, id: number, data: TermsTemplateInput) =>
    updateTermsTemplate(id, data)
  )
  ipcMain.handle(IpcChannels.termsRemove, (_event, id: number) => removeTermsTemplate(id))
  ipcMain.handle(IpcChannels.termsReorder, (_event, id: number, direction: ReorderDirection) =>
    reorderTermsTemplate(id, direction)
  )

  ipcMain.handle(IpcChannels.chargeRulesList, () => listChargeRules())
  ipcMain.handle(IpcChannels.chargeRulesCreate, (_event, data: ChargeRuleInput) =>
    createChargeRule(data)
  )
  ipcMain.handle(IpcChannels.chargeRulesUpdate, (_event, id: number, data: ChargeRuleInput) =>
    updateChargeRule(id, data)
  )
  ipcMain.handle(IpcChannels.chargeRulesRemove, (_event, id: number) => removeChargeRule(id))

  ipcMain.handle(IpcChannels.assetsPickImage, (_event, kind: AssetKind) => pickImage(kind))
  ipcMain.handle(IpcChannels.assetsGetDataUrl, (_event, relativePath: string) =>
    getAssetDataUrl(relativePath)
  )
}
