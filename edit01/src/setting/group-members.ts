import { esri, getAppStore, SessionManager } from 'jimu-core'
import type { ViewUserInfo } from '../config'

// Group userList is paginated; include its separate owner entry as well.
// Persist only username/fullName, never session data or authenticated URLs.
export const loadGroupMembers = async (
  groupIds: string[],
  signal: AbortSignal
): Promise<ViewUserInfo[]> => {
  const state = getAppStore().getState()
  const portalUrl = (state.portalUrl || 'https://www.arcgis.com').replace(/\/+$/, '')
  const authentication = SessionManager.getInstance().getSessionByUrl(portalUrl)
  const members = await Promise.all(groupIds.map(async groupId => {
    const users: ViewUserInfo[] = []
    let start = 1
    while (start > 0) {
      const result = await esri.restRequest.request(
        `${portalUrl}/sharing/rest/community/groups/${encodeURIComponent(groupId)}/userList`,
        {
          authentication,
          httpMethod: 'POST',
          hideToken: true,
          credentials: 'include',
          signal,
          params: { f: 'json', num: 100, start, sortField: 'username', sortOrder: 'asc' }
        }
      )
      if (result?.error || !Array.isArray(result?.users)) {
        throw new Error('Unable to read group members.')
      }
      if (result.owner?.username) users.push(result.owner)
      users.push(...result.users)
      const nextStart = result.nextStart ?? -1
      if (nextStart > 0 && nextStart <= start) throw new Error('Invalid member pagination.')
      start = nextStart
    }
    return users
  }))
  const unique = new Map<string, ViewUserInfo>()
  members.flat().forEach(member => {
    if (!member.username) return
    unique.set(member.username.toLowerCase(), {
      username: member.username,
      fullName: member.fullName || undefined
    })
  })
  return [...unique.values()].sort((a, b) => a.username.localeCompare(b.username))
}
