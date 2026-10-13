import { getAppStore, SessionManager } from 'jimu-core'
import { EditModeType, type IMConfig, type ViewConfig } from '../config'

export interface PortalUserLike {
  role?: string
  privileges?: string[]
  username?: string
  groups?: Array<{ id: string }>
}

export interface EditAccessOptions {
  isBuilder?: boolean
  allowWhileGroupsLoad?: boolean
  requireAuthenticatedUser?: boolean
}

const toMutableViews = (config: IMConfig): ViewConfig[] => {
  const views = config?.views
  if (!views) return []
  return (views.asMutable ? views.asMutable({ deep: true }) : views) as ViewConfig[]
}

export const isViewsRestricted = (config: IMConfig): boolean => {
  return !!config?.viewsEnabled &&
    config.editMode === EditModeType.Attribute &&
    toMutableViews(config).length > 0
}

export const getActivePermissionViews = (
  config: IMConfig,
  currentUserGroupIds: string[],
  user?: Pick<PortalUserLike, 'username'>
): ViewConfig[] => {
  if (!isViewsRestricted(config)) return []
  return toMutableViews(config).filter(view =>
    (view.groups || []).some(group => currentUserGroupIds.includes(group.id)) &&
    (view.memberAccess !== 'specific' || (!!user?.username &&
      (view.allowedUsers || []).some(member =>
        member.username?.toLowerCase() === user.username.toLowerCase()
      )))
  )
}

export const hasPortalEditPrivilege = (user?: PortalUserLike): boolean => {
  if (!user) return true
  if (user.role === 'org_viewer') return false
  if (user.role === 'org_admin' || user.role === 'org_publisher') return true
  return Array.isArray(user.privileges) && user.privileges.includes('features:user:edit')
}

export const hasEffectiveEditAccess = (
  config: IMConfig,
  user: PortalUserLike,
  currentUserGroupIds: string[],
  currentUserGroupIdsReady: boolean,
  options: EditAccessOptions = {}
): boolean => {
  if (options.isBuilder) return true
  if (options.requireAuthenticatedUser && !user) return false
  if (!hasPortalEditPrivilege(user)) return false

  if (isViewsRestricted(config)) {
    if (!currentUserGroupIdsReady) return !!options.allowWhileGroupsLoad
    const activeViews = getActivePermissionViews(config, currentUserGroupIds, user)
    if (activeViews.length === 0) return false
    return activeViews.some(view =>
      Object.values(view.editableFields || {}).some(fields => fields?.length > 0)
    )
  }

  return true
}

export const loadCurrentUserGroupIds = async (): Promise<string[]> => {
  const state = getAppStore()?.getState() as any
  const user = state?.user as PortalUserLike
  if (Array.isArray(user?.groups)) {
    return user.groups.map(group => group.id)
  }

  const portalUrl = (state?.portalUrl || 'https://www.arcgis.com').replace(/\/+$/, '')
  const username = user?.username
  if (!username) return []

  const session = SessionManager.getInstance().getSessionByUrl(portalUrl) as any
  const url = `${portalUrl}/sharing/rest/community/users/${encodeURIComponent(username)}`
  const timeout = new Promise<null>(resolve => {
    setTimeout(() => { resolve(null) }, 5000)
  })
  const request = session?.getUser
    ? session.getUser().then(portalUser =>
      (portalUser?.groups || []).map((group: any) => group.id)
    )
    : (async () => {
        const response = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'f=json'
        })
        if (!response.ok) return []
        const data = await response.json()
        return (data?.groups || []).map((group: any) => group.id)
      })()

  const groupIds = await Promise.race([request, timeout])
  return groupIds ?? []
}
