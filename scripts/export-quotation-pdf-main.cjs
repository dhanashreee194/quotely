/**
 * Export a quotation PDF without a save dialog for visual QA.
 * Usage: electron scripts/export-quotation-pdf-main.cjs <quotationId> <outPdf>
 */
const { app, BrowserWindow, ipcMain } = require('electron')
const { writeFileSync, mkdirSync } = require('fs')
const { resolve, join, dirname } = require('path')

const quotationId = Number(process.argv[2] || 7)
const outPdf = resolve(process.argv[3] || resolve(__dirname, '../.smoke/quotation-header-check.pdf'))

// Point userData at the real Quotely profile so assets/DB match the app.
app.setPath('userData', join(app.getPath('home'), 'Library/Application Support/quotely'))

const root = resolve(__dirname, '..')

app.whenReady().then(async () => {
  mkdirSync(dirname(outPdf), { recursive: true })

  // Load compiled main helpers after setting userData.
  process.chdir(root)
  require('dotenv') // optional, ignore if missing
  try {
    // Prefer built output; fall back to forcing electron-vite build if needed.
    const { initDatabase } = require(join(root, 'out/main/chunks/db-index.js'))
  } catch {
    // Direct relative imports from compiled out/main/index.js side effects are awkward;
    // boot via the app entry pieces used in development.
  }

  // Use the same preview route the app uses for PDF export.
  const win = new BrowserWindow({
    width: 900,
    height: 1200,
    show: false,
    webPreferences: {
      preload: join(root, 'out/preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Register a minimal documents:ready listener like production.
  const ready = new Promise((resolveReady) => {
    const timer = setTimeout(() => resolveReady(), 8000)
    ipcMain.on('documents:ready', () => {
      clearTimeout(timer)
      resolveReady()
    })
  })

  const url = process.env.ELECTRON_RENDERER_URL
  if (url) {
    await win.loadURL(`${url}#/quotations/${quotationId}/preview?mode=export`)
  } else {
    await win.loadFile(join(root, 'out/renderer/index.html'), {
      hash: `/quotations/${quotationId}/preview?mode=export`
    })
  }

  await ready
  await new Promise((r) => setTimeout(r, 500))
  const pdf = await win.webContents.printToPDF({
    landscape: false,
    printBackground: true,
    pageSize: 'A4',
    margins: { marginType: 'none' }
  })
  writeFileSync(outPdf, pdf)
  console.log('wrote', outPdf)
  app.exit(0)
})
