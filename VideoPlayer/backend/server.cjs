const fs = require('fs')
const path = require('path')
const https = require('https')
const { createTokenManager } = require('./token-manager.cjs')
const { createPlaybackHandler } = require('./playback-handler.cjs')

const email = process.env.VIDEO_PROXY_EMAIL
const password = process.env.VIDEO_PROXY_PASSWORD
if (!email || !password) throw new Error('Configure VIDEO_PROXY_EMAIL and VIDEO_PROXY_PASSWORD in the backend environment.')
const identityBase = process.env.VIDEO_PROXY_IDENTITY_BASE_URL || 'http://172.20.70.34/identity-api/api/identity/v1/auth'
const mediaEndpoint = process.env.VIDEO_PROXY_MEDIA_ENDPOINT || 'http://172.20.70.34:9051/api/media/presigned-url'
const port = Number(process.env.VIDEO_PROXY_PORT || 9053)
const allowedOrigins = (process.env.VIDEO_PROXY_ALLOWED_ORIGINS || 'https://localhost:3001').split(',').map(origin => new URL(origin.trim()).origin)
for (const address of [identityBase, mediaEndpoint]) {
  const url = new URL(address)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Configure regular identity/media service addresses without URL credentials.')
}
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Configure a valid VIDEO_PROXY_PORT.')
const filePrefix = process.env.VIDEO_PROXY_FILE_PREFIX || 'gis/media/'
if (!filePrefix || !filePrefix.endsWith('/') || filePrefix.includes('..') || filePrefix.includes('\\')) throw new Error('Configure a video folder prefix ending in /.')
const tokenManager = createTokenManager({ loginUrl: `${identityBase.replace(/\/$/, '')}/login`, refreshUrl: `${identityBase.replace(/\/$/, '')}/refresh`, email, password })
const handle = createPlaybackHandler({ tokenManager, mediaEndpoint, allowedOrigins, filePrefix })
const certificateFolder = path.resolve(__dirname, '../../../../../server/cert')
const server = https.createServer({
  key: fs.readFileSync(process.env.VIDEO_PROXY_TLS_KEY_FILE || path.join(certificateFolder, 'server.key')),
  cert: fs.readFileSync(process.env.VIDEO_PROXY_TLS_CERT_FILE || path.join(certificateFolder, 'server.cert'))
}, (request, response) => { void handle(request, response) })
server.requestTimeout = 60000
server.on('error', error => { console.error('Automatic playback backend:', error.code || 'startup error'); process.exitCode = 1 })
server.listen(port, '127.0.0.1', () => { console.log(`Automatic playback backend: https://localhost:${port}/api/media/playback-url (loopback only)` ) })
process.on('SIGINT', () => { server.close(() => { process.exit(0) }) })
process.on('SIGTERM', () => { server.close(() => { process.exit(0) }) })
