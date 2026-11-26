const { app, BrowserWindow } = require('electron')
const { writeFileSync, mkdirSync } = require('fs')
const { resolve, join } = require('path')
const { pathToFileURL } = require('url')

const root = resolve(__dirname, '..')
const html = resolve(root, '.smoke/letterhead-preview.html')
const outDir = resolve(root, '.smoke')
const shot = resolve(outDir, 'letterhead-rendered.png')
const pdf = resolve(outDir, 'letterhead-check.pdf')

app.whenReady().then(async () => {
  mkdirSync(outDir, { recursive: true })
  const win = new BrowserWindow({
    width: 900,
    height: 1200,
    show: false,
    webPreferences: { sandbox: false }
  })
  await win.loadURL(pathToFileURL(html).href)
  await new Promise((r) => setTimeout(r, 400))
  const image = await win.webContents.capturePage()
  writeFileSync(shot, image.toPNG())
  const pdfBuffer = await win.webContents.printToPDF({
    landscape: false,
    printBackground: true,
    pageSize: 'A4',
    margins: { marginType: 'none' }
  })
  writeFileSync(pdf, pdfBuffer)
  console.log('screenshot', shot)
  console.log('pdf', pdf)
  app.exit(0)
})
