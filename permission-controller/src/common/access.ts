import type { WidgetAccessRule } from '../config'

export const isRestrictedGroupRule = (rule?: WidgetAccessRule): boolean => {
  return rule?.mode === 'groups' && (rule.groups?.length ?? 0) > 0
}

export const hasGenericWidgetAccess = (
  rule: WidgetAccessRule | undefined,
  currentUserGroupIds: string[],
  currentUserGroupIdsReady: boolean
): boolean => {
  if (!isRestrictedGroupRule(rule)) return true
  if (!currentUserGroupIdsReady) return false

  return rule.groups.some(group => currentUserGroupIds.includes(group.id))
}
