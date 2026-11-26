import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = resolve(root, '.smoke/letterhead-preview.html')
const outDir = resolve(root, '.smoke')
mkdirSync(outDir, { recursive: true })
const shot = resolve(outDir, 'letterhead-rendered.png')
const pdf = resolve(outDir, 'letterhead-check.pdf')

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 900, height: 1200 },
  deviceScaleFactor: 2
})
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.locator('.page').screenshot({ path: shot })
await page.pdf({
  path: pdf,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' }
})
await browser.close()
console.log('screenshot', shot)
console.log('pdf', pdf)
