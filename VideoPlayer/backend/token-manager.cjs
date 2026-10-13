function createTokenManager ({ loginUrl, refreshUrl, email, password, fetchImpl = fetch, now = Date.now }) {
  let session = null
  let pending = null
  async function authenticate (url, body) {
    const response = await fetchImpl(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
    if (!response.ok) {
      await response.body?.cancel()
      const error = new Error('Automatic media authentication failed.')
      error.status = response.status
      throw error
    }
    const payload = await response.json()
    const expiresAt = Date.parse(payload?.expiresAt)
    if (typeof payload?.token !== 'string' || !payload.token || !Number.isFinite(expiresAt) || expiresAt <= now()) throw new Error('The identity service did not return a valid access session.')
    session = {
      token: payload.token, expiresAt,
      refreshToken: typeof payload.refreshToken === 'string' ? payload.refreshToken : '',
      refreshExpiresAt: Date.parse(payload.refreshTokenExpiresAt)
    }
    return session.token
  }
  async function renew () {
    if (session?.refreshToken && session.refreshExpiresAt > now()) {
      try { return await authenticate(refreshUrl, { refreshToken: session.refreshToken }) } catch (error) {
        // Invalid/expired refresh sessions can log in again. Do not retry a service outage with the password.
        if (error.status !== 401 && error.status !== 403) throw error
      }
    }
    return authenticate(loginUrl, { email, password })
  }
  async function getToken (rejectedToken) {
    if (session && session.expiresAt > now() + 60000 && (!rejectedToken || rejectedToken !== session.token)) return session.token
    if (!pending) pending = renew().finally(() => { pending = null })
    return pending
  }
  return { getToken }
}

module.exports = { createTokenManager }
