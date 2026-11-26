/**
 * One-shot: export quotation PDF via E2E dialog hooks (no save dialog).
 * Usage: QUOTELY_E2E=1 QUOTELY_E2E_PDF_PATH=... electron out/main/index.js
 * then this script is not needed — see shell wrapper below.
 */
import { _electron as electron } from '@playwright/test'
import { existsSync, mkdirSync, statSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const quotationId = Number(process.env.QUOTE_ID || 7)
const pdfPath = process.env.QUOTELY_E2E_PDF_PATH || join(root, '.smoke/quotation-header-check.pdf')
mkdirSync(join(root, '.smoke'), { recursive: true })

const electronBin =
  process.platform === 'darwin'
    ? join(root, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
    : join(root, 'node_modules/electron/dist/electron')

const userData =
  process.env.QUOTELY_E2E_USER_DATA ||
  join(process.env.HOME || '', 'Library/Application Support/quotely')

const app = await electron.launch({
  executablePath: electronBin,
  args: [join(root, 'out/main/index.js')],
  env: {
    ...process.env,
    QUOTELY_E2E: '1',
    QUOTELY_E2E_USER_DATA: userData,
    QUOTELY_E2E_PDF_PATH: pdfPath,
    ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
  }
})

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')

// Login if needed (seeded admin).
const password = page.locator('input[type="password"]')
if (await password.count()) {
  await page.locator('input').first().fill('admin')
  await password.first().fill('admin123')
  await page.getByRole('button', { name: /sign in|log in|login/i }).click()
  await page.waitForTimeout(1000)
}

await page.waitForFunction(() => Boolean(window.api?.documents?.exportPdf), null, {
  timeout: 60_000
})

const brand = await page.evaluate(async () => window.api.assets.getDataUrl('branding/silex-logo.jpeg'))
console.log('brand logo present', Boolean(brand), brand ? brand.slice(0, 32) : null)

const result = await page.evaluate(async (id) => window.api.documents.exportPdf(id), quotationId)
console.log('export result', result)
console.log('pdf exists', existsSync(pdfPath), existsSync(pdfPath) ? statSync(pdfPath).size : 0)

await page.evaluate((id) => {
  window.location.hash = `#/quotations/${id}/preview?mode=export`
}, quotationId)
await page.waitForSelector('.qd-screen-only .silex-letterhead', { timeout: 45_000 })
await page.waitForTimeout(1000)
const shot = join(root, '.smoke/quotation-preview-header.png')
const letterhead = page.locator('.qd-screen-only .silex-letterhead').first()
await letterhead.screenshot({ path: shot })
console.log('screenshot', shot)

await app.close()
