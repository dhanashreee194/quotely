import { ipcMain } from 'electron'
import { IpcChannels } from '../../shared/ipc'
import { getSetting, setSetting } from './settings'

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.settingsGet, (_event, key: string) => getSetting(key))
  ipcMain.handle(IpcChannels.settingsSet, (_event, key: string, value: string) =>
    setSetting(key, value)
  )
}
