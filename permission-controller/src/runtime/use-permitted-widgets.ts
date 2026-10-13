import {
  AppMode,
  Immutable,
  React,
  ReactRedux,
  type IMRuntimeInfos,
  type IMState
} from 'jimu-core'
import { useControlledWidgets } from '../../../../../dist/widgets/common/controller/src/runtime/common/layout-utils'
import type { IMConfig as IMEditConfig } from '../../../edit01/src/config'
import type { IMConfig, WidgetAccessRule } from '../config'
import { hasGenericWidgetAccess, isRestrictedGroupRule } from '../common/access'
import {
  hasEffectiveEditAccess,
  isViewsRestricted,
  loadCurrentUserGroupIds
} from '../../../edit01/src/common/permission'

const EDIT_WIDGET_NAME = 'edit01'

const isPermissionManagedEditWidget = (widgetJson: any): boolean => {
  return widgetJson?.manifest?.name === EDIT_WIDGET_NAME
}

export const usePermittedWidgets = (
  controllerId: string,
  layoutName: string,
  config: IMConfig
): IMRuntimeInfos => {
  const widgets = useControlledWidgets(controllerId, layoutName)
  const widgetJsons = ReactRedux.useSelector((state: IMState) => state.appConfig.widgets)
  const user = ReactRedux.useSelector((state: IMState) => state.user) as any
  const portalUrl = ReactRedux.useSelector((state: IMState) => state.portalUrl)
  const isBuilder = ReactRedux.useSelector((state: IMState) =>
    state.appContext.isInBuilder && state.appRuntimeInfo.appMode !== AppMode.Run
  )

  const permissionConfigs = React.useMemo(() => {
    return Object.keys(widgets)
      .map(widgetId => widgetJsons?.[widgetId])
      .filter(isPermissionManagedEditWidget)
      .map(widgetJson => widgetJson?.config as IMEditConfig)
      .filter(Boolean)
  }, [widgetJsons, widgets])

  const needsEditGroups = permissionConfigs.some(config => isViewsRestricted(config))
  const needsGenericGroups = React.useMemo(() => {
    return Object.keys(widgets).some(widgetId => {
      const widgetJson = widgetJsons?.[widgetId]
      if (isPermissionManagedEditWidget(widgetJson)) return false
      return isRestrictedGroupRule(config?.widgetAccess?.[widgetId] as WidgetAccessRule)
    })
  }, [config?.widgetAccess, widgetJsons, widgets])
  const needsGroups = needsEditGroups || needsGenericGroups
  const storeGroupIds = React.useMemo(() => {
    if (!Array.isArray(user?.groups)) return null
    return user.groups.map(group => group.id) as string[]
  }, [user?.groups])
  const [remoteGroups, setRemoteGroups] = React.useState<{
    username: string
    ids: string[]
    ready: boolean
  }>({ username: '', ids: [], ready: false })

  React.useEffect(() => {
    const username = user?.username || ''
    if (isBuilder || !needsGroups || storeGroupIds !== null) return

    let active = true
    setRemoteGroups({ username, ids: [], ready: false })
    loadCurrentUserGroupIds().then(ids => {
      if (active) setRemoteGroups({ username, ids, ready: true })
    }).catch(error => {
      console.error('Unable to resolve edit widget group permissions.', error)
      if (active) setRemoteGroups({ username, ids: [], ready: true })
    })
    return () => { active = false }
  }, [isBuilder, needsGroups, portalUrl, storeGroupIds, user?.username])

  return React.useMemo(() => {
    if (isBuilder) return widgets

    const username = user?.username || ''
    const groupIds = storeGroupIds ?? (remoteGroups.username === username ? remoteGroups.ids : [])
    const groupsReady = !needsGroups || storeGroupIds !== null ||
      (remoteGroups.username === username && remoteGroups.ready)
    const permitted: { [widgetId: string]: any } = {}

    Object.keys(widgets).forEach(widgetId => {
      const widgetJson = widgetJsons?.[widgetId]
      if (!isPermissionManagedEditWidget(widgetJson)) {
        const accessRule = config?.widgetAccess?.[widgetId] as WidgetAccessRule
        if (hasGenericWidgetAccess(accessRule, groupIds, groupsReady)) {
          permitted[widgetId] = widgets[widgetId]
        }
        return
      }

      const editConfig = widgetJson?.config as IMEditConfig
      if (editConfig && hasEffectiveEditAccess(
        editConfig,
        user,
        groupIds,
        groupsReady,
        {
          allowWhileGroupsLoad: false,
          requireAuthenticatedUser: true
        }
      )) {
        permitted[widgetId] = widgets[widgetId]
      }
    })

    return Immutable(permitted) as IMRuntimeInfos
  }, [config?.widgetAccess, isBuilder, needsGroups, remoteGroups, storeGroupIds, user, widgetJsons, widgets])
}
