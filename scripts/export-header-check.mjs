/**
 * Headless PDF export for letterhead visual verification (no save dialog).
 * Usage: node scripts/export-header-check.mjs <quotationId> <outPdf>
 */
import { createRequire } from 'module'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { pathToFileURL } from 'url'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const quotationId = Number(process.argv[2] || 1)
const outPdf = resolve(process.argv[3] || join(root, '.smoke/letterhead-check.pdf'))

process.chdir(root)

// Boot Electron from the project's electron binary via electron-vite out build.
const electronPath = require('electron')
const { spawn } = await import('child_process')

const child = spawn(
  electronPath,
  [join(root, 'scripts/export-header-check-main.cjs'), String(quotationId), outPdf],
  {
    cwd: root,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: ''
    },
    stdio: 'inherit'
  }
)

child.on('exit', (code) => process.exit(code ?? 1))
