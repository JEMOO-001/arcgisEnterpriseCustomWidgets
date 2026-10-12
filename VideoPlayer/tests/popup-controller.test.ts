import { waitFor } from '@testing-library/react'
import PopupVideoController from '../src/runtime/popup-controller'
import { type Config } from '../src/config'

const defaults = jest.requireActual<Config>('../config.json')
const mockFeatureQuery = jest.fn()
const mockRelatedQuery = jest.fn()
let mockRefresh: () => void
let mockClick: (event: { action: { id: string } }) => void
let mockEventTarget: () => unknown
let mockWatchedValues: () => unknown

jest.mock('esri/core/reactiveUtils', () => ({
  watch: (getter: () => unknown, callback: (selected: unknown) => void) => {
    mockWatchedValues = getter
    mockRefresh = () => { callback(getter()) }
    mockRefresh()
    return { remove: jest.fn() }
  },
  on: (getter: () => unknown, _event: string, callback: typeof mockClick) => {
    mockEventTarget = getter
    mockClick = callback
    return { remove: jest.fn() }
  }
}))

jest.mock('esri/layers/FeatureLayer', () => ({
  __esModule: true,
  default: class {
    fields = [{ name: 'VideoFileName' }]
    relationships = [{ id: 0, role: 'origin' }]
    load = async () => this
    queryFeatures = mockFeatureQuery
    queryRelatedFeatures = mockRelatedQuery
    destroy = jest.fn()
  }
}))

jest.mock('esri/support/actions/ActionButton', () => ({
  __esModule: true,
  default: jest.fn((properties: object) => ({ ...properties }))
}))

jest.mock('esri/core/Collection', () => ({ __esModule: true, default: jest.fn(() => ({ add: jest.fn(), remove: jest.fn() })) }))

function feature (objectId: number) {
  return { layer: { url: 'https://gis.example/FeatureServer/0' }, getObjectId: () => objectId, getEffectivePopupTemplate: () => null }
}

function connection (mode: Config['sourceMode'], popupReady = true) {
  const actions: Array<{ visible: boolean }> = []
  const collection = { add: (action: { visible: boolean }) => { actions.push(action) }, remove: (action: { visible: boolean }) => { const index = actions.indexOf(action); if (index >= 0) actions.splice(index, 1) } }
  const popup = {
    selectedFeature: feature(1),
    visible: true,
    actions: popupReady ? collection : undefined,
    on: popupReady ? jest.fn() : undefined
  }
  const onSelection = jest.fn()
  const onPlay = jest.fn()
  const controller = new PopupVideoController({
    view: { popup } as unknown as __esri.MapView,
    config: { ...defaults, sourceMode: mode, relationshipId: 0, featureLayerUrl: 'https://gis.example/FeatureServer/0' },
    actionId: 'play-video',
    actionTitle: 'Play Video',
    onSelection,
    onReset: jest.fn(),
    onPlay
  })
  return { actions, collection, popup, controller, onSelection, onPlay }
}

test('a lazy popup is ignored until its action collection is created, then the Play Video action works', async () => {
  mockFeatureQuery.mockResolvedValue({ features: [{ attributes: { VideoFileName: 'gis/a.mp4' } }] })
  const connected = connection('direct', false)
  expect(connected.actions).toHaveLength(0)
  expect(mockFeatureQuery).not.toHaveBeenCalled()
  expect(mockEventTarget()).toBeNull()
  expect(connected.onSelection).toHaveBeenLastCalledWith({ status: 'idle', videos: [] })
  connected.popup.actions = connected.collection
  connected.popup.on = jest.fn()
  expect(mockWatchedValues()).toContain(connected.collection)
  mockRefresh()
  await waitFor(() => { expect(connected.actions[0].visible).toBe(true) })
  expect(mockEventTarget()).toBe(connected.popup)
  mockClick({ action: { id: 'play-video' } })
  expect(connected.onPlay).toHaveBeenCalledWith([{ fileName: 'gis/a.mp4', title: 'a.mp4' }])
  connected.controller.destroy()
  expect(connected.actions).toHaveLength(0)
})

test.each(['direct', 'related'] as const)('%s association shows an action only after a nonblank filename is found', async mode => {
  mockFeatureQuery.mockResolvedValue({ features: [{ attributes: { VideoFileName: 'gis/a.mp4' } }] })
  mockRelatedQuery.mockResolvedValue({ 1: { features: [{ attributes: { VideoFileName: 'gis/a.mp4' } }] } })
  const connected = connection(mode)
  expect(connected.actions[0].visible).toBe(false)
  await waitFor(() => { expect(connected.actions[0].visible).toBe(true) })
  mockClick({ action: { id: 'play-video' } })
  expect(connected.onPlay).toHaveBeenCalledWith([{ fileName: 'gis/a.mp4', title: 'a.mp4' }])
  mockFeatureQuery.mockResolvedValue({ features: [{ attributes: { VideoFileName: null } }] })
  mockRelatedQuery.mockResolvedValue({})
  connected.popup.selectedFeature = feature(2)
  mockRefresh()
  expect(connected.actions[0].visible).toBe(false)
  await waitFor(() => { expect(connected.onSelection).toHaveBeenLastCalledWith({ status: 'ready', videos: [] }) })
  connected.controller.destroy()
})

test('late results for a previous popup feature cannot expose its video action or records', async () => {
  let finishPrevious: (response: unknown) => void
  mockFeatureQuery.mockImplementationOnce(() => new Promise(resolve => { finishPrevious = resolve }))
    .mockResolvedValueOnce({ features: [{ attributes: { VideoFileName: 'gis/current.mp4' } }] })
  const connected = connection('direct')
  await waitFor(() => { expect(finishPrevious).toBeDefined() })
  connected.popup.selectedFeature = feature(2)
  mockRefresh()
  await waitFor(() => { expect(connected.onSelection).toHaveBeenLastCalledWith({ status: 'ready', videos: [{ fileName: 'gis/current.mp4', title: 'current.mp4' }] }) })
  finishPrevious({ features: [{ attributes: { VideoFileName: 'gis/previous.mp4' } }] })
  await new Promise(resolve => { setTimeout(resolve, 0) })
  mockClick({ action: { id: 'play-video' } })
  expect(connected.onPlay).toHaveBeenCalledWith([{ fileName: 'gis/current.mp4', title: 'current.mp4' }])
  connected.controller.destroy()
})

test('a failed lookup hides the action and displays an error rather than reporting no videos', async () => {
  mockRelatedQuery.mockRejectedValue(new Error('Layer unavailable'))
  const connected = connection('related')
  await waitFor(() => { expect(connected.onSelection).toHaveBeenLastCalledWith({ status: 'error', videos: [], message: 'Layer unavailable' }) })
  expect(connected.actions[0].visible).toBe(false)
  connected.controller.destroy()
})
