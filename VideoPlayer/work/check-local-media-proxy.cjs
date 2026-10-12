const fs = require('fs')
const path = require('path')
const https = require('https')
const ca = fs.readFileSync(path.resolve(__dirname, '../../../../../server/cert/server.cert'))

function localRequest (method, headers = {}, payload = '') {
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: 'localhost', port: 9052, path: '/api/media/presigned-url', method, ca,
      lookup: (_hostname, options, callback) => { callback(null, options.all ? [{ address: '127.0.0.1', family: 4 }] : '127.0.0.1', options.all ? undefined : 4) },
      headers, timeout: 30000
    }, response => {
      let body = ''
      response.on('data', chunk => { body += chunk.toString() })
      response.on('end', () => { resolve({ status: response.statusCode, headers: response.headers, body }) })
    })
    request.on('timeout', () => { request.destroy(new Error('Local bridge request timed out.')) })
    request.on('error', reject)
    request.end(payload)
  })
}

async function main () {
  const preflight = await localRequest('OPTIONS', { Origin: 'https://localhost:3001', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' })
  const rejectedOrigin = await localRequest('OPTIONS', { Origin: 'https://other.example' })
  console.log(JSON.stringify({ preflightStatus: preflight.status, allowedOrigin: preflight.headers['access-control-allow-origin'], rejectedOriginStatus: rejectedOrigin.status }))
  if (!process.env.MEDIA_TEST_TOKEN) return
  const response = await localRequest('POST', { Origin: 'https://localhost:3001', 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MEDIA_TEST_TOKEN}` }, JSON.stringify({ fileName: 'gis/media/853edb83-553d-4c0d-a65a-b89a6c435674.mp4', expiryHours: 24 }))
  const reply = JSON.parse(response.body)
  console.log(JSON.stringify({ playbackStatus: response.status, success: reply.success, urlReturned: typeof reply.url === 'string', expiresAt: reply.expiresAt }))
}
main().catch(error => { console.error(JSON.stringify({ failed: true, message: error.message, cause: error.code })); process.exitCode = 1 })
