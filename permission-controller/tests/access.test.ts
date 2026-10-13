import { hasGenericWidgetAccess, isRestrictedGroupRule } from '../src/common/access'

describe('generic child widget access', () => {
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
