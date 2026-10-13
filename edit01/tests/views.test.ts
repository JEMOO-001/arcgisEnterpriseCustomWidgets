import { Immutable, getAppStore } from 'jimu-core'
import Widget from '../src/runtime/widget'
import { EditModeType, SnapSettingMode } from '../src/config'
import { hasEffectiveEditAccess } from '../src/common/permission'

jest.mock('jimu-core', () => {
  return {
    ...jest.requireActual<any>('jimu-core')
  }
})

const buildConfig = (views: any[], viewsEnabled: boolean, editMode = EditModeType.Attribute) => {
  return Immutable({
    editMode,
    layersConfig: Immutable([]),
    description: '',
    noDataMessage: '',
    snapSettingMode: SnapSettingMode.Flexible,
    views: Immutable(views),
    viewsEnabled
  })
}

const groupedFields = [
  { jimuName: 'field_a', name: 'field_a', alias: 'A', type: 'string', editAuthority: true, editable: true },
  { jimuName: 'field_b', name: 'field_b', alias: 'B', type: 'string', editAuthority: true, editable: true },
  {
    jimuName: 'group-1',
    name: 'group-1',
    groupKey: 1,
    editAuthority: true,
    editable: true,
    children: [
      { jimuName: 'field_c', name: 'field_c', alias: 'C', type: 'string', editAuthority: true, editable: true }
    ]
  }
]

const createWidget = (config: any, groupIds: string[], ready = true) => {
  const widget: any = new (Widget as any)({ config })
  widget.state = { ...widget.state, currentUserGroupIds: groupIds, currentUserGroupIdsReady: ready }
  return widget
}

