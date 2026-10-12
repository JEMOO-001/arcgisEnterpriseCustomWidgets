import { act, renderHook, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { type JimuMapView } from 'jimu-arcgis'
import { type IMConfig, type Config } from '../src/config'
import { useMapFields } from '../src/setting/use-map-fields'

const defaults = jest.requireActual<Config>('../config.json')
const mockTableCreate = jest.fn()
const mockTableDestroy = jest.fn()
const tableFields = [{ name: 'RelatedVideo', alias: 'Related video', type: 'string' }, { name: 'OBJECTID', type: 'oid' }]

jest.mock('jimu-core', () => ({ React: jest.requireActual<typeof React>('react') }))
jest.mock('esri/layers/FeatureLayer', () => ({
  __esModule: true,
  default: class {
    fields = tableFields
    constructor (properties: unknown) { mockTableCreate(properties) }
    load = async () => this
    destroy = mockTableDestroy
  }
}))

function featureLayer (url = 'https://gis.example/FeatureServer/0') {
  return {
    type: 'feature',
    url,
    id: url,
    title: 'Lands',
    layerId: 0,
    fields: [{ name: 'VideoFileName', alias: 'Video filename', type: 'string' }, { name: 'PID', type: 'small-integer' }],
    relationships: [{ id: 2, name: 'Videos', role: 'origin', relatedTableId: 7 }, { id: 3, role: 'destination', relatedTableId: 8 }],
    load: jest.fn().mockResolvedValue(null)
  }
}

function mapConnection (layers: unknown[], tables: unknown[] = []) {
  const remove = jest.fn()
  const map = { allLayers: { toArray: () => layers, on: jest.fn(() => ({ remove })) }, tables: { find: (predicate: (table: unknown) => boolean) => tables.find(predicate) } }
  const mapView = { view: { map }, whenJimuMapViewLoaded: async () => null } as unknown as JimuMapView
  return { mapView, remove }
}

function config (changes: Partial<Config> = {}): IMConfig {
  return { ...defaults, featureLayerUrl: 'https://gis.example/FeatureServer/0', ...changes } as IMConfig
}

test('the connected map supplies feature layers and only text fields for filename/title selection', async () => {
  const layer = featureLayer()
  const map = mapConnection([layer, { type: 'tile' }, { type: 'feature', url: null }])
  const { result, unmount } = renderHook(() => useMapFields(map.mapView, config()))
  await waitFor(() => { expect(result.current.fields.map(field => field.name)).toEqual(['VideoFileName']) })
  expect(result.current.layers).toEqual([layer])
  expect(result.current.relationships.map(relationship => relationship.id)).toEqual([2])
  unmount()
  expect(map.remove).toHaveBeenCalled()
})

test('related mode reads destination-table fields instead of origin feature fields', async () => {
  const map = mapConnection([featureLayer()])
  const { result, unmount } = renderHook(() => useMapFields(map.mapView, config({ sourceMode: 'related', relationshipId: 2 })))
  await waitFor(() => { expect(result.current.fields.map(field => field.name)).toEqual(['RelatedVideo']) })
  expect(mockTableCreate).toHaveBeenCalledWith({ url: 'https://gis.example/FeatureServer/7' })
  unmount()
  expect(mockTableDestroy).toHaveBeenCalled()
})

test('a related table already in the map is reused and is not destroyed by the settings', async () => {
  const table = { ...featureLayer('https://gis.example/FeatureServer/7'), fields: tableFields, destroy: jest.fn() }
  const map = mapConnection([featureLayer()], [table])
  const { result, unmount } = renderHook(() => useMapFields(map.mapView, config({ sourceMode: 'related', relationshipId: 2 })))
  await waitFor(() => { expect(result.current.fields.map(field => field.name)).toEqual(['RelatedVideo']) })
  expect(mockTableCreate).not.toHaveBeenCalled()
  unmount()
  expect(table.destroy).not.toHaveBeenCalled()
})

test('switching layers cancels old metadata reads and cannot restore the previous layer’s fields', async () => {
  let finishOld: () => void
  const previous = featureLayer()
  previous.load.mockImplementation(() => new Promise<void>(resolve => { finishOld = resolve }))
  const current = { ...featureLayer('https://gis.example/FeatureServer/1'), fields: [{ name: 'NewVideo', type: 'string' }] }
  const map = mapConnection([previous, current])
  const { result, rerender } = renderHook(({ settings }) => useMapFields(map.mapView, settings), { initialProps: { settings: config() } })
  await waitFor(() => { expect(finishOld).toBeDefined() })
  rerender({ settings: config({ featureLayerUrl: current.url }) })
  await waitFor(() => { expect(result.current.fields.map(field => field.name)).toEqual(['NewVideo']) })
  await act(async () => { finishOld() })
  expect(result.current.fields.map(field => field.name)).toEqual(['NewVideo'])
  expect(previous.load.mock.calls[0][0].aborted).toBe(true)
})
