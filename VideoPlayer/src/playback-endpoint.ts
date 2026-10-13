import { type Config } from './config'

export const localApiBaseUrl = 'https://localhost:9052'
export const defaultEndpointPath = '/api/media/presigned-url'
export const automaticApiBaseUrl = 'https://localhost:9053'
export const automaticEndpointPath = '/api/media/playback-url'

export function resolvePlaybackEndpoint (config: Pick<Config, 'presignedUrlEndpoint' | 'apiBaseUrl' | 'tokenMode'>): string {
  const address = config.presignedUrlEndpoint?.trim() || (config.tokenMode === 'proxy' ? automaticEndpointPath : defaultEndpointPath)
  try {
    // A path uses the configured API host, not Experience Builder's own server.
    if (address.startsWith('//') || address.includes('\\')) throw new Error('Use a regular URL or a single-slash path.')
    const endpoint = address.startsWith('/')
      ? new URL(address, config.apiBaseUrl?.trim() || (config.tokenMode === 'proxy' ? automaticApiBaseUrl : localApiBaseUrl))
      : new URL(address)
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('Invalid API address.')
    return endpoint.href
  } catch {
    throw new Error('Use an HTTPS API base address with an endpoint path, or enter a complete HTTPS endpoint.')
  }
}
