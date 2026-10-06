import 'server-only'
import { Files, type Body } from 'files-sdk'
import { neon } from 'files-sdk/neon'

export const MEDIA_BUCKET = 'media'
export const PUBLIC_ASSETS_BUCKET = 'public-assets'

let media: Files | null = null
let publicAssets: Files | null = null

function create(bucket: string): Files {
  return new Files({ adapter: neon({ bucket }) })
}

export function getMediaStore(): Files {
  if (!media) media = create(MEDIA_BUCKET)
  return media
}

export function getPublicAssetsStore(): Files {
  if (!publicAssets) publicAssets = create(PUBLIC_ASSETS_BUCKET)
  return publicAssets
}

export function publicAssetUrl(key: string): string {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3
  if (!endpoint) {
    throw new Error(
      'Missing AWS_ENDPOINT_URL_S3. Run `neon env pull` to load the linked branch storage endpoint.'
    )
  }
  return `${endpoint.replace(/\/$/, '')}/${PUBLIC_ASSETS_BUCKET}/${key}`
}

export async function uploadMedia(
  key: string,
  body: Body,
  opts: { contentType?: string } = {}
): Promise<void> {
  await getMediaStore().upload(key, body, { contentType: opts.contentType })
}

export async function getMediaUrl(key: string, expiresIn = 3600): Promise<string> {
  return getMediaStore().url(key, { expiresIn })
}

export async function downloadMedia(key: string): Promise<Uint8Array> {
  const file = await getMediaStore().download(key)
  return new Uint8Array(await file.arrayBuffer())
}

export async function deleteMedia(key: string): Promise<void> {
  await getMediaStore().delete(key)
}

export async function createMediaUploadUrl(
  key: string,
  opts: { contentType?: string; expiresIn?: number } = {}
): Promise<{ url: string; key: string }> {
  const signed = await getMediaStore().signedUploadUrl(key, {
    expiresIn: opts.expiresIn ?? 3600,
    contentType: opts.contentType,
  })
  return { url: signed.url, key }
}

export function mediaExists(key: string): Promise<boolean> {
  return getMediaStore().exists(key)
}