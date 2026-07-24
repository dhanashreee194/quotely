import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import AdmZip from 'adm-zip'
import type {
  BackupCreateResult,
  BackupManifest,
  BackupRestoreResult
} from '../../shared/dataManagement'
import { getAssetsRoot } from '../assets'
import {
  checkpointDatabase,
  closeDatabase,
  getDatabasePath,
  getSqlite,
  reopenDatabase
} from '../db'
import { getAppSchemaVersion, getDbSchemaVersion } from '../db/schemaVersion'
import { recordAudit } from './audit'

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function timestampStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function buildManifest(): BackupManifest {
  return {
    appVersion: app.getVersion(),
    schemaVersion: getDbSchemaVersion(getSqlite()) || getAppSchemaVersion(),
    createdAt: new Date().toISOString()
  }
}

function createBackupArchive(destPath: string): void {
  checkpointDatabase()
  const dbPath = getDatabasePath()
  if (!existsSync(dbPath)) {
    throw new Error('Database file not found')
  }

  const zip = new AdmZip()
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(buildManifest(), null, 2), 'utf8'))
  zip.addLocalFile(dbPath, '', 'quotely.db')
  const assetsRoot = getAssetsRoot()
  if (existsSync(assetsRoot)) {
    zip.addLocalFolder(assetsRoot, 'assets')
  }
  zip.writeZip(destPath)
}

export async function createBackup(): Promise<BackupCreateResult | null> {
  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options: Electron.SaveDialogOptions = {
    title: 'Save Quotely backup',
    defaultPath: `QuotelyBackup_${todayStamp()}.zip`,
    filters: [{ name: 'Quotely backup', extensions: ['zip'] }]
  }
  const save = parent
    ? await dialog.showSaveDialog(parent, options)
    : await dialog.showSaveDialog(options)

  if (save.canceled || !save.filePath) {
    return null
  }

  createBackupArchive(save.filePath)
  recordAudit({ action: 'backup', entityType: 'backup', entityId: save.filePath })
  return { path: save.filePath }
}

export async function pickBackupFile(): Promise<string | null> {
  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options: Electron.OpenDialogOptions = {
    title: 'Select Quotely backup',
    properties: ['openFile'],
    filters: [{ name: 'Quotely backup', extensions: ['zip'] }]
  }
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
}

function readManifest(zip: AdmZip): BackupManifest {
  const entry = zip.getEntry('manifest.json')
  if (!entry) {
    throw new Error('Backup is missing manifest.json')
  }
  let manifest: BackupManifest
  try {
    manifest = JSON.parse(entry.getData().toString('utf8')) as BackupManifest
  } catch {
    throw new Error('Backup manifest.json is invalid')
  }

  if (
    typeof manifest.schemaVersion !== 'number' ||
    typeof manifest.appVersion !== 'string' ||
    typeof manifest.createdAt !== 'string'
  ) {
    throw new Error('Backup manifest is missing required fields')
  }
  return manifest
}

function copyTree(src: string, dest: string): void {
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(join(dest, '..'), { recursive: true })
  cpSync(src, dest, { recursive: true })
}

function createSafetyBackup(): string {
  const dir = join(app.getPath('userData'), 'safety-backups')
  mkdirSync(dir, { recursive: true })
  const destPath = join(dir, `QuotelySafety_${timestampStamp()}.zip`)
  createBackupArchive(destPath)
  return destPath
}

export async function restoreBackup(zipPath: string): Promise<BackupRestoreResult> {
  if (!zipPath || !existsSync(zipPath)) {
    throw new Error('Backup file not found')
  }

  const zip = new AdmZip(zipPath)
  const manifest = readManifest(zip)
  if (!zip.getEntry('quotely.db')) {
    throw new Error('Backup is missing quotely.db')
  }

  const appSchemaVersion = getAppSchemaVersion()
  if (manifest.schemaVersion > appSchemaVersion) {
    throw new Error(
      `This backup requires schema version ${manifest.schemaVersion}, but this app supports up to ${appSchemaVersion}. Update Quotely before restoring.`
    )
  }

  const safetyBackupPath = createSafetyBackup()

  const extractRoot = join(app.getPath('temp'), `quotely-restore-${Date.now()}`)
  try {
    mkdirSync(extractRoot, { recursive: true })
    zip.extractAllTo(extractRoot, true)

    const restoredDb = join(extractRoot, 'quotely.db')
    const restoredAssets = join(extractRoot, 'assets')
    if (!existsSync(restoredDb)) {
      throw new Error('Backup is missing quotely.db')
    }

    closeDatabase()

    const dbPath = getDatabasePath()
    const assetsRoot = getAssetsRoot()
    writeFileSync(dbPath, readFileSync(restoredDb))
    for (const side of [`${dbPath}-wal`, `${dbPath}-shm`]) {
      if (existsSync(side)) rmSync(side, { force: true })
    }

    if (existsSync(restoredAssets)) {
      copyTree(restoredAssets, assetsRoot)
    } else {
      rmSync(assetsRoot, { recursive: true, force: true })
      mkdirSync(assetsRoot, { recursive: true })
    }

    reopenDatabase()

    const integrityCheck = String(getSqlite().pragma('integrity_check', { simple: true }))
    if (integrityCheck !== 'ok') {
      throw new Error(`Database integrity check failed: ${integrityCheck}`)
    }

    recordAudit({ action: 'restore', entityType: 'backup', entityId: zipPath })

    return {
      integrityCheck,
      safetyBackupPath,
      restoredFrom: zipPath
    }
  } finally {
    rmSync(extractRoot, { recursive: true, force: true })
  }
}
