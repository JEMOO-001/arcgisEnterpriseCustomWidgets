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
  onProgress?: (message: string) => void
}

export function mediaAccessToken (config: Pick<Config, 'tokenMode' | 'sharedBearerToken'>, viewerToken: string): string {
  if (config.tokenMode === 'proxy') return ''
  const value = config.tokenMode === 'shared' ? config.sharedBearerToken : viewerToken
  return (value || '').trim().replace(/^Bearer(?:\s+|$)/i, '').trim()
}

export async function requestPlaybackUrl ({ config, video, token, signal, onProgress }: PlaybackRequest): Promise<string> {
  if (/^\s*https?:\/\//i.test(video.fileName)) throw new Error('[Feature data] The video field contains a web address. Store the fileName returned by the upload API, such as gis/media/video.mp4.')
  const endpoint = resolvePlaybackEndpoint(config)
  const accessToken = mediaAccessToken(config, token)
  if (config.tokenMode !== 'proxy' && !accessToken) throw new Error(`[Configuration] ${config.tokenMode === 'shared' ? 'The app owner must configure the shared media token in the widget settings.' : 'Enter your media API access token to play this video.'}`)
  const parsedEndpoint = new URL(endpoint)
  const requestAddress = `${parsedEndpoint.origin}${parsedEndpoint.pathname}`
  onProgress?.('1. Requesting a playback URL from the API…')
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal,
      credentials: config.tokenMode === 'proxy' ? 'include' : 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(config.tokenMode === 'proxy' ? {} : { Authorization: `Bearer ${accessToken}` }) },
      body: JSON.stringify({ fileName: video.fileName, expiryHours: config.expiryHours })
    })
  } catch (error) {
    if (signal.aborted) throw error
    const hint = parsedEndpoint.protocol === 'http:' && window.location.protocol === 'https:'
      ? 'This HTTPS app is calling an HTTP API; browser mixed-content or local-network restrictions may block it.'
      : 'Check whether the server and port are reachable, its HTTPS certificate is trusted, and CORS allows this app and the Authorization header.'
    throw new Error(`[API request] No readable response from ${requestAddress}. ${hint} Check the browser Console and Network tabs for the exact reason. No playback URL was received.`)
  }
  if (response.status === 401 || response.status === 403) throw new Error(`[API authentication — HTTP ${response.status}] ${config.tokenMode === 'proxy' ? 'The automatic playback backend rejected this app request. Ask the app owner to check backend access settings.' : config.tokenMode === 'shared' ? 'The shared media token has expired or was rejected. Ask the app owner to replace it in the widget settings.' : 'The media API rejected your access token. Enter a valid token and try again.'}`)
  if (!response.ok) throw new Error(`[API response — HTTP ${response.status}] The media API could not create a playback URL at ${requestAddress}. Check the API route and server logs.`)
  onProgress?.('2. API responded. Reading the playback URL…')
  let payload: { success?: unknown, url?: string, localUrl?: string, apnUrl?: string }
  try { payload = await response.json() } catch {
    if (signal.aborted) throw new Error('Request cancelled.')
    throw new Error('[API response] The server returned an unreadable JSON response. Check that the endpoint is the playback API, not a login or Swagger page.')
  }
  const address = payload?.[config.responseUrlField]
  if (payload?.success !== true || typeof address !== 'string' || !address.trim()) throw new Error(`[API response] The media API did not return a successful response with the configured URL field (${config.responseUrlField}). Expected success: true and a nonempty URL.`)
  try { return playbackUrl(address, config.useHttps) } catch {
    throw new Error('[Playback URL] The returned address is invalid, contains credentials, uses an unsupported protocol, or needs HTTPS. Check the URL response field and Use HTTPS setting.')
  }
}
