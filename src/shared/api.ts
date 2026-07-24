export type SettingsApi = {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
}

export type QuotelyApi = {
  settings: SettingsApi
}
