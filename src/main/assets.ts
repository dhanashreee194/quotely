import { randomUUID } from 'crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { extname, join } from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import type { AssetKind } from '../shared/types'

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
