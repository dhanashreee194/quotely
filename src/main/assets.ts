import { randomUUID } from 'crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from 'fs'
import { basename, extname, join } from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import { eq } from 'drizzle-orm'
import logoAsset from '../../resources/logo.png?asset'
import letterheadAsset from '../../resources/kitchen/letterhead.jpeg?asset'
import bankQrAsset from '../../resources/kitchen/bank-qr.jpeg?asset'
import shutterAsset from '../../resources/kitchen/shutter.jpeg?asset'
import cabinetAsset from '../../resources/kitchen/cabinet.jpeg?asset'
import cutleryTrayAsset from '../../resources/kitchen/cutlery-tray.png?asset'
import thaliInletAsset from '../../resources/kitchen/thali-inlet.jpeg?asset'
import tendemDrawerAsset from '../../resources/kitchen/tendem-drawer.jpeg?asset'
import potPanDrawerAsset from '../../resources/kitchen/pot-pan-drawer.jpeg?asset'
import bottlePulloutAsset from '../../resources/kitchen/bottle-pullout.jpeg?asset'
import wickerBasketAsset from '../../resources/kitchen/wicker-basket.jpeg?asset'
import ssPipeFrameAsset from '../../resources/kitchen/ss-pipe-frame.jpeg?asset'
import carcaseAsset from '../../resources/kitchen/carcase.jpeg?asset'
import antiskidMattAsset from '../../resources/kitchen/antiskid-matt.jpeg?asset'
import jgHandleAsset from '../../resources/kitchen/jg-handle.jpeg?asset'
import topageHandleAsset from '../../resources/kitchen/topage-handle.jpeg?asset'
import hingesAsset from '../../resources/kitchen/hinges.jpeg?asset'
import pantrySystemAsset from '../../resources/kitchen/pantry-system.jpeg?asset'
import bifoldSystemAsset from '../../resources/kitchen/bifold-system.jpeg?asset'
import rollingShutterAsset from '../../resources/kitchen/rolling-shutter.jpeg?asset'
import swingTrayAsset from '../../resources/kitchen/swing-tray.jpeg?asset'
import dustbinAsset from '../../resources/kitchen/dustbin.jpeg?asset'
import magicCornerAsset from '../../resources/kitchen/magic-corner.jpeg?asset'
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
  mkdirSync(join(root, 'products'), { recursive: true })
  mkdirSync(join(root, 'products', 'kitchen'), { recursive: true })
  mkdirSync(join(root, 'branding'), { recursive: true })
  return root
}

/** Relative asset path of the letterhead banner printed on quote pages. */
export const LETTERHEAD_RELATIVE = 'branding/letterhead.jpeg'

/** Relative asset path of the bank/payment QR code shown next to bank details. */
export const BANK_QR_RELATIVE = 'branding/bank-qr.jpeg'

/** Bundled kitchen product images: resources/kitchen/<file> → assets/products/kitchen/<file>. */
const KITCHEN_IMAGE_SOURCES: Record<string, string> = {
  'shutter.jpeg': shutterAsset,
  'cabinet.jpeg': cabinetAsset,
  'cutlery-tray.png': cutleryTrayAsset,
  'thali-inlet.jpeg': thaliInletAsset,
  'tendem-drawer.jpeg': tendemDrawerAsset,
  'pot-pan-drawer.jpeg': potPanDrawerAsset,
  'bottle-pullout.jpeg': bottlePulloutAsset,
  'wicker-basket.jpeg': wickerBasketAsset,
  'ss-pipe-frame.jpeg': ssPipeFrameAsset,
  'carcase.jpeg': carcaseAsset,
  'antiskid-matt.jpeg': antiskidMattAsset,
  'jg-handle.jpeg': jgHandleAsset,
  'topage-handle.jpeg': topageHandleAsset,
  'hinges.jpeg': hingesAsset,
  'pantry-system.jpeg': pantrySystemAsset,
  'bifold-system.jpeg': bifoldSystemAsset,
  'rolling-shutter.jpeg': rollingShutterAsset,
  'swing-tray.jpeg': swingTrayAsset,
  'dustbin.jpeg': dustbinAsset,
  'magic-corner.jpeg': magicCornerAsset
}

/** Relative asset path for a bundled kitchen product image filename. */
export function kitchenImageRelativePath(filename: string): string {
  return `products/kitchen/${filename}`
}

/** Copy bundled kitchen product images + branding (letterhead, bank QR) into userData/assets. */
export function installBundledKitchenAssets(): void {
  ensureAssetsDir()
  for (const [filename, source] of Object.entries(KITCHEN_IMAGE_SOURCES)) {
    const destination = resolveAssetPath(kitchenImageRelativePath(filename))
    if (!existsSync(destination)) {
      copyFileSync(source, destination)
    }
  }
  const letterheadDest = resolveAssetPath(LETTERHEAD_RELATIVE)
  if (!existsSync(letterheadDest)) {
    copyFileSync(letterheadAsset, letterheadDest)
  }
  const bankQrDest = resolveAssetPath(BANK_QR_RELATIVE)
  if (!existsSync(bankQrDest)) {
    copyFileSync(bankQrAsset, bankQrDest)
  }
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
  installBundledKitchenAssets()
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

const ASSET_PICK_TITLES: Record<AssetKind, string> = {
  logo: 'Select company logo',
  signature: 'Select signature image',
  product: 'Select product image'
}

const ASSET_FOLDERS: Record<AssetKind, string> = {
  logo: 'logos',
  signature: 'signatures',
  product: 'products'
}

export async function pickAndStoreImage(kind: AssetKind): Promise<string | null> {
  ensureAssetsDir()
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options: Electron.OpenDialogOptions = {
    title: ASSET_PICK_TITLES[kind],
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
  const relativePath = `${ASSET_FOLDERS[kind]}/${randomUUID()}${ext}`
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
