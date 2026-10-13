import { esri } from 'jimu-core'
import { loadGroupMembers } from '../src/setting/group-members'

jest.mock('jimu-core', () => ({
  esri: { restRequest: { request: jest.fn() } },
  getAppStore: () => ({ getState: () => ({ portalUrl: 'https://portal.example.com/portal/' }) }),
  SessionManager: { getInstance: () => ({ getSessionByUrl: () => ({ token: 'test-session' }) }) }
}))

const request = esri.restRequest.request as jest.Mock

describe('Portal group member picker data', () => {
  beforeEach(() => { request.mockReset() })

  it('reads all pages and includes owners/managers while merging duplicate memberships', async () => {
    request.mockImplementation(async (url, options) => {
      if (url.includes('/g2/')) {
        return { owner: { username: 'owner2' }, users: [{ username: 'EDITOR1', fullName: 'Editor One' }], nextStart: -1 }
      }
      if (options.params.start === 1) {
        return { owner: { username: 'owner1' }, users: [{ username: 'editor1', memberType: 'admin', token: 'do-not-persist' }], nextStart: 101 }
      }
      return { owner: { username: 'owner1' }, users: [{ username: 'editor2', fullName: 'Editor Two' }], nextStart: -1 }
    })
    const result = await loadGroupMembers(['g1', 'g2'], new AbortController().signal)
    expect(result.map(member => member.username.toLowerCase())).toEqual(['editor1', 'editor2', 'owner1', 'owner2'])
    expect(JSON.stringify(result)).not.toContain('token')
    expect(request).toHaveBeenCalledTimes(3)
    expect(request.mock.calls.some(([, options]) => options.params.start === 101)).toBe(true)
    for (const [url, options] of request.mock.calls) {
      expect(url).not.toContain('token=')
      expect(options).toMatchObject({ httpMethod: 'POST', hideToken: true, credentials: 'include' })
    }
  })

  it('reports incomplete or inaccessible groups as errors rather than an empty successful list', async () => {
    request.mockResolvedValue({ error: { code: 403 } })
    await expect(loadGroupMembers(['private-group'], new AbortController().signal)).rejects.toThrow()
    request.mockResolvedValue({ users: [], nextStart: 1 })
    await expect(loadGroupMembers(['invalid-page'], new AbortController().signal)).rejects.toThrow('pagination')
  })
})
