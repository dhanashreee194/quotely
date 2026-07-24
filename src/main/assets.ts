import { randomUUID } from 'crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { extname, join } from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import { eq } from 'drizzle-orm'
import logoAsset from '../../resources/logo.png?asset'
import type { AssetKind } from '../shared/types'
import { getDatabase } from './db'
import { companyProfile } from './db/schema'

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
}

export function getAssetsRoot(): string {
  return join(app.getPath('userData'), 'assets')
}

export function ensureAssetsDir(): string {
  const root = getAssetsRoot()
  mkdirSync(join(root, 'logos'), { recursive: true })
  mkdirSync(join(root, 'signatures'), { recursive: true })
  return root
}

const DEFAULT_COMPANY_LOGO_RELATIVE = 'logos/quotely-default.png'

/**
 * On first launch (or whenever company_profile has no logoPath), copy the
 * bundled Quotely logo into userData and set it as the company logo.
 * Users can still replace it in Settings.
 */
export function ensureDefaultCompanyLogo(): void {
  ensureAssetsDir()
  const db = getDatabase()
  const existing = db.select().from(companyProfile).where(eq(companyProfile.id, 1)).get()
  if (existing?.logoPath) {
    return
  }

  const destination = resolveAssetPath(DEFAULT_COMPANY_LOGO_RELATIVE)
  if (!existsSync(destination)) {
    copyFileSync(logoAsset, destination)
  }

  const updatedAt = new Date().toISOString()
  if (existing) {
    db.update(companyProfile)
      .set({ logoPath: DEFAULT_COMPANY_LOGO_RELATIVE, updatedAt })
      .where(eq(companyProfile.id, 1))
      .run()
    return
  }

  db.insert(companyProfile)
    .values({
      id: 1,
      name: 'Quotely',
      logoPath: DEFAULT_COMPANY_LOGO_RELATIVE,
      updatedAt
    })
    .run()
}

function resolveAssetPath(relativePath: string): string {
  const normalized = relativePath.replace(/^[/\\]+/, '').replace(/\\/g, '/')
  if (normalized.includes('..')) {
    throw new Error('Invalid asset path')
  }
  return join(getAssetsRoot(), normalized)
}

export async function pickAndStoreImage(kind: AssetKind): Promise<string | null> {
  ensureAssetsDir()
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options: Electron.OpenDialogOptions = {
    title: kind === 'logo' ? 'Select company logo' : 'Select signature image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }]
  }
  const result = win
    ? await dialog.showOpenDialog(win, options)
    : await dialog.showOpenDialog(options)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const sourcePath = result.filePaths[0]
  const ext = extname(sourcePath).toLowerCase() || '.png'
  const folder = kind === 'logo' ? 'logos' : 'signatures'
  const relativePath = `${folder}/${randomUUID()}${ext}`
  const destination = resolveAssetPath(relativePath)
  copyFileSync(sourcePath, destination)
  return relativePath
}

export function readAssetDataUrl(relativePath: string): string | null {
  if (!relativePath) {
    return null
  }

  const fullPath = resolveAssetPath(relativePath)
  if (!existsSync(fullPath)) {
    return null
  }

  const ext = extname(fullPath).toLowerCase()
  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream'
  const buffer = readFileSync(fullPath)
  return `data:${mime};base64,${buffer.toString('base64')}`
}