describe('views field permissions', () => {
  afterEach(() => { jest.restoreAllMocks() })

  const editor = (username: string) => ({ username, role: 'org_user', privileges: ['features:user:edit'] })
  const namedView = (id: string, username: string, fields: string[]) => ({
    id,
    name: id,
    groups: [{ id: 'g1', title: 'Shared editors' }],
    memberAccess: 'specific',
    allowedUsers: [{ username }],
    editableFields: { layer1: fields }
  })

  it('gives two editors in the same group different fields and controller access on two pages', () => {
    const page1 = buildConfig([namedView('page1', 'editor1', ['field_a', 'field_c'])], true)
    const page2 = buildConfig([namedView('page2', 'editor2', ['field_b'])], true)
    for (const [username, permittedConfig, deniedConfig, expectedFields] of [
      ['editor1', page1, page2, ['field_a', 'field_c']],
      ['editor2', page2, page1, ['field_b']]
    ] as const) {
      const user = editor(username)
      const state = getAppStore().getState().set('user', Immutable(user) as any)
      jest.spyOn(getAppStore(), 'getState').mockReturnValue(state)
      expect(hasEffectiveEditAccess(permittedConfig, user, ['g1'], true, {
        requireAuthenticatedUser: true, allowWhileGroupsLoad: false
      })).toBe(true)
      expect(hasEffectiveEditAccess(deniedConfig, user, ['g1'], true)).toBe(false)
      const permittedFields = createWidget(permittedConfig, ['g1']).applyViewToGroupedFields(groupedFields, 'layer1')
      const names = permittedFields.flatMap(item => item.children ? item.children.map(child => child.jimuName) : [item.jimuName])
      expect(names).toEqual(expectedFields)
      expect(createWidget(deniedConfig, ['g1']).applyViewToGroupedFields(groupedFields, 'layer1')).toEqual([])
      jest.restoreAllMocks()
    }
  })

  it('denies unselected editors and selected users who are no longer group members', () => {
    const config = buildConfig([namedView('v1', 'editor1', ['field_a'])], true)
    expect(hasEffectiveEditAccess(config, editor('editor2'), ['g1'], true)).toBe(false)
    expect(hasEffectiveEditAccess(config, editor('editor1'), ['other-group'], true)).toBe(false)
    expect(hasEffectiveEditAccess(config, { ...editor('editor1'), role: 'org_viewer' }, ['g1'], true)).toBe(false)
    expect(hasEffectiveEditAccess(config, { role: 'org_admin', username: 'unselected-admin' }, ['g1'], true)).toBe(false)
  })

  it('grants no access for an empty specific-member list or unavailable username', () => {
    const view = namedView('v1', 'editor1', ['field_a'])
    const empty = buildConfig([{ ...view, allowedUsers: [] }], true)
    expect(hasEffectiveEditAccess(empty, editor('editor1'), ['g1'], true)).toBe(false)
    expect(hasEffectiveEditAccess(buildConfig([view], true), { role: 'org_admin' }, ['g1'], true)).toBe(false)
    expect(hasEffectiveEditAccess(buildConfig([view], true), editor('editor1'), ['g1'], false, {
      allowWhileGroupsLoad: false
    })).toBe(false)
  })

  it('combines only matching user views and legacy all-member views', () => {
    const state = getAppStore().getState().set('user', Immutable(editor('EDITOR1')) as any)
    jest.spyOn(getAppStore(), 'getState').mockReturnValue(state)
    const views = [
      namedView('v1', 'editor1', ['field_a']),
      namedView('v2', 'editor2', ['field_b']),
      { id: 'legacy', name: 'Legacy', groups: [{ id: 'g1', title: 'Shared editors' }], editableFields: { layer1: ['field_c'] } }
    ]
    const result = createWidget(buildConfig(views, true), ['g1']).applyViewToGroupedFields(groupedFields, 'layer1')
    expect(result.map(item => item.jimuName)).toEqual(['field_a', 'group-1'])
    expect(result[1].children[0].jimuName).toBe('field_c')
  })

  it('keeps selected users when switching back to all members without restricting the group', () => {
    const view = { ...namedView('v1', 'editor1', ['field_a']), memberAccess: 'all' }
    expect(hasEffectiveEditAccess(buildConfig([view], true), editor('editor2'), ['g1'], true)).toBe(true)
  })

  it('keeps original editAuthority when views are disabled (legacy behavior)', () => {
    const widget = createWidget(buildConfig([], false), ['g1'])
    const result = widget.applyViewToGroupedFields(groupedFields, 'layer1')
    expect(result[0].editAuthority).toBe(true)
    expect(result[1].editAuthority).toBe(true)
    expect(result[2].children[0].editAuthority).toBe(true)
  })

  it('shows only the fields listed in the matching view (others are hidden)', () => {
    const views = [{ id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a', 'field_c'] } }]
    const widget = createWidget(buildConfig(views, true), ['g1'])
    const result = widget.applyViewToGroupedFields(groupedFields, 'layer1')
    expect(result.length).toBe(2)
    expect(result[0].jimuName).toBe('field_a')
    expect(result[1].children[0].jimuName).toBe('field_c')
  })

  it('shows the union of fields when a user matches multiple views', () => {
    const views = [
      { id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a'] } },
      { id: 'v2', name: 'V2', groups: [{ id: 'g2', title: 'G2' }], editableFields: { layer1: ['field_b'] } }
    ]
    const widget = createWidget(buildConfig(views, true), ['g1', 'g2'])
    const result = widget.applyViewToGroupedFields(groupedFields, 'layer1')
    expect(result.length).toBe(2)
    expect(result[0].jimuName).toBe('field_a')
    expect(result[1].jimuName).toBe('field_b')
  })

  it('hides all fields when the user matches no view', () => {
    const views = [{ id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a'] } }]
    const widget = createWidget(buildConfig(views, true), ['g9'])
    const result = widget.applyViewToGroupedFields(groupedFields, 'layer1')
    expect(result.length).toBe(0)
  })

  it('does not apply views in geometry edit mode and never shows the resolving loader there', () => {
    const views = [{ id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a'] } }]
    const widget = createWidget(buildConfig(views, true, EditModeType.Geometry), ['g9'], false)
    expect(widget.isViewsRestricted()).toBe(false)
    expect(widget.isViewsLoading()).toBe(false)
    const result = widget.applyViewToGroupedFields(groupedFields, 'layer1')
    expect(result[1].editAuthority).toBe(true)
  })

  it('reports loading until group membership resolves in attribute mode', () => {
    const views = [{ id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a'] } }]
    const resolving = createWidget(buildConfig(views, true), [], false)
    expect(resolving.isViewsLoading()).toBe(true)
    const resolved = createWidget(buildConfig(views, true), ['g1'], true)
    expect(resolved.isViewsLoading()).toBe(false)
  })

  it('denies edit access when user has no matching view with fields', () => {
    const views = [{ id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a'] } }]
    const unassigned = createWidget(buildConfig(views, true), ['g9'], true)
    expect(unassigned.hasUserEditAccess()).toBe(false)

    const assigned = createWidget(buildConfig(views, true), ['g1'], true)
    expect(assigned.hasUserEditAccess()).toBe(true)
  })

  it('lets the controller fail closed while group membership is resolving', () => {
    const views = [{ id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a'] } }]
    const config = buildConfig(views, true)

    expect(hasEffectiveEditAccess(config, { role: 'org_user' }, [], false, {
      allowWhileGroupsLoad: false
    })).toBe(false)
  })

  it('denies viewer roles even when their group has editable fields', () => {
    const views = [{ id: 'v1', name: 'V1', groups: [{ id: 'g1', title: 'G1' }], editableFields: { layer1: ['field_a'] } }]
    const config = buildConfig(views, true)

    expect(hasEffectiveEditAccess(config, { role: 'org_viewer' }, ['g1'], true)).toBe(false)
  })

  it('denies users whose portal profile does not grant feature editing', () => {
    const config = buildConfig([], false)
    expect(hasEffectiveEditAccess(config, { role: 'org_user', privileges: [] }, [], true)).toBe(false)
    expect(hasEffectiveEditAccess(config, { role: 'org_user' }, [], true)).toBe(false)
    expect(hasEffectiveEditAccess(config, {
      role: 'org_user',
      privileges: ['features:user:edit']
    }, [], true)).toBe(true)
    expect(hasEffectiveEditAccess(config, { role: 'org_admin' }, [], true)).toBe(true)
    expect(hasEffectiveEditAccess(config, { role: 'org_publisher' }, [], true)).toBe(true)
  })

  it('denies anonymous users while portal identity is unavailable', () => {
    expect(hasEffectiveEditAccess(buildConfig([], false), undefined, [], true, {
      requireAuthenticatedUser: true
    })).toBe(false)
  })
})
