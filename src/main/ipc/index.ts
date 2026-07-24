import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/ipc'
import type { NumberingConfig, QuotationStatus } from '../../shared/quotation'
import type {
  AssetKind,
  ChargeRuleInput,
  CompanyProfileInput,
  CustomFieldDefinitionInput,
  CustomerInput,
  ItemColumnDefinitionInput,
  ProductInput,
  QuotationInput,
  QuotationTemplateInput,
  ReorderDirection,
  TemplateSectionInput,
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
import {
  createCustomField,
  createItemColumn,
  createQuotationTemplate,
  createTemplateSection,
  getQuotationTemplateBundle,
  listQuotationTemplates,
  removeCustomField,
  removeItemColumn,
  removeQuotationTemplate,
  removeTemplateSection,
  reorderCustomField,
  reorderItemColumn,
  reorderTemplateSection,
  setDefaultQuotationTemplate,
  updateCustomField,
  updateItemColumn,
  updateQuotationTemplate,
  updateTemplateSection
} from './quotationTemplates'
import {
  getNumberingConfig,
  peekNextQuotationNumber,
  updateNumberingConfig
} from './numbering'
import {
  exportQuotationPdf,
  getQuotationDocumentModel,
  printQuotation
} from './documents'
import {
  createQuotation,
  duplicateQuotation,
  finalizeQuotation,
  getQuotation,
  listQuotations,
  removeQuotation,
  reviseQuotation,
  setQuotationStatus,
  updateQuotation
} from './quotations'
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

  ipcMain.handle(IpcChannels.quotationTemplatesList, () => listQuotationTemplates())
  ipcMain.handle(IpcChannels.quotationTemplatesGet, (_event, id: number) =>
    getQuotationTemplateBundle(id)
  )
  ipcMain.handle(IpcChannels.quotationTemplatesCreate, (_event, data: QuotationTemplateInput) =>
    createQuotationTemplate(data)
  )
  ipcMain.handle(
    IpcChannels.quotationTemplatesUpdate,
    (_event, id: number, data: QuotationTemplateInput) => updateQuotationTemplate(id, data)
  )
  ipcMain.handle(IpcChannels.quotationTemplatesRemove, (_event, id: number) =>
    removeQuotationTemplate(id)
  )
  ipcMain.handle(IpcChannels.quotationTemplatesSetDefault, (_event, id: number) =>
    setDefaultQuotationTemplate(id)
  )

  ipcMain.handle(IpcChannels.templateSectionsCreate, (_event, data: TemplateSectionInput) =>
    createTemplateSection(data)
  )
  ipcMain.handle(
    IpcChannels.templateSectionsUpdate,
    (_event, id: number, data: Pick<TemplateSectionInput, 'name' | 'type' | 'enabled'>) =>
      updateTemplateSection(id, data)
  )
  ipcMain.handle(IpcChannels.templateSectionsRemove, (_event, id: number) =>
    removeTemplateSection(id)
  )
  ipcMain.handle(
    IpcChannels.templateSectionsReorder,
    (_event, id: number, direction: ReorderDirection) => reorderTemplateSection(id, direction)
  )

  ipcMain.handle(IpcChannels.customFieldsCreate, (_event, data: CustomFieldDefinitionInput) =>
    createCustomField(data)
  )
  ipcMain.handle(
    IpcChannels.customFieldsUpdate,
    (_event, id: number, data: Omit<CustomFieldDefinitionInput, 'templateId' | 'sectionId'>) =>
      updateCustomField(id, data)
  )
  ipcMain.handle(IpcChannels.customFieldsRemove, (_event, id: number) => removeCustomField(id))
  ipcMain.handle(IpcChannels.customFieldsReorder, (_event, id: number, direction: ReorderDirection) =>
    reorderCustomField(id, direction)
  )

  ipcMain.handle(IpcChannels.itemColumnsCreate, (_event, data: ItemColumnDefinitionInput) =>
    createItemColumn(data)
  )
  ipcMain.handle(
    IpcChannels.itemColumnsUpdate,
    (_event, id: number, data: Omit<ItemColumnDefinitionInput, 'templateId'>) =>
      updateItemColumn(id, data)
  )
  ipcMain.handle(IpcChannels.itemColumnsRemove, (_event, id: number) => removeItemColumn(id))
  ipcMain.handle(IpcChannels.itemColumnsReorder, (_event, id: number, direction: ReorderDirection) =>
    reorderItemColumn(id, direction)
  )

  ipcMain.handle(IpcChannels.quotationsList, (_event, search?: string) => listQuotations(search))
  ipcMain.handle(IpcChannels.quotationsGet, (_event, id: number) => getQuotation(id))
  ipcMain.handle(IpcChannels.quotationsCreate, (_event, data: QuotationInput) => createQuotation(data))
  ipcMain.handle(IpcChannels.quotationsUpdate, (_event, id: number, data: QuotationInput) =>
    updateQuotation(id, data)
  )
  ipcMain.handle(IpcChannels.quotationsRemove, (_event, id: number) => removeQuotation(id))
  ipcMain.handle(IpcChannels.quotationsFinalize, (_event, id: number) => finalizeQuotation(id))
  ipcMain.handle(IpcChannels.quotationsSetStatus, (_event, id: number, status: QuotationStatus) =>
    setQuotationStatus(id, status)
  )
  ipcMain.handle(IpcChannels.quotationsDuplicate, (_event, id: number) => duplicateQuotation(id))
  ipcMain.handle(IpcChannels.quotationsRevise, (_event, id: number) => reviseQuotation(id))

  ipcMain.handle(IpcChannels.numberingGet, () => getNumberingConfig())
  ipcMain.handle(IpcChannels.numberingUpdate, (_event, patch: Partial<NumberingConfig>) =>
    updateNumberingConfig(patch)
  )
  ipcMain.handle(IpcChannels.numberingPeek, () => peekNextQuotationNumber())

  ipcMain.handle(IpcChannels.documentsGetModel, (_event, quotationId: number) =>
    getQuotationDocumentModel(quotationId)
  )
  ipcMain.handle(IpcChannels.documentsExportPdf, (_event, quotationId: number) =>
    exportQuotationPdf(quotationId)
  )
  ipcMain.handle(IpcChannels.documentsPrint, (_event, quotationId: number) =>
    printQuotation(quotationId)
  )
}
