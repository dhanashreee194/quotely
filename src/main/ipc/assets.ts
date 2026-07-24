import type { AssetKind } from '../../shared/types'
import { pickAndStoreImage, readAssetDataUrl } from '../assets'

export async function pickImage(kind: AssetKind): Promise<string | null> {
  return pickAndStoreImage(kind)
}

export async function getAssetDataUrl(relativePath: string): Promise<string | null> {
  return readAssetDataUrl(relativePath)
}
