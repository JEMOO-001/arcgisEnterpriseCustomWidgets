import { Immutable } from 'jimu-core'
import { renderHook, waitFor } from '@testing-library/react'
import { useControlledWidgets } from '../../../../dist/widgets/common/controller/src/runtime/common/layout-utils'
import { usePermittedWidgets } from '../src/runtime/use-permitted-widgets'
import { loadCurrentUserGroupIds } from '../../edit01/src/common/permission'

let mockState: any

jest.mock('jimu-core', () => {
  const actual = jest.requireActual<any>('jimu-core')
  return {
    ...actual,
    ReactRedux: { ...actual.ReactRedux, useSelector: (selector) => selector(mockState) }
  }
})
jest.mock('../../../../dist/widgets/common/controller/src/runtime/common/layout-utils', () => ({
  useControlledWidgets: jest.fn()
}))
jest.mock('../../edit01/src/common/permission', () => ({
  ...jest.requireActual<any>('../../edit01/src/common/permission'),
  loadCurrentUserGroupIds: jest.fn()
}))

const editorConfig = Immutable({
  editMode: 'ATTRIBUTE', layersConfig: [], viewsEnabled: true,
  views: [{
    id: 'view1', name: 'Page 1', groups: [{ id: 'shared', title: 'Editors' }],
    memberAccess: 'specific', allowedUsers: [{ username: 'editor1' }],
    editableFields: { layer1: ['field1'] }
  }]
})

const setup = (username: string, extraWidgetProps: any = {}) => {
  mockState = Immutable({
    appContext: { isInBuilder: false }, appRuntimeInfo: { appMode: 'RUN' },
    user: { username, role: 'org_user', privileges: ['features:user:edit'], groups: [{ id: 'shared' }] },
    portalUrl: 'https://portal.example.com',
    appConfig: { widgets: {
      edit: { uri: 'widgets/portal-item-id/', config: editorConfig, ...extraWidgetProps },
      print: { manifest: { name: 'print' }, config: {} }
    } }
  })
  ;(useControlledWidgets as jest.Mock).mockReturnValue(Immutable({
    edit: { isClassLoaded: false }, print: { isClassLoaded: false }
  }))
}

describe('permission controller Edit launcher visibility', () => {
  beforeEach(() => { (loadCurrentUserGroupIds as jest.Mock).mockReset().mockResolvedValue([]) })

  it('hides an unselected group editor before the child manifest is available', () => {
    setup('editor2')
    const { result } = renderHook(() => usePermittedWidgets('controller', 'controller', Immutable({}) as any))
    expect(Object.keys(result.current)).toEqual(['print'])
  })

  it('shows selected editors and hides unselected editors with a Portal-renamed manifest', () => {
    setup('editor1', { manifest: { name: 'portal-item-id' } })
    const { result, rerender } = renderHook(() => usePermittedWidgets('controller', 'controller', Immutable({}) as any))
    expect(Object.keys(result.current)).toEqual(['edit', 'print'])
    setup('editor2', { manifest: { name: 'portal-item-id' } })
    rerender()
    expect(Object.keys(result.current)).toEqual(['print'])
  })

  it('still denies viewers and empty specific-member views', () => {
    setup('editor1')
    mockState = mockState.setIn(['user', 'role'], 'org_viewer')
    const { result, rerender } = renderHook(() => usePermittedWidgets('controller', 'controller', Immutable({}) as any))
    expect(Object.keys(result.current)).toEqual(['print'])
    setup('editor1')
    mockState = mockState.setIn(['appConfig', 'widgets', 'edit', 'config', 'views', 0, 'allowedUsers'], [])
    rerender()
    expect(Object.keys(result.current)).toEqual(['print'])
  })

  it('keeps restricted launchers hidden while group membership is unavailable', async () => {
    setup('editor1')
    mockState = mockState.setIn(['user', 'groups'], undefined)
    let resolveGroups: (ids: string[]) => void
    ;(loadCurrentUserGroupIds as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { resolveGroups = resolve }))
    const { result } = renderHook(() => usePermittedWidgets('controller', 'controller', Immutable({}) as any))
    expect(Object.keys(result.current)).toEqual(['print'])
    resolveGroups(['shared'])
    await waitFor(() => { expect(Object.keys(result.current)).toEqual(['edit', 'print']) })
  })

  it('does not show a child before its saved widget configuration is available', () => {
    setup('editor1')
    mockState = mockState.setIn(['appConfig', 'widgets', 'edit'], undefined)
    const { result } = renderHook(() => usePermittedWidgets('controller', 'controller', Immutable({}) as any))
    expect(Object.keys(result.current)).toEqual(['print'])
  })

  it('preserves all children in Builder editing', () => {
    setup('editor2')
    mockState = mockState.setIn(['appContext', 'isInBuilder'], true).setIn(['appRuntimeInfo', 'appMode'], 'DESIGN')
    const { result } = renderHook(() => usePermittedWidgets('controller', 'controller', Immutable({}) as any))
    expect(Object.keys(result.current)).toEqual(['edit', 'print'])
  })
})
