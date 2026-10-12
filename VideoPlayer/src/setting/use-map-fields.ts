import { React } from 'jimu-core'
import { type JimuMapView } from 'jimu-arcgis'
import FeatureLayer from 'esri/layers/FeatureLayer'
import { type IMConfig } from '../config'
import { featureServiceLayerUrl, layerAddress } from '../runtime/video-service'

export function useMapFields (mapView: JimuMapView, config: IMConfig) {
  const [layers, setLayers] = React.useState<__esri.FeatureLayer[]>([])
  const [relationships, setRelationships] = React.useState<__esri.Relationship[]>([])
  const [fields, setFields] = React.useState<__esri.Field[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [revision, setRevision] = React.useState(0)

  React.useEffect(() => {
    setLayers([])
    if (!mapView) return
    let disposed = false
    let handle: __esri.Handle
    void mapView.whenJimuMapViewLoaded().then(() => {
      if (disposed) return
      const collection = mapView.view.map.allLayers
      const refresh = () => {
        setLayers(collection.toArray().filter((layer): layer is __esri.FeatureLayer => layer.type === 'feature' && Boolean((layer as __esri.FeatureLayer).url)))
      }
      refresh()
      handle = collection.on('change', refresh)
    }).catch(() => { if (!disposed) setError('Unable to read the connected map. Check the Map widget.') })
    return () => { disposed = true; handle?.remove() }
  }, [mapView])

  const selectedLayer = layers.find(layer => layerAddress(featureServiceLayerUrl(layer)) === layerAddress(config.featureLayerUrl || ''))
  React.useEffect(() => {
    setFields([])
    setRelationships([])
    setError('')
    setLoading(Boolean(selectedLayer))
    if (!selectedLayer) return
    const request = new AbortController()
    let ownedTable: FeatureLayer
    void (async () => {
      await selectedLayer.load(request.signal)
      if (request.signal.aborted) return
      const related = selectedLayer.relationships?.filter(relationship => relationship.role === 'origin') || []
      setRelationships(related)
      let source: __esri.FeatureLayer = selectedLayer
      if (config.sourceMode === 'related') {
        const relationship = related.find(item => item.id === config.relationshipId)
        if (!relationship) return
        const tableUrl = featureServiceLayerUrl(selectedLayer).replace(/\/\d+\/?$/, `/${relationship.relatedTableId}`)
        source = mapView.view.map.tables.find(table => table.type === 'feature' && layerAddress(featureServiceLayerUrl(table as __esri.FeatureLayer)) === layerAddress(tableUrl)) as __esri.FeatureLayer
        if (!source) source = ownedTable = new FeatureLayer({ url: tableUrl })
        await source.load(request.signal)
      }
      if (!request.signal.aborted) setFields(source.fields.filter(field => field.type === 'string'))
    })().catch(() => {
      if (!request.signal.aborted) setError('Unable to read layer or table fields. Check your portal sign-in and the published service.')
    }).finally(() => { if (!request.signal.aborted) setLoading(false) })
    return () => { request.abort(); ownedTable?.destroy() }
  }, [selectedLayer, mapView, config.sourceMode, config.relationshipId, revision])

  return { layers, fields, relationships, loading, error, retry: () => { setRevision(value => value + 1) } }
}
