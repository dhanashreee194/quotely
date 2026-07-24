export const IpcChannels = {
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',

  companyGet: 'company:get',
  companyUpsert: 'company:upsert',

  customersList: 'customers:list',
  customersGet: 'customers:get',
  customersCreate: 'customers:create',
  customersUpdate: 'customers:update',
  customersRemove: 'customers:remove',

  productsList: 'products:list',
  productsGet: 'products:get',
  productsCreate: 'products:create',
  productsUpdate: 'products:update',
  productsRemove: 'products:remove',

  termsList: 'terms:list',
  termsCreate: 'terms:create',
  termsUpdate: 'terms:update',
  termsRemove: 'terms:remove',
  termsReorder: 'terms:reorder',

  chargeRulesList: 'chargeRules:list',
  chargeRulesCreate: 'chargeRules:create',
  chargeRulesUpdate: 'chargeRules:update',
  chargeRulesRemove: 'chargeRules:remove',

  assetsPickImage: 'assets:pickImage',
  assetsGetDataUrl: 'assets:getDataUrl',

  quotationTemplatesList: 'quotationTemplates:list',
  quotationTemplatesGet: 'quotationTemplates:get',
  quotationTemplatesCreate: 'quotationTemplates:create',
  quotationTemplatesUpdate: 'quotationTemplates:update',
  quotationTemplatesRemove: 'quotationTemplates:remove',
  quotationTemplatesSetDefault: 'quotationTemplates:setDefault',

  templateSectionsCreate: 'templateSections:create',
  templateSectionsUpdate: 'templateSections:update',
  templateSectionsRemove: 'templateSections:remove',
  templateSectionsReorder: 'templateSections:reorder',

  customFieldsCreate: 'customFields:create',
  customFieldsUpdate: 'customFields:update',
  customFieldsRemove: 'customFields:remove',
  customFieldsReorder: 'customFields:reorder',

  itemColumnsCreate: 'itemColumns:create',
  itemColumnsUpdate: 'itemColumns:update',
  itemColumnsRemove: 'itemColumns:remove',
  itemColumnsReorder: 'itemColumns:reorder',

  quotationsList: 'quotations:list',
  quotationsGet: 'quotations:get',
  quotationsCreate: 'quotations:create',
  quotationsUpdate: 'quotations:update',
  quotationsRemove: 'quotations:remove',
  quotationsFinalize: 'quotations:finalize',
  quotationsSetStatus: 'quotations:setStatus',
  quotationsDuplicate: 'quotations:duplicate',
  quotationsRevise: 'quotations:revise',
  numberingGet: 'numbering:get',
  numberingUpdate: 'numbering:update',
  numberingPeek: 'numbering:peek',

  documentsGetModel: 'documents:getModel',
  documentsExportPdf: 'documents:exportPdf',
  documentsPrint: 'documents:print',
  documentsReady: 'documents:ready',

  backupCreate: 'backup:create',
  backupPick: 'backup:pick',
  backupRestore: 'backup:restore',

  auditList: 'audit:list',
  auditActions: 'audit:actions',

  exportCsv: 'export:csv',

  dashboardGetSummary: 'dashboard:getSummary'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
