import type FeatureLayer from 'esri/layers/FeatureLayer'
import { type Config } from '../config'
import { videoRecords, type VideoRecord } from './video-service'

export function sourceFields (config: Config): string[] {
  return config.titleField ? [config.fileNameField, config.titleField] : [config.fileNameField]
}

function verifyFields (fields: __esri.Field[], config: Config): void {
  const missing = sourceFields(config).filter(name => !fields.some(field => field.name === name))
  if (missing.length) throw new Error(`Video field not found: ${missing.join(', ')}. Check the widget settings.`)
}

interface VideoLookup {
  layer: FeatureLayer
  objectId: number
  config: Config
  signal: AbortSignal
}

async function directVideos ({ layer, objectId, config, signal }: VideoLookup): Promise<VideoRecord[]> {
  verifyFields(layer.fields, config)
  const features = await layer.queryFeatures({ objectIds: [objectId], outFields: sourceFields(config), returnGeometry: false }, { signal })
  return videoRecords(features.features.map(feature => feature.attributes), config)
}

async function relatedVideos ({ layer, objectId, config, signal }: VideoLookup): Promise<VideoRecord[]> {
  const relationship = layer.relationships.find(candidate => candidate.id === config.relationshipId)
  if (!relationship || relationship.role !== 'origin') throw new Error('The configured relationship is not an origin relationship on this feature layer.')
  const groups = await layer.queryRelatedFeatures({
    objectIds: [objectId],
    relationshipId: config.relationshipId,
    outFields: sourceFields(config),
    returnGeometry: false
  }, { signal }) as { [objectId: string]: __esri.FeatureSet }
  const related = groups[String(objectId)]
  if (!related) return []
  if (related.exceededTransferLimit) throw new Error('The service returned an incomplete video list. Increase its related-record limit before playing videos.')
  if (related.fields?.length) verifyFields(related.fields, config)
  return videoRecords(related.features.map(feature => feature.attributes), config)
}

export async function lookupVideos (request: VideoLookup): Promise<VideoRecord[]> {
  await request.layer.load(request.signal)
  return request.config.sourceMode === 'direct' ? await directVideos(request) : await relatedVideos(request)
}
