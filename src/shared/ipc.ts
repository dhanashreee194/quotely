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
  assetsGetDataUrl: 'assets:getDataUrl'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
