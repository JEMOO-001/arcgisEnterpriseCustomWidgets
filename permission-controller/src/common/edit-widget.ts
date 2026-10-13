import { EditModeType } from '../../../edit01/src/config'

interface WidgetIdentity {
  manifest?: { name?: string }
  _originManifest?: { name?: string }
  uri?: string
  config?: {
    editMode?: EditModeType
    layersConfig?: unknown
    views?: unknown
    viewsEnabled?: boolean
  }
}

export const isPermissionManagedEditWidget = (widget?: WidgetIdentity): boolean => {
  if (!widget) return false
  if (widget.manifest?.name === 'edit01' || widget._originManifest?.name === 'edit01') return true
  const folder = widget.uri?.split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop()
  if (folder === 'edit01') return true

  // A Portal widget's runtime manifest may be unavailable or have a different
  // name. Its persisted Edit permission configuration is available beforehand.
  const config = widget.config
  return (config?.editMode === EditModeType.Attribute || config?.editMode === EditModeType.Geometry) &&
    Array.isArray(config.layersConfig) && Array.isArray(config.views) &&
    typeof config.viewsEnabled === 'boolean'
}
