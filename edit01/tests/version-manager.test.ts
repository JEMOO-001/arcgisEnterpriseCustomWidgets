import { Immutable, DataSourceManager } from 'jimu-core'
import { versionManager } from '../src/version-manager'
import { LayerHonorModeType } from '../src/config'

let upgrader = null

jest.mock('jimu-core', () => {
  return {
    ...jest.requireActual<any>('jimu-core')
  }
})

describe('Test Edit version-manager for version 1.7.0', () => {
  let mockFn = null
  beforeAll(() => {
    upgrader = versionManager.versions?.filter(function (version) {
      return version.version === '1.7.0'
    })[0]?.upgrader
    mockFn = jest.fn().mockImplementation(async useDataSource => {
      return await Promise.resolve({
        getLayerDefinition: () => ({
          fields: {
            field1: {
              name: 'field1',
              alias: 'Field1',
              editable: false
            },
            field2: {
              name: 'field2',
              alias: 'Field2',
              editable: true
            }
          }
        })
      })
    })
    DataSourceManager.getInstance().createDataSourceByUseDataSource = mockFn
  })

  it('should return new config', async () => {
    const oldConfig = Immutable({
      description: '',
      editMode: 'ATTRIBUTE',
      layersConfig: [{
        id: 'dataSource_1-allFields_5838',
        layerId: 'allFields_5838',
        name: 'allFields',
        addRecords: false,
        deleteRecords: false,
        featureSnapping: false,
        updateGeometries: true,
        groupedFields: [],
        showFields: [],
        useDataSource: {
          dataSourceId: 'dataSource_1-allFields_5838',
          mainDataSourceId: 'dataSource_1-allFields_5838',
          rootDataSourceId: 'dataSource_1'
        }
      }],
      noDataMessage: ''
    })
    const newConfig = await upgrader(oldConfig)
    expect(newConfig.layersConfig[0].layerHonorMode).toBe(LayerHonorModeType.Custom)
  })
})

describe('Test Edit version-manager for version 1.15.1', () => {
  beforeAll(() => {
    upgrader = versionManager.versions?.filter(function (version) {
      return version.version === '1.15.1'
    })[0]?.upgrader
  })

  it('should add views defaults when keys are missing', async () => {
    const oldConfig = Immutable({
      editMode: 'ATTRIBUTE',
      layersConfig: []
    })
    const newConfig = await upgrader(oldConfig)
    expect(newConfig.viewsEnabled).toBe(false)
    expect(newConfig.views.length).toBe(0)
  })

  it('should not override an existing views config', async () => {
    const existingViews = [{ id: 'view_1', name: 'View 1', groups: [{ id: 'g1', title: 'Group 1' }], editableFields: {} }]
    const oldConfig = Immutable({
      editMode: 'ATTRIBUTE',
      layersConfig: [],
      views: existingViews,
      viewsEnabled: true
    })
    const newConfig = await upgrader(oldConfig)
    expect(newConfig.viewsEnabled).toBe(true)
    expect(newConfig.views.length).toBe(1)
    expect(newConfig.views[0].id).toBe('view_1')
  })
})

describe('Test Edit version-manager for version 1.15.2', () => {
  beforeAll(() => {
    upgrader = versionManager.versions?.filter(function (version) {
      return version.version === '1.15.2'
    })[0]?.upgrader
  })

  it('removes access tokens from persisted group thumbnail URLs', async () => {
    const oldConfig = Immutable({
      editMode: 'ATTRIBUTE',
      layersConfig: [],
      views: [{
        id: 'view_1',
        name: 'View 1',
        groups: [{
          id: 'group_1',
          title: 'Editors',
          thumbnailUrl: 'https://example.com/sharing/rest/community/groups/group_1/info/editors.png?token=secret'
        }],
        editableFields: {}
      }]
    })
    const newConfig = await upgrader(oldConfig)
    expect(newConfig.views[0].groups[0].thumbnail).toBe('editors.png')
    expect(newConfig.views[0].groups[0].thumbnailUrl).toBeUndefined()
    expect(JSON.stringify(newConfig)).not.toContain('secret')
  })
})
