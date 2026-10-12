const fs = require('fs')
const path = require('path')
const https = require('https')

const certificateFolder = path.resolve(__dirname, '../../../../../server/cert')
const route = '/api/media/presigned-url'
const allowedOrigin = 'https://localhost:3001'
const target = 'http://172.20.70.34:9051' + route

function sendJson (response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(payload))
}

async function readBody (request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk.toString()
    if (Buffer.byteLength(body) > 16384) throw new Error('Request too large.')
  }
  const payload = JSON.parse(body)
  if (typeof payload.fileName !== 'string' || !payload.fileName.trim() || !Number.isInteger(payload.expiryHours) || payload.expiryHours <= 0) throw new Error('Expected fileName and a positive integer expiryHours.')
  return { fileName: payload.fileName, expiryHours: payload.expiryHours }
}

async function serveRequest (request, response) {
  if (request.url !== route) return sendJson(response, 404, { success: false, message: 'Route not found.' })
  if (request.headers.origin !== allowedOrigin) return sendJson(response, 403, { success: false, message: 'Only the local Experience Builder origin is allowed.' })
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  response.setHeader('Vary', 'Origin')
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    response.writeHead(204)
    return response.end()
  }
  if (request.method !== 'POST') return sendJson(response, 405, { success: false, message: 'Use POST.' })
  const authorization = request.headers.authorization
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return sendJson(response, 401, { success: false, message: 'Bearer token required.' })
  let payload
  try { payload = await readBody(request) } catch { return sendJson(response, 400, { success: false, message: 'Invalid playback request.' }) }
  try {
    const upstream = await fetch(target, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(25000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: authorization },
      body: JSON.stringify(payload)
    })
    const reply = await upstream.json()
    sendJson(response, upstream.status, reply)
  } catch { sendJson(response, 502, { success: false, message: 'The local bridge could not reach the media API.' }) }
}

const server = https.createServer({
  key: fs.readFileSync(path.join(certificateFolder, 'server.key')),
  cert: fs.readFileSync(path.join(certificateFolder, 'server.cert'))
}, (request, response) => { void serveRequest(request, response) })
server.on('error', error => { console.error('Local bridge:', error.message); process.exitCode = 1 })
server.listen(9052, '127.0.0.1', () => {
  console.log('Local playback bridge: https://localhost:9052/api/media/presigned-url')
  console.log('Only https://localhost:3001 can use this route. No tokens or responses are saved.')
})
process.on('SIGINT', () => { server.close(() => { process.exit(0) }) })
process.on('SIGTERM', () => { server.close(() => { process.exit(0) }) })
