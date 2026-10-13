import { hasGenericWidgetAccess, isRestrictedGroupRule } from '../src/common/access'
import { isPermissionManagedEditWidget } from '../src/common/edit-widget'

describe('generic child widget access', () => {
  it('recognizes the original Edit manifest and published Edit URI before runtime metadata loads', () => {
    expect(isPermissionManagedEditWidget({ _originManifest: { name: 'edit01' }, manifest: { name: 'item-id' } })).toBe(true)
    expect(isPermissionManagedEditWidget({ uri: 'https://host/exp_widgets/edit01/?version=1.15.6' })).toBe(true)
    expect(isPermissionManagedEditWidget({ uri: 'https://host/exp_widgets/edit01-copy/' })).toBe(false)
  })

  it('keeps ordinary widgets and incomplete unrelated configurations outside Edit permission filtering', () => {
    expect(isPermissionManagedEditWidget({ manifest: { name: 'print' }, config: {} })).toBe(false)
    expect(isPermissionManagedEditWidget({ config: { editMode: 'ATTRIBUTE' as any, layersConfig: [] } })).toBe(false)
    expect(isPermissionManagedEditWidget(undefined)).toBe(false)
  })

  it('allows widgets without a configured rule', () => {
    expect(hasGenericWidgetAccess(undefined, [], false)).toBe(true)
  })

  it('allows everyone mode regardless of group membership state', () => {
    expect(hasGenericWidgetAccess({ mode: 'everyone', groups: [] }, [], false)).toBe(true)
  })

  it('treats a selected-groups rule without groups as everyone', () => {
    const rule = { mode: 'groups' as const, groups: [] }
    expect(isRestrictedGroupRule(rule)).toBe(false)
    expect(hasGenericWidgetAccess(rule, [], true)).toBe(true)
  })

  it('fails closed while restricted group membership is loading', () => {
    const rule = { mode: 'groups' as const, groups: [{ id: 'group-a', title: 'Group A' }] }
    expect(isRestrictedGroupRule(rule)).toBe(true)
    expect(hasGenericWidgetAccess(rule, ['group-a'], false)).toBe(false)
  })

  it('allows a member of any selected group', () => {
    const rule = {
      mode: 'groups' as const,
      groups: [
        { id: 'group-a', title: 'Group A' },
        { id: 'group-b', title: 'Group B' }
      ]
    }
    expect(hasGenericWidgetAccess(rule, ['group-b'], true)).toBe(true)
  })

  it('denies a user who belongs to none of the selected groups', () => {
    const rule = { mode: 'groups' as const, groups: [{ id: 'group-a', title: 'Group A' }] }
    expect(hasGenericWidgetAccess(rule, ['group-c'], true)).toBe(false)
  })
})
