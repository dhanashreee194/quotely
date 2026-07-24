import { app, shell, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import logo from '../../resources/logo.png?asset'
import { ensureAssetsDir, ensureCompanyLogoBranding } from './assets'
import { closeDatabase, initDatabase } from './db'
import { installE2eDialogHooks } from './e2eDialogs'
import { registerIpcHandlers } from './ipc'

// Isolate E2E runs from the developer's real userData.
if (process.env.QUOTELY_E2E === '1' && process.env.QUOTELY_E2E_USER_DATA) {
  app.setPath('userData', process.env.QUOTELY_E2E_USER_DATA)
}

installE2eDialogHooks()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // Floor matches the narrowest layout we support (~700px with hamburger nav).
    minWidth: 700,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    icon: logo,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.hyperlychee.quotely')

  const dockIcon = nativeImage.createFromPath(logo)
  if (process.platform === 'darwin' && app.dock && !dockIcon.isEmpty()) {
    app.dock.setIcon(dockIcon)
  }

  ensureAssetsDir()
  initDatabase()
  ensureCompanyLogoBranding()
  registerIpcHandlers()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
