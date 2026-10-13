import { type Config } from '../config'
import { resolvePlaybackEndpoint } from '../playback-endpoint'

export interface VideoRecord {
  fileName: string
  title: string
}

export function layerAddress (address: string): string {
  return address.trim().replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase()
}

export function featureServiceLayerUrl (layer: Pick<__esri.FeatureLayer, 'url' | 'layerId'>): string {
  return /\/(FeatureServer|MapServer)\/?$/i.test(layer.url)
    ? `${layer.url.replace(/\/$/, '')}/${layer.layerId}`
    : layer.url
}

export function videoRecords (attributes: Array<{ [field: string]: unknown }>, config: Pick<Config, 'fileNameField' | 'titleField'>): VideoRecord[] {
  const videos: VideoRecord[] = []
  for (const row of attributes) {
    const fileName = row[config.fileNameField]
    if (typeof fileName !== 'string' || !fileName.trim()) continue
    const title = config.titleField ? row[config.titleField] : null
    videos.push({ fileName, title: typeof title === 'string' && title.trim() ? title : fileName.split('/').pop() || fileName })
  }
  return videos
}

export function playbackUrl (address: string, useHttps: boolean): string {
  // Change only the scheme: reserializing a signed URL can change its signature bytes.
  const candidate = useHttps ? address.replace(/^http:\/\//i, 'https://') : address
  const parsed = new URL(candidate)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('The API returned an unsupported video URL.')
  if (parsed.username || parsed.password) throw new Error('The API returned a video URL containing credentials.')
  if (parsed.protocol === 'http:' && window.location.protocol === 'https:') throw new Error('The video URL must use HTTPS in this experience.')
  return candidate
}

interface PlaybackRequest {
  config: Config
  video: VideoRecord
  token: string
  signal: AbortSignal
}

export function mediaAccessToken (config: Pick<Config, 'tokenMode' | 'sharedBearerToken'>, viewerToken: string): string {
  if (config.tokenMode === 'proxy') return ''
  const value = config.tokenMode === 'shared' ? config.sharedBearerToken : viewerToken
  return (value || '').trim().replace(/^Bearer(?:\s+|$)/i, '').trim()
}

export async function requestPlaybackUrl ({ config, video, token, signal }: PlaybackRequest): Promise<string> {
  if (/^\s*https?:\/\//i.test(video.fileName)) throw new Error('The video field contains a web address. Store the fileName returned by the upload API, such as gis/media/video.mp4.')
  const endpoint = resolvePlaybackEndpoint(config)
  const accessToken = mediaAccessToken(config, token)
  if (config.tokenMode !== 'proxy' && !accessToken) throw new Error(config.tokenMode === 'shared' ? 'The app owner must configure the shared media token in the widget settings.' : 'Enter your media API access token to play this video.')
  const response = await fetch(endpoint, {
    method: 'POST',
    signal,
    credentials: config.tokenMode === 'proxy' ? 'include' : 'omit',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(config.tokenMode === 'proxy' ? {} : { Authorization: `Bearer ${accessToken}` }) },
    body: JSON.stringify({ fileName: video.fileName, expiryHours: config.expiryHours })
  })
  if (response.status === 401 || response.status === 403) throw new Error(config.tokenMode === 'proxy' ? 'The automatic playback backend rejected this app request. Ask the app owner to check backend access settings.' : config.tokenMode === 'shared' ? 'The shared media token has expired or was rejected. Ask the app owner to replace it in the widget settings.' : 'The media API rejected your access token. Enter a valid token and try again.')
  if (!response.ok) throw new Error(`The media API could not create a playback URL (HTTP ${response.status}). Try again.`)
  const payload = await response.json() as { success?: boolean, url?: string, localUrl?: string, apnUrl?: string }
  const address = payload?.[config.responseUrlField]
  if (!(payload?.success) || typeof address !== 'string' || !address.trim()) throw new Error('The media API did not return a successful response with the configured URL field.')
  return playbackUrl(address, config.useHttps)
}
