import { BaseVersionManager, DataSourceManager, type FeatureLayerDataSource, Immutable, type ImmutableArray, SupportedLayerServiceTypes } from 'jimu-core'
import { EditModeType, LayerHonorModeType, SnapSettingMode } from './config'
import { INVISIBLE_FIELD } from './setting/setting-const'

class VersionManager extends BaseVersionManager {
  versions = [{
    version: '1.7.0',
    description: 'Add layerHonorMode to config for support smart form.',
    upgrader: async (oldConfig) => {
      let newConfig = oldConfig
      const decoupleNested = (groupSubItems, fieldsConfig) => {
        const unnestedFields = []
        const recursion = (subItems) => {
          subItems.forEach(item => {
            if (item.groupKey) {
              recursion(item.children)
            } else {
              const subOrgField = fieldsConfig.find(config => config.name === item.jimuName)
              if (!INVISIBLE_FIELD.includes(item.jimuName)) {
                unnestedFields.push({
                  ...item,
                  editable: subOrgField?.editable,
                  editAuthority: subOrgField?.editable ? item?.editAuthority : false
                })
              }
            }
          })
          return unnestedFields
        }
        return recursion(groupSubItems)
      }
      return await Promise.all(
        newConfig.layersConfig.map(layerConfig => {
          return new Promise(resolve => {
            DataSourceManager.getInstance().createDataSourceByUseDataSource(layerConfig.useDataSource).then(currentDs => {
              const layerDefinition = (currentDs as FeatureLayerDataSource)?.getLayerDefinition()
              const fieldsConfig = layerDefinition?.fields || []
              const newGroupedFields = layerConfig.groupedFields.map(field => {
                const orgField = fieldsConfig.find(config => config.name === field.jimuName)
                if (field.groupKey) {
                  return {
                    ...field,
                    editable: true,
                    editAuthority: !field?.children?.some(item => item.editAuthority === false),
                    children: decoupleNested(field?.children, fieldsConfig)
                  }
                }
                return {
                  ...field,
                  editable: orgField?.editable,
                  editAuthority: orgField?.editable ? field?.editAuthority : false
                }
              }).filter(
                item => !INVISIBLE_FIELD.includes(item.jimuName)
              )
              resolve(newGroupedFields)
            })
          })
        })
      ).then(res => {
        res.forEach((resItem: ImmutableArray<any>, i) => {
          const selectedFields = newConfig.layersConfig[i].showFields.filter(
            item => !INVISIBLE_FIELD.includes(item.jimuName)
          )
          let unGroupedFields = []
          const resGroupedFields = resItem.asMutable({ deep: true })
          resItem.forEach(item => {
            if (item.groupKey) {
              unGroupedFields = unGroupedFields.concat(item.children)
            } else {
              unGroupedFields.push(item)
            }
          })
          selectedFields.forEach(ele => {
            if (!unGroupedFields.find(field => field.jimuName === ele.jimuName)) {
              resGroupedFields.push(ele)
            }
          })
          newConfig = newConfig.setIn(['layersConfig', i, 'groupedFields'], Immutable(resGroupedFields))
          newConfig = newConfig.setIn(['layersConfig', i, 'layerHonorMode'], LayerHonorModeType.Custom)
        })
        return Promise.resolve(newConfig)
      })
    }
  }, {
    version: '1.10.0',
    description: 'Set old app default snapping to true',
    upgrader: async (oldConfig) => {
      let newConfig = oldConfig
      newConfig = newConfig.set('selfSnapping', true).set('featureSnapping', true)
      return newConfig
    }
  }, {
    version: '1.12.0',
    description: 'Set "undefined" option to "false", and remove not editable layer',
    upgrader: async (oldConfig) => {
      let newConfig = oldConfig
      const isGeometryMode = newConfig.editMode === EditModeType.Geometry
      const dsManager = DataSourceManager.getInstance()
      const newLayersConfig = []
      for (const config of newConfig.layersConfig) {
        let dataSource
        try {
          dataSource = await dsManager.createDataSourceByUseDataSource(config?.useDataSource)
        } catch (error) {
          console.error(error)
        }
        if (!dataSource) {
          newLayersConfig.push(config)
          continue
        }
        const layerDefinition = dataSource?.getLayerDefinition()
        const isTable = dataSource?.layer?.isTable || layerDefinition?.type === SupportedLayerServiceTypes.Table
        if (isGeometryMode && isTable) continue
        const allowGeometryUpdates = layerDefinition?.allowGeometryUpdates
        const layerEditingEnabled = dataSource?.layer?.editingEnabled ?? true
        if (layerEditingEnabled) {
          let newLayerConfig
          if (config.updateGeometries) {
            newLayerConfig = {
              ...config,
              updateRecords: true,
              updateAttributes: true,
              updateGeometries: allowGeometryUpdates && true
            }
          } else {
            newLayerConfig = {
              ...config,
              updateRecords: false,
              updateAttributes: false,
              updateGeometries: false

            }
          }
          newLayersConfig.push(newLayerConfig)
        }
      }
      newConfig = newConfig.setIn(['layersConfig'], newLayersConfig)
      return newConfig
    }
  }, {
    version: '1.13.0',
    description: 'Update snap options',
    upgrader: async (oldConfig) => {
      let newConfig = oldConfig
      if (newConfig.selfSnapping) {
        newConfig = newConfig.set('defaultSelfEnabled', true)
      }
      if (newConfig.featureSnapping) {
        newConfig = newConfig.set('defaultFeatureEnabled', true)
      }
      return newConfig
    }
  }, {
    version: '1.14.0',
    description: 'Add predefine snapping options',
    upgrader: async (oldConfig) => {
      let newConfig = oldConfig
      newConfig = newConfig.set('snapSettingMode', SnapSettingMode.Flexible)
      return newConfig
    }
  }, {
    version: '1.15.0',
    description: 'Add general setting options',
    upgrader: async (oldConfig) => {
      let newConfig = oldConfig
      newConfig = newConfig.set('tooltip', true).set('templateFilter', true).set('relatedRecords', true)
      return newConfig
    }
  }, {
    version: '1.15.1',
    description: 'Add views config for group-based field-level edit permissions',
    upgrader: async (oldConfig) => {
      let newConfig = oldConfig
      // only set defaults when the keys are missing; do not override an existing views config
      if (newConfig.views === undefined) {
        newConfig = newConfig.set('views', Immutable([]))
      }
      if (newConfig.viewsEnabled === undefined) {
        newConfig = newConfig.set('viewsEnabled', false)
      }
      return newConfig
    }
  }, {
    version: '1.15.2',
    description: 'Store group thumbnails without portal access tokens',
    upgrader: async (oldConfig) => {
      if (!oldConfig.views) return oldConfig
      const views = oldConfig.views.asMutable
        ? oldConfig.views.asMutable({ deep: true })
        : oldConfig.views
      const safeViews = views.map(view => ({
        ...view,
        groups: (view.groups || []).map(group => {
          const legacyUrl = group.thumbnailUrl || ''
          const infoPath = legacyUrl.split('?')[0].split('/info/')[1] || ''
          let legacyThumbnail = ''
          try {
            legacyThumbnail = decodeURIComponent(infoPath.split('/').pop() || '')
          } catch {
            legacyThumbnail = ''
          }
          const safeGroup = { ...group }
          delete safeGroup.thumbnailUrl
          const thumbnail = group.thumbnail || legacyThumbnail
          return thumbnail ? { ...safeGroup, thumbnail } : safeGroup
        })
      }))
      return oldConfig.set('views', Immutable(safeViews))
    }
  }]
}

export const versionManager = new VersionManager()
