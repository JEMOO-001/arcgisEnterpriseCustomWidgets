/** @jest-environment node */
const { createPlaybackHandler } = jest.requireActual('../backend/playback-handler.cjs')

async function playback (fetchImpl: unknown, getToken: unknown, origin = 'https://localhost:3001', fileName = 'gis/media/a.mp4') {
  let status: number
  let payload: { [key: string]: unknown }
  const handle = createPlaybackHandler({ tokenManager: { getToken }, mediaEndpoint: 'http://media.example/sign', allowedOrigins: ['https://localhost:3001'], fetchImpl })
  await handle({
    url: '/api/media/playback-url',
    method: 'POST',
    headers: { origin },
    async * [Symbol.asyncIterator] () { yield Buffer.from(JSON.stringify({ fileName, expiryHours: 24 })) }
  }, {
    setHeader: jest.fn(),
    writeHead: (value: number) => { status = value },
    end: (text: string) => { payload = JSON.parse(text) }
  })
  return { status, payload }
}

test('proxy supplies its own bearer and returns playback fields without any authentication session', async () => {
  const getToken = jest.fn().mockResolvedValue('backend-test-token')
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, url: 'http://minio.example/a.mp4', token: 'must-not-leak', refreshToken: 'must-not-leak', profile: { email: 'must-not-leak' } }) })
  const result = await playback(fetchMock, getToken)
  expect(result.status).toBe(200)
  expect(result.payload).toEqual({ success: true, url: 'http://minio.example/a.mp4' })
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer backend-test-token')
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ fileName: 'gis/media/a.mp4', expiryHours: 24 })
})

test('media 401 renews the server token and retries the playback request once', async () => {
  const getToken = jest.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new')
  const fetchMock = jest.fn().mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://minio.example/a.mp4' }) })
  expect((await playback(fetchMock, getToken)).status).toBe(200)
  expect(getToken).toHaveBeenLastCalledWith('old')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

test('unapproved origins never reach authentication or media endpoints', async () => {
  const getToken = jest.fn()
  const fetchMock = jest.fn()
  expect((await playback(fetchMock, getToken, 'https://unapproved.example')).status).toBe(403)
  expect(getToken).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('requests outside the configured video folder never use the service account', async () => {
  const getToken = jest.fn()
  expect((await playback(jest.fn(), getToken, 'https://localhost:3001', 'other/private.pdf')).status).toBe(400)
  expect(getToken).not.toHaveBeenCalled()
})

test('encoded traversal cannot request another folder with the service account', async () => {
  const getToken = jest.fn()
  expect((await playback(jest.fn(), getToken, 'https://localhost:3001', 'gis/media/%2e%2e/private.pdf')).status).toBe(400)
  expect(getToken).not.toHaveBeenCalled()
})
