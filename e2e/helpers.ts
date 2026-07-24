import { mkdirSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

export type E2eHarness = {
  app: ElectronApplication
  page: Page
  userData: string
  pdfPath: string
  backupPath: string
  cleanup: () => Promise<void>
}

function electronExecutable(): string {
  const dist = join(process.cwd(), 'node_modules', 'electron', 'dist')
  if (process.platform === 'darwin') {
    return join(dist, 'Electron.app', 'Contents', 'MacOS', 'Electron')
  }
  if (process.platform === 'win32') {
    return join(dist, 'electron.exe')
  }
  return join(dist, 'electron')
}

export async function launchQuotely(): Promise<E2eHarness> {
  const root = mkdtempSync(join(tmpdir(), 'quotely-e2e-'))
  const userData = join(root, 'userData')
  const pdfPath = join(root, 'quotation.pdf')
  const backupPath = join(root, 'backup.zip')
  mkdirSync(userData, { recursive: true })

  const mainEntry = join(process.cwd(), 'out', 'main', 'index.js')

  const app = await electron.launch({
    executablePath: electronExecutable(),
    args: [mainEntry],
    env: {
      ...process.env,
      QUOTELY_E2E: '1',
      QUOTELY_E2E_USER_DATA: userData,
      QUOTELY_E2E_PDF_PATH: pdfPath,
      QUOTELY_E2E_BACKUP_PATH: backupPath,
      QUOTELY_E2E_SAVE_PATH: backupPath,
      QUOTELY_E2E_OPEN_PATH: backupPath,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
    }
  })

  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  // Hash router home
  await page.waitForSelector('text=Quotely', { timeout: 60_000 })

  return {
    app,
    page,
    userData,
    pdfPath,
    backupPath,
    cleanup: async () => {
      await app.close()
      rmSync(root, { recursive: true, force: true })
    }
  }
}

export async function ensureCustomerAndTemplate(page: Page): Promise<void> {
  // Seeded template exists; ensure at least one customer via Settings/Customers UI or API.
  await page.evaluate(async () => {
    const customers = await window.api.customers.list()
    if (customers.length === 0) {
      await window.api.customers.create({
        name: 'E2E Customer',
        email: 'e2e@example.com'
      })
    }
  })
}
