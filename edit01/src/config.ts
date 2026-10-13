import {
  type ImmutableObject,
  type IMUseDataSource,
  type ImmutableArray,
  type IMFieldSchema
} from 'jimu-core'

export enum EditModeType {
  Attribute = 'ATTRIBUTE',
  Geometry = 'GEOMETRY'
}

export enum LayerHonorModeType {
  Webmap = 'WEBMAP',
  Custom = 'CUSTOM'
}

export enum SparkChangedType {
  Added = 'Added',
  Updated = 'Updated',
  Deleted = 'Deleted'
}

export enum ImportHintType {
  NoMap = 'NOMAP',
  NoLayer = 'NOEDITABLE'
}

export enum SnapSettingMode {
  Prescriptive = 'PRESCRIPTIVE',
  Flexible = 'FLEXIBLE'
}

export interface TreeFields extends IMFieldSchema {
  children?: TreeFields[]
  groupKey?: number
  editAuthority?: boolean
  subDescription?: string
  editable?: boolean
}

export interface LayersConfig {
  id: string
  name: string
  layerId?: string
  useDataSource: IMUseDataSource
  addRecords?: boolean
  deleteRecords?: boolean
  updateRecords?: boolean
  updateAttributes?: boolean
  updateGeometries?: boolean
  featureSnapping?: boolean
  showFields: IMFieldSchema[]
  groupedFields: TreeFields[]
  layerHonorMode: LayerHonorModeType
  layerEditingEnabled?: boolean
  isTable?: boolean
}

export interface ViewGroupInfo {
  id: string
  title: string
  // Store the portal thumbnail file name, never the authenticated URL/token.
  thumbnail?: string
  // Backward compatibility for configurations created before thumbnail was token-safe.
  thumbnailUrl?: string
}

export interface ViewConfig {
  id: string
  name: string
  // portal groups whose members get this view; user in none of these views => no edit rights
  groups: ViewGroupInfo[]
  // Missing mode keeps existing views available to all selected group members.
  memberAccess?: 'all' | 'specific'
  allowedUsers?: ViewUserInfo[]
  // per layer id (LayersConfig.id), list of field jimuName the view members may edit
  editableFields: { [layerId: string]: string[] }
}

export interface ViewUserInfo {
  username: string
  fullName?: string
}

export interface Config {
  layersConfig?: ImmutableArray<LayersConfig>
  editMode: EditModeType
  selfSnapping?: boolean
  featureSnapping?: boolean
  defaultSelfEnabled?: boolean
  defaultFeatureEnabled?: boolean
  defaultSnapLayers?: string[]
  description: string
  noDataMessage: string
  snapSettingMode: SnapSettingMode
  tooltip?: boolean
  templateFilter?: boolean
  relatedRecords?: boolean
  liveDataEditing?: boolean
  // multi-view, group-based field-level edit permission. Empty/undefined = legacy behavior (no view restriction)
  views?: ImmutableArray<ViewConfig>
  viewsEnabled?: boolean
}

export type IMConfig = ImmutableObject<Config>
