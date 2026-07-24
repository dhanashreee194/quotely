import { dialog } from 'electron'

/**
 * When QUOTELY_E2E=1, replace native save/open dialogs with env-driven paths
 * so Playwright can exercise PDF export and backup without interactive UI.
 */
export function installE2eDialogHooks(): void {
  if (process.env.QUOTELY_E2E !== '1') {
    return
  }

  dialog.showSaveDialog = (async (...args: unknown[]) => {
    const options = (
      args.length === 2 ? args[1] : args[0]
    ) as Electron.SaveDialogOptions | undefined
    const title = options?.title ?? ''

    let filePath = process.env.QUOTELY_E2E_SAVE_PATH
    if (/pdf/i.test(title) && process.env.QUOTELY_E2E_PDF_PATH) {
      filePath = process.env.QUOTELY_E2E_PDF_PATH
    }
    if (/backup/i.test(title) && process.env.QUOTELY_E2E_BACKUP_PATH) {
      filePath = process.env.QUOTELY_E2E_BACKUP_PATH
    }

    if (!filePath) {
      return { canceled: true }
    }
    return { canceled: false, filePath }
  }) as typeof dialog.showSaveDialog

  dialog.showOpenDialog = (async () => {
    const openPath = process.env.QUOTELY_E2E_OPEN_PATH
    if (!openPath) {
      return { canceled: true, filePaths: [] }
    }
    return { canceled: false, filePaths: [openPath] }
  }) as typeof dialog.showOpenDialog
}
