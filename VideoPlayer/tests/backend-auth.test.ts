/** @jest-environment node */
const { createTokenManager } = jest.requireActual('../backend/token-manager.cjs')
const start = Date.parse('2026-10-13T12:00:00Z')
const hour = 3600000

function session (name: string, now = start) {
  return { token: name, expiresAt: new Date(now + 24 * hour).toISOString(), refreshToken: `${name}-refresh`, refreshTokenExpiresAt: new Date(now + 7 * 24 * hour).toISOString() }
}
function response (payload: unknown, status = 200) {
  return { ok: status === 200, status, json: async () => payload }
}
function manager (fetchImpl: unknown, now = () => start) {
  return createTokenManager({ loginUrl: 'http://identity.example/login', refreshUrl: 'http://identity.example/refresh', email: 'test@example.com', password: 'fake-test-password', fetchImpl, now })
}

test('backend logs in once and caches a still-valid access token', async () => {
  const fetchMock = jest.fn().mockResolvedValue(response(session('one')))
  const auth = manager(fetchMock)
  expect(await auth.getToken()).toBe('one')
  expect(await auth.getToken()).toBe('one')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('backend renews expiring access tokens and retains the rotated refresh token', async () => {
  let clock = start
  const fetchMock = jest.fn().mockImplementation(async () => response(session(`access-${fetchMock.mock.calls.length}`, clock)))
  const auth = manager(fetchMock, () => clock)
  await auth.getToken()
  clock += 25 * hour
  expect(await auth.getToken()).toBe('access-2')
  clock += 25 * hour
  expect(await auth.getToken()).toBe('access-3')
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refreshToken: 'access-1-refresh' })
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ refreshToken: 'access-2-refresh' })
})

test('after more than a week idle, backend logs in again without involving viewers', async () => {
  let clock = start
  const fetchMock = jest.fn().mockImplementation(async () => response(session('access', clock)))
  const auth = manager(fetchMock, () => clock)
  await auth.getToken()
  clock += 8 * 24 * hour
  await auth.getToken()
  expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['http://identity.example/login', 'http://identity.example/login'])
})

test('a revoked refresh token falls back to a fresh login', async () => {
  let clock = start
  const fetchMock = jest.fn().mockResolvedValueOnce(response(session('old')))
    .mockResolvedValueOnce(response({}, 401)).mockImplementation(async () => response(session('new', clock)))
  const auth = manager(fetchMock, () => clock)
  await auth.getToken()
  clock += 25 * hour
  expect(await auth.getToken()).toBe('new')
  expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['http://identity.example/login', 'http://identity.example/refresh', 'http://identity.example/login'])
})

test('simultaneous viewers share one authentication request', async () => {
  let finish: (value: unknown) => void
  const fetchMock = jest.fn().mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const auth = manager(fetchMock)
  const first = auth.getToken()
  const second = auth.getToken()
  finish(response(session('one')))
  expect(await Promise.all([first, second])).toEqual(['one', 'one'])
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('a refresh service outage does not cause repeated password login attempts', async () => {
  let clock = start
  const fetchMock = jest.fn().mockResolvedValueOnce(response(session('old'))).mockResolvedValueOnce(response({}, 500))
  const auth = manager(fetchMock, () => clock)
  await auth.getToken()
  clock += 25 * hour
  await expect(auth.getToken()).rejects.toThrow('authentication failed')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

test('a rejected access token renews once and a late rejection reuses the newer session', async () => {
  const fetchMock = jest.fn().mockResolvedValueOnce(response(session('old'))).mockResolvedValueOnce(response(session('new')))
  const auth = manager(fetchMock)
  await auth.getToken()
  expect(await auth.getToken('old')).toBe('new')
  expect(await auth.getToken('old')).toBe('new')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
