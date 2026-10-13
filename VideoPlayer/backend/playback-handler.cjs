function createPlaybackHandler ({ tokenManager, mediaEndpoint, allowedOrigins, filePrefix = 'gis/media/', fetchImpl = fetch }) {
  function reply (response, status, payload) {
    if (response.destroyed || response.writableEnded) return
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify(payload))
  }
  return async function handle (request, response) {
    if (request.url !== '/api/media/playback-url') return reply(response, 404, { success: false, message: 'Route not found.' })
    if (!allowedOrigins.includes(request.headers.origin)) return reply(response, 403, { success: false, message: 'This app origin is not allowed.' })
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin)
    response.setHeader('Access-Control-Allow-Credentials', 'true')
    response.setHeader('Vary', 'Origin')
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      response.writeHead(204)
      return response.end()
    }
    if (request.method !== 'POST') return reply(response, 405, { success: false, message: 'Use POST.' })
    let payload
    try {
      let text = ''
      for await (const part of request) {
        text += part.toString()
        if (Buffer.byteLength(text) > 16384) throw new Error('Request too large.')
      }
      const body = JSON.parse(text)
      const decodedName = typeof body.fileName === 'string' ? decodeURIComponent(body.fileName) : ''
      if (typeof body.fileName !== 'string' || !body.fileName.startsWith(filePrefix) || body.fileName.length <= filePrefix.length || decodedName.includes('\\') || decodedName.includes('\0') || decodedName.split('/').includes('..') || !Number.isInteger(body.expiryHours) || body.expiryHours < 1 || body.expiryHours > 168) throw new Error('Invalid playback request.')
      payload = { fileName: body.fileName, expiryHours: body.expiryHours }
    } catch { return reply(response, 400, { success: false, message: 'Use a filename in the configured video folder and a lifetime from 1 to 168 hours.' }) }
    try {
      let token = await tokenManager.getToken()
      const send = bearer => fetchImpl(mediaEndpoint, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${bearer}` },
        body: JSON.stringify(payload)
      })
      let upstream = await send(token)
      if (upstream.status === 401) {
        await upstream.body?.cancel()
        token = await tokenManager.getToken(token)
        upstream = await send(token)
      }
      if (!upstream.ok) {
        await upstream.body?.cancel()
        return reply(response, upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status, { success: false, message: 'The media API rejected the backend playback request. Ask the app owner to check backend access.' })
      }
      const result = await upstream.json()
      if (result?.success !== true) return reply(response, 502, { success: false, message: 'The media API did not create a playback URL.' })
      // Never forward authentication sessions, account profiles, or arbitrary upstream properties.
      reply(response, 200, { success: true, url: result.url, localUrl: result.localUrl, apnUrl: result.apnUrl, expiresAt: result.expiresAt })
    } catch { reply(response, 502, { success: false, message: 'Automatic playback is unavailable. Ask the app owner to check the backend sign-in and media services.' }) }
  }
}

module.exports = { createPlaybackHandler }
