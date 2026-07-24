import { randomUUID } from 'crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from 'fs'
import { basename, extname, join } from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import { eq } from 'drizzle-orm'
import logoAsset from '../../resources/logo.png?asset'
import type { AssetKind } from '../shared/types'
import { getDatabase } from './db'
import { seedDemoCompanyProfile } from './db/seed'
import { companyProfile } from './db/schema'

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
}

/** Stable relative path for the bundled Quotely logo under userData/assets. */
export const BUNDLED_COMPANY_LOGO_RELATIVE = 'logos/quotely-default.png'

/** Legacy filenames that were used as the red placeholder logo. */
const LEGACY_PLACEHOLDER_BASENAMES = new Set([
  'placeholder.png',
  'placeholder-logo.png',
  'red-placeholder.png',
  'logo-placeholder.png'
])

/** 1×1 / tiny generated placeholders are well under this size. */
const PLACEHOLDER_MAX_BYTES = 512

export function getAssetsRoot(): string {
  return join(app.getPath('userData'), 'assets')
}

export function ensureAssetsDir(): string {
  const root = getAssetsRoot()
  mkdirSync(join(root, 'logos'), { recursive: true })
  mkdirSync(join(root, 'signatures'), { recursive: true })
  return root
}

function resolveAssetPath(relativePath: string): string {
  const normalized = relativePath.replace(/^[/\\]+/, '').replace(/\\/g, '/')
  if (normalized.includes('..')) {
    throw new Error('Invalid asset path')
  }
  return join(getAssetsRoot(), normalized)
}

/** Copy resources/logo.png into userData/assets/logos/ and return the relative path. */
export function installBundledCompanyLogo(): string {
  ensureAssetsDir()
  const destination = resolveAssetPath(BUNDLED_COMPANY_LOGO_RELATIVE)
  copyFileSync(logoAsset, destination)
  return BUNDLED_COMPANY_LOGO_RELATIVE
}

function isPlaceholderCompanyLogo(relativePath: string | null | undefined): boolean {
  if (!relativePath) {
    return true
  }

  const base = basename(relativePath).toLowerCase()
  if (LEGACY_PLACEHOLDER_BASENAMES.has(base) || base.includes('placeholder')) {
    return true
  }

  const fullPath = resolveAssetPath(relativePath)
  if (!existsSync(fullPath)) {
    return true
  }

  try {
    if (statSync(fullPath).size <= PLACEHOLDER_MAX_BYTES) {
      return true
    }
  } catch {
    return true
  }

  return false
}

function removeAssetFile(relativePath: string): void {
  try {
    const fullPath = resolveAssetPath(relativePath)
    if (existsSync(fullPath)) {
      unlinkSync(fullPath)
    }
  } catch {
    // Best-effort cleanup of the old placeholder file.
  }
}

/**
 * Ensure the demo company exists with the real Quotely logo, and migrate any
 * profile still pointing at the old red placeholder (tiny 1×1 PNG).
 */
export function ensureCompanyLogoBranding(): void {
  ensureAssetsDir()
  const logoPath = installBundledCompanyLogo()
  const db = getDatabase()

  seedDemoCompanyProfile(db, logoPath)

  const existing = db.select().from(companyProfile).where(eq(companyProfile.id, 1)).get()
  if (!existing) {
    return
  }

  if (!isPlaceholderCompanyLogo(existing.logoPath)) {
    return
  }

  const previous = existing.logoPath
  db.update(companyProfile)
    .set({ logoPath, updatedAt: new Date().toISOString() })
    .where(eq(companyProfile.id, 1))
    .run()

  if (previous && previous !== logoPath) {
    removeAssetFile(previous)
  }
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
