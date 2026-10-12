import FeatureLayer from 'esri/layers/FeatureLayer'
import ActionButton from 'esri/support/actions/ActionButton'
import Collection from 'esri/core/Collection'
import * as reactiveUtils from 'esri/core/reactiveUtils'
import { type Config } from '../config'
import { featureServiceLayerUrl, layerAddress, type VideoRecord } from './video-service'
import { lookupVideos } from './video-source'

export type VideoSelection =
  | { status: 'idle' | 'loading', videos: VideoRecord[] }
  | { status: 'ready', videos: VideoRecord[] }
  | { status: 'error', videos: VideoRecord[], message: string }

interface PopupConnection {
  view: __esri.MapView | __esri.SceneView
  config: Config
  actionId: string
  actionTitle: string
  onSelection: (selection: VideoSelection) => void
  onReset: () => void
  onPlay: (videos: VideoRecord[]) => void
}

export default class PopupVideoController {
  private readonly layer: FeatureLayer
  private readonly action: ActionButton
  private readonly handles: __esri.Handle[] = []
  private actionCollection: __esri.Collection<__esri.ActionButton | __esri.ActionToggle>
  private abortLookup: AbortController
  private generation = 0
  private videos: VideoRecord[] = []
  private selectedFeature: __esri.Graphic

  constructor (private readonly connection: PopupConnection) {
    this.layer = new FeatureLayer({ url: connection.config.featureLayerUrl })
    this.action = new ActionButton({ id: connection.actionId, title: connection.actionTitle, className: 'esri-icon-play', visible: false })
    this.handles.push(reactiveUtils.watch(
      () => [connection.view.popup, connection.view.popup?.selectedFeature, connection.view.popup?.visible, connection.view.popup?.actions] as const,
      ([popup, feature, visible]) => { void this.refresh(popup, visible ? feature : null) }, { initial: true }
    ))
    this.handles.push(reactiveUtils.on(() => typeof connection.view.popup?.on === 'function' ? connection.view.popup : null, 'trigger-action', event => {
      if (event.action.id === connection.actionId && this.action.visible && this.videos.length) connection.onPlay(this.videos)
    }))
  }

  private attachAction (popup: __esri.Popup, feature: __esri.Graphic): boolean {
    this.actionCollection?.remove(this.action)
    this.actionCollection = null
    // The view can initially expose popup options instead of a loaded Popup.
    // Watching actions above lets us retry when its real collection is created.
    if (typeof popup?.actions?.add !== 'function') return false
    const template = feature?.getEffectivePopupTemplate()
    if (template?.overwriteActions && !template.actions) template.actions = new Collection()
    this.actionCollection = template?.overwriteActions ? template.actions : popup.actions
    if (typeof this.actionCollection?.add !== 'function') { this.actionCollection = null; return false }
    this.actionCollection.add(this.action)
    return true
  }

  private matchesLayer (feature: __esri.Graphic): boolean {
    const featureLayer = feature?.layer as __esri.FeatureLayer
    if (!featureLayer?.url) return false
    const address = featureServiceLayerUrl(featureLayer)
    return layerAddress(address) === layerAddress(this.connection.config.featureLayerUrl)
  }

  private async refresh (popup: __esri.Popup, feature: __esri.Graphic): Promise<void> {
    const generation = ++this.generation
    this.abortLookup?.abort()
    this.action.visible = false
    this.videos = []
    this.selectedFeature = feature
    this.connection.onReset()
    if (!this.attachAction(popup, feature)) { this.connection.onSelection({ status: 'idle', videos: [] }); return }
    if (!this.matchesLayer(feature)) { this.connection.onSelection({ status: 'idle', videos: [] }); return }
    const objectId = feature.getObjectId()
    if (objectId == null) { this.connection.onSelection({ status: 'error', videos: [], message: 'The selected feature has no object ID.' }); return }
    this.abortLookup = new AbortController()
    this.connection.onSelection({ status: 'loading', videos: [] })
    await this.loadSelection({ objectId, generation, signal: this.abortLookup.signal })
  }

  private async loadSelection ({ objectId, generation, signal }: { objectId: number, generation: number, signal: AbortSignal }): Promise<void> {
    try {
      const videos = await lookupVideos({ layer: this.layer, objectId, config: this.connection.config, signal })
      if (generation !== this.generation || signal.aborted) return
      this.videos = videos
      this.action.visible = videos.length > 0
      this.connection.onSelection({ status: 'ready', videos })
    } catch (error) {
      if (generation !== this.generation || signal.aborted) return
      this.connection.onSelection({ status: 'error', videos: [], message: error instanceof Error ? error.message : 'Unable to read this feature’s videos. Check the layer and relationship settings.' })
    }
  }

  refreshSelection (): void {
    void this.refresh(this.connection.view.popup, this.connection.view.popup?.visible ? this.selectedFeature : null)
  }

  destroy (): void {
    ++this.generation
    this.abortLookup?.abort()
    this.handles.forEach(handle => { handle.remove() })
    this.actionCollection?.remove(this.action)
    this.layer.destroy()
  }
}
