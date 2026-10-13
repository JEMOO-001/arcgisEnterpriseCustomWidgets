import { getAppStore, DataSourceTypes, DataSourceManager, type DataSource, SupportedJSAPILayerTypes } from 'jimu-core'
import { type MapDataSourceImpl } from 'jimu-arcgis/arcgis-data-source'

function checkParentDataSourceIsMapImageOrTable (dataSource: DataSource): boolean {
  const recursionCheckIsMapImage = (featureDataSource) => {
    let isImageOrTable = false
    const parentDataSource: any = featureDataSource?.parentDataSource
    const isTable = featureDataSource?.layer?.isTable
    if (parentDataSource?.layer?.type === SupportedJSAPILayerTypes.MapImageLayer || isTable) {
      isImageOrTable = true
    }
    if (!isImageOrTable && parentDataSource) {
      recursionCheckIsMapImage(parentDataSource)
    } else {
      return isImageOrTable
    }
  }
  return recursionCheckIsMapImage(dataSource)
}

export function getMapAllLayersDs (useMapWidgetId: string) {
  let allLayers: DataSource[] = []
  if (!useMapWidgetId) return allLayers
  const isBuilder = window?.jimuConfig?.isBuilder
  const appConfig = isBuilder ? getAppStore().getState()?.appStateInBuilder?.appConfig : getAppStore().getState()?.appConfig
  if (!appConfig) return allLayers
  const mapUseDataSources = appConfig.widgets[useMapWidgetId]?.useDataSources
  if (typeof mapUseDataSources !== 'undefined') {
    const mapUseDataSourcesIds = mapUseDataSources.map(item => item.dataSourceId)
    mapUseDataSourcesIds.forEach(dsId => {
      const currentDs = DataSourceManager.getInstance().getDataSource(dsId)
      const featureDataSources = (currentDs as MapDataSourceImpl)?.getDataSourcesByType(DataSourceTypes.FeatureLayer) || []
      const orientedDataSources = (currentDs as MapDataSourceImpl)?.getDataSourcesByType(DataSourceTypes.OrientedImageryLayer) || []
      const allDataSources = featureDataSources.concat(orientedDataSources)
      if (allDataSources) {
        const useLayers = allDataSources.filter(ds => {
          return !checkParentDataSourceIsMapImageOrTable(ds)
        })
        allLayers = allLayers.concat(useLayers)
      }
    })
  }
  return allLayers
}
