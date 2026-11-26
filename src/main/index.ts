import { app, dialog, shell, BrowserWindow, nativeImage } from 'electron'
import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import logo from '../../resources/logo.png?asset'
import { ensureAssetsDir, ensureCompanyLogoBranding } from './assets'
import { closeDatabase, initDatabase } from './db'
import { installE2eDialogHooks } from './e2eDialogs'
import { registerIpcHandlers } from './ipc'
import { seedDefaultUsers } from './ipc/auth'

// Isolate E2E runs from the developer's real userData.
if (process.env.QUOTELY_E2E === '1' && process.env.QUOTELY_E2E_USER_DATA) {
  app.setPath('userData', process.env.QUOTELY_E2E_USER_DATA)
}

installE2eDialogHooks()

let started = false

/**
 * Record startup failures to <userData>/startup-error.log and tell the user, instead of the
 * app silently never opening (packaged builds have no console).
 */
function reportError(error: unknown): void {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
  try {
    const dir = app.getPath('userData')
    mkdirSync(dir, { recursive: true })
    appendFileSync(join(dir, 'startup-error.log'), `[${new Date().toISOString()}] ${message}\n\n`)
  } catch {
    // Logging is best-effort.
  }
  if (!started) {
    dialog.showErrorBox('Quotely could not start', message)
    app.exit(1)
  }
}

process.on('uncaughtException', reportError)
process.on('unhandledRejection', reportError)

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
  try {
    electronApp.setAppUserModelId('com.hyperlychee.quotely')

    const dockIcon = nativeImage.createFromPath(logo)
    if (process.platform === 'darwin' && app.dock && !dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon)
    }

    ensureAssetsDir()
    initDatabase()
    seedDefaultUsers()
    ensureCompanyLogoBranding()
    registerIpcHandlers()

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()
    started = true

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    reportError(error)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
