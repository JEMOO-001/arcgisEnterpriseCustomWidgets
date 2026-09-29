import { React, type IMState, ReactRedux, lodash, MessageManager, DataRecordsSelectionChangeMessage, type DataSource, hooks, type DataRecord, type ImmutableArray, type QueriableDataSource, type FeatureLayerQueryParams, QueryScope } from 'jimu-core'
import { type SelectionData, SelectionSource, getSplitByField, type WebChartDataItem } from 'jimu-ui/advanced/chart'
import { MapViewManager, zoomToUtils, loadArcGISJSAPIModules } from 'jimu-arcgis'
import { type WebChartSeries, type ComparisonContext } from '../../../config'
import convertDataItemsFromUpperCase from './convert-data-items-from-uppercase'
import { mountPersonYearComparison } from '../components/PersonYearComparison'

const isRecordMatch = (rec1: { [x: string]: any }, rec2: { [x: string]: any }): boolean => {
  return Object.keys(rec2).every(key => rec1[key] === rec2[key])
}

const getNormalizedSelectionItems = (selectionItems: Array<{ [x: string]: any }>, splitByField?: string, inlineFormatedField?: string) => {
  return selectionItems.map((item) => {
    const data = { ...item }
    if (inlineFormatedField) {
      // for inline data chart
      if (inlineFormatedField && typeof data[inlineFormatedField + '_original'] !== 'undefined') {
        delete data[inlineFormatedField + '_original']
      }
    }
    if (typeof data.arcgis_charts_slice_id !== 'undefined') {
      delete data.arcgis_charts_slice_id
    }
    if (typeof data.__outputid__ !== 'undefined') {
      delete data.__outputid__
    }
    if (splitByField) {
      delete data[splitByField]
    }
    if (typeof data.arcgis_charts_type_domain_field_name !== 'undefined') {
      const dominField = data.arcgis_charts_type_domain_field_name
      const dominFieldValue = data.arcgis_charts_type_domain_id_value
      data[dominField] = dominFieldValue
    }
    return data
  })
}

const normalizeRecordData = (input: { [x: string]: any }, inlineFormatedField?: string) => {
  let output = input
  output = { ...input }
  if (inlineFormatedField && typeof output[inlineFormatedField] !== 'string') {
    output[inlineFormatedField] = String(output[inlineFormatedField])
  }
  if (inlineFormatedField && typeof output[inlineFormatedField + '_original'] !== 'undefined') {
    delete output[inlineFormatedField + '_original']
  }
  if (typeof output.__outputid__ !== 'undefined') {
    delete output.__outputid__
  }
  if (typeof output.arcgis_charts_slice_id !== 'undefined') {
    delete output.arcgis_charts_slice_id
  }
  return output
}

/**
 * Match the data in the records based on the selected data. If the selected data completely matches the data in some of the records, return them.
 * Note1: The number of fields in record is different from select item. For example, there is `objectid` in record but not in select item.
 * Note2: There is a potential problem with `no aggregation` in this matching pair. There may be two records whose fields (non-objectid) and values are exactly the same.
 */
const getMatchedRecords = (records: DataRecord[], selectionItems: Array<{ [x: string]: any }>, inlineFormatedField?: string) => {
  return records.filter(record => {
    const data = normalizeRecordData(record.getData(), inlineFormatedField)
    return selectionItems.some(item => {
      return isRecordMatch(data, item)
    })
  })
}

/**
 * Get selection items by the selected id from data source.
 */
const getSelectedItems = (
  selectedIds: string[],
  records: DataRecord[],
  inlineFormatedField?: string
): WebChartDataItem[] => {
  const items = selectedIds.map((id) => {
    const record = records.find((record) => record.getId() === id)
    let data = null
    if (record) {
      data = normalizeRecordData(record.getData(), inlineFormatedField)
      if (typeof data.arcgis_charts_type_domain_field_name !== 'undefined') {
        const dominField = data.arcgis_charts_type_domain_field_name
        const dominFieldLabel = data.arcgis_charts_type_domain_id_label
        data[dominField] = dominFieldLabel
      }
    }
    return data
  }).filter((item) => !!item)
  return items
}

/**
 * Discovers all active JimuMapView instances across window, app iframe, and MapViewManager.
 */
export const getTargetJimuMapViews = (): any[] => {
  const managers: any[] = []

  // 1. Try MapViewManager.getInstance()
  try {
    if (typeof MapViewManager !== 'undefined' && MapViewManager?.getInstance) {
      const inst = MapViewManager.getInstance()
      if (inst && !managers.includes(inst)) managers.push(inst)
    }
  } catch (e) {}

  // 2. Try window globals used by ArcGIS Experience Builder
  if (typeof window !== 'undefined') {
    const win = window as any
    if (win._mapViewManager && !managers.includes(win._mapViewManager)) managers.push(win._mapViewManager)
    if (win._appWindow?._mapViewManager && !managers.includes(win._appWindow._mapViewManager)) managers.push(win._appWindow._mapViewManager)
    try {
      if (win.parent?._mapViewManager && !managers.includes(win.parent._mapViewManager)) managers.push(win.parent._mapViewManager)
    } catch (e) {}
    try {
      if (win.top?._mapViewManager && !managers.includes(win.top._mapViewManager)) managers.push(win.top._mapViewManager)
    } catch (e) {}
  }

  const views: any[] = []

  managers.forEach(m => {
    // A. Use official getAllJimuMapViews() method
    if (typeof m.getAllJimuMapViews === 'function') {
      try {
        const all = m.getAllJimuMapViews() || []
        all.forEach((v: any) => {
          if (v && !views.includes(v)) views.push(v)
        })
      } catch (e) {}
    }

    // B. Inspect jimuMapViewGroups directly
    const groups = m.jimuMapViewGroups || {}
    Object.values(groups).forEach((g: any) => {
      const active = g?.getActiveJimuMapView?.()
      if (active && !views.includes(active)) views.push(active)
      const groupViews = g?.jimuMapViews || {}
      Object.values(groupViews).forEach((v: any) => {
        if (v && !views.includes(v)) views.push(v)
      })
    })
  })

  return views
}

/**
 * Extracts bounding box coordinates and geometries from records.
 */
export const extractExtentFromRecords = (
  records: DataRecord[]
): {
  extent: { xmin: number; ymin: number; xmax: number; ymax: number; spatialReference?: any } | null
  isPoint: boolean
  geometries: any[]
  graphics: any[]
} => {
  const geometries: any[] = []
  const graphics: any[] = []

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let hasCoords = false
  let sr: any = null
  let isAllPoints = true

  const updateBBox = (x: number, y: number) => {
    if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      hasCoords = true
    }
  }

  const inspectGeom = (g: any) => {
    if (!g) return
    if (!sr && g.spatialReference) {
      sr = g.spatialReference
    }
    if (g.type === 'point' || (typeof g.x === 'number' && typeof g.y === 'number')) {
      updateBBox(g.x, g.y)
    } else {
      isAllPoints = false
    }

    if (Array.isArray(g.rings)) {
      isAllPoints = false
      g.rings.forEach((ring: any[]) => {
        if (Array.isArray(ring)) {
          ring.forEach((pt: any[]) => {
            if (Array.isArray(pt) && pt.length >= 2) {
              updateBBox(pt[0], pt[1])
            }
          })
        }
      })
    }

    if (Array.isArray(g.paths)) {
      isAllPoints = false
      g.paths.forEach((path: any[]) => {
        if (Array.isArray(path)) {
          path.forEach((pt: any[]) => {
            if (Array.isArray(pt) && pt.length >= 2) {
              updateBBox(pt[0], pt[1])
            }
          })
        }
      })
    }

    if (g.extent) {
      isAllPoints = false
      updateBBox(g.extent.xmin, g.extent.ymin)
      updateBBox(g.extent.xmax, g.extent.ymax)
    } else if (typeof g.xmin === 'number' && typeof g.ymin === 'number') {
      isAllPoints = false
      updateBBox(g.xmin, g.ymin)
      updateBBox(g.xmax, g.ymax)
    }
  }

  for (const r of records) {
    let feat = (r as any)?.feature
    const geom = (typeof r.getGeometry === 'function' ? r.getGeometry() : (r as any)?.geometry) || feat?.geometry
    const attrs = (typeof r.getData === 'function' ? r.getData() : (r as any)?.attributes) || feat?.attributes || {}

    if (!feat && (geom || attrs)) {
      feat = { attributes: attrs, geometry: geom }
    }

    if (feat) {
      graphics.push(feat)
      if (geom) {
        geometries.push(geom)
        inspectGeom(geom)
      } else if (feat.geometry) {
        geometries.push(feat.geometry)
        inspectGeom(feat.geometry)
      }
    }

    if (typeof (r as any).getRawGeometry === 'function') {
      try {
        const rg = (r as any).getRawGeometry()
        if (rg && !geom) {
          geometries.push(rg)
          inspectGeom(rg)
        }
      } catch (e) {}
    }
  }

  if (hasCoords) {
    const isSinglePoint = minX === maxX && minY === maxY
    return {
      extent: { xmin: minX, ymin: minY, xmax: maxX, ymax: maxY, spatialReference: sr },
      isPoint: isSinglePoint || isAllPoints,
      geometries,
      graphics
    }
  }

  return {
    extent: null,
    isPoint: false,
    geometries,
    graphics
  }
}

// Stores active highlight handles so previous highlights can be cleanly removed
const activeHighlightHandles: Array<{ remove: () => void }> = []

/**
 * Clears any existing highlights, popups, and selections across active map views.
 */
export const clearPreviousMapSelection = (targetViews?: any[]): void => {
  // 1. Remove all active layerView highlight handles
  while (activeHighlightHandles.length > 0) {
    const handle = activeHighlightHandles.pop()
    try {
      handle?.remove?.()
    } catch (e) {}
  }

  // 2. Clear selections and close popups on all active map views
  const views = targetViews || getTargetJimuMapViews()
  views.forEach((jmv: any) => {
    try {
      jmv?.clearSelectedFeatures?.()
    } catch (e) {}
    const view = jmv?.view
    if (view) {
      try {
        view.popup?.close?.()
      } catch (e) {}
      try {
        view.graphics?.removeAll?.()
      } catch (e) {}
    }
  })
}

/**
 * Flashes the provided graphics on the MapView using a bright gold/yellow outline.
 */
const flashGraphicsOnView = (view: any, graphics: any[], GraphicClass?: any): void => {
  if (!view?.graphics || !graphics?.length) return

  const geomType = graphics[0]?.geometry?.type || 'polygon'
  let symbol: any = null

  if (['point', 'multipoint'].includes(geomType)) {
    symbol = {
      type: 'simple-marker',
      style: 'circle',
      color: [255, 255, 0, 0.9],
      size: '20px',
      outline: {
        color: [255, 200, 0, 1],
        width: 3
      }
    }
  } else if (['polyline'].includes(geomType)) {
    symbol = {
      type: 'simple-line',
      color: [255, 255, 0, 0.9],
      width: 4,
      style: 'solid'
    }
  } else {
    symbol = {
      type: 'simple-fill',
      color: [255, 255, 0, 0.65],
      style: 'solid',
      outline: {
        color: [255, 215, 0, 1],
        width: 3
      }
    }
  }

  const flashItems = graphics.map(g => {
    if (GraphicClass) {
      try {
        return new GraphicClass({
          geometry: g.geometry,
          symbol,
          attributes: g.attributes
        })
      } catch (e) {}
    }
    return {
      geometry: g.geometry,
      symbol,
      attributes: g.attributes
    }
  })

  // Flash 3 times (400ms on, 300ms off)
  let flashCount = 0
  const maxFlashes = 3
  const doFlash = () => {
    try {
      view.graphics.addMany(flashItems)
      setTimeout(() => {
        try {
          view.graphics.removeMany(flashItems)
        } catch (e) {}
        flashCount++
        if (flashCount < maxFlashes) {
          setTimeout(doFlash, 300)
        }
      }, 400)
    } catch (e) {}
  }

  doFlash()
}



/**
 * Sets up action trigger, click delegation, and view watchers on a MapView popup.
 * Stores latest originDataSource and comparisonOptions on the view itself so that
 * the popup watchers always use current values — not stale closure captures.
 * This ensures the Compare button appears on EVERY popup: chart click, map click, or list selection.
 */
const COMPARE_ACTION_ID = 'compare-parcels-year-action'

/**
 * Adds the comparison to the pop-up's own action bar, beside Zoom to and Edit.
 *
 * This is the pop-up's public API rather than its private DOM, so the button
 * looks native, sits where people expect it, and is not at the mercy of how Esri
 * happens to render pop-up content in a given release. Returns false when the
 * view exposes no actions collection, in which case the caller falls back to
 * injecting a banner into the body.
 */
export const ensureCompareAction = (view: any): boolean => {
  const actions = view?.popup?.actions
  if (!actions || typeof actions.add !== 'function') return false

  try {
    const has = typeof actions.some === 'function'
      ? actions.some((a: any) => a?.id === COMPARE_ACTION_ID)
      : false
    if (!has) {
      actions.add({
        id: COMPARE_ACTION_ID,
        title: 'مقارنة عبر السنوات',
        className: 'esri-icon-line-chart'
      })
    }
    return true
  } catch (e) {
    return false
  }
}

export const setupPopupComparisonHandler = (
  view: any,
  originDataSource?: DataSource,
  comparisonOptions?: ComparisonContext
): void => {
  if (!view?.popup) return

  // Always update the stored config on the view so watchers use the latest values
  view._pycConfig = { originDataSource, comparisonOptions }
  view._pycActionOk = ensureCompareAction(view)

  // 1. Esri native action listener (always renew handle to ensure latest comparisonOptions)
  if (view.popup._compareActionHandle?.remove) {
    try {
      view.popup._compareActionHandle.remove()
    } catch (e) {}
  }
  try {
    view.popup._compareActionHandle = view.popup.on('trigger-action', (event: any) => {
      if (
        event?.action?.id === 'compare-parcels-year-action' ||
        String(event?.action?.id || '').includes('compare') ||
        String(event?.action?.title || '').includes('مقارنة')
      ) {
        const cfg = view._pycConfig || {}
        const feature = view.popup.selectedFeature || view.popup.features?.[0]
        openComparisonPopup(view, feature, cfg.originDataSource, cfg.comparisonOptions)
      }
    })
  } catch (e) {}

  // 2. Global click delegation across all documents (captures clicks across the app and iframes)
  const win = window as any
  const targetDocs: Document[] = []
  if (typeof document !== 'undefined') targetDocs.push(document)
  if (view?.container?.ownerDocument && !targetDocs.includes(view.container.ownerDocument)) {
    targetDocs.push(view.container.ownerDocument)
  }
  if (view?.popup?.container?.ownerDocument && !targetDocs.includes(view.popup.container.ownerDocument)) {
    targetDocs.push(view.popup.container.ownerDocument)
  }
  try {
    if (win.top?.document && !targetDocs.includes(win.top.document)) targetDocs.push(win.top.document)
  } catch (e) {}
  try {
    if (win.parent?.document && !targetDocs.includes(win.parent.document)) targetDocs.push(win.parent.document)
  } catch (e) {}

  if (win._pycGlobalClickHandler) {
    targetDocs.forEach(d => {
      try {
        d.removeEventListener('click', win._pycGlobalClickHandler, true)
      } catch (e) {}
    })
  }

  let lastGlobalClickTrigger = 0
  const handleGlobalClick = (e: MouseEvent) => {
    const path = (typeof e.composedPath === 'function') ? e.composedPath() : []
    let target = (e.target as HTMLElement)?.closest?.(
      '.pyc-trigger-btn, [data-comparison-trigger="true"], [data-action-id="compare-parcels-year-action"], .esri-popup__action, calcite-action'
    ) as HTMLElement | null

    if (!target && path.length) {
      for (const el of path) {
        if (el instanceof HTMLElement) {
          if (
            el.classList?.contains('pyc-trigger-btn') ||
            el.getAttribute?.('data-comparison-trigger') === 'true' ||
            el.getAttribute?.('data-action-id') === 'compare-parcels-year-action' ||
            el.classList?.contains('esri-popup__action') ||
            el.tagName?.toLowerCase() === 'calcite-action'
          ) {
            target = el
            break
          }
        }
      }
    }

    if (!target) return

    const text = (target.textContent || '').trim().toLowerCase()
    const title = (target.getAttribute('title') || '').toLowerCase()
    const id = (target.getAttribute('id') || target.getAttribute('data-action-id') || '').toLowerCase()
    const cls = typeof target.className === 'string' ? target.className : (target.className ? (target.className as any).baseVal || '' : '')

    const isCompareBtn =
      cls.includes('pyc-trigger-btn') ||
      target.getAttribute('data-comparison-trigger') === 'true' ||
      id === 'compare-parcels-year-action' ||
      id.includes('compare') ||
      title.includes('مقارنة') ||
      title.includes('compare') ||
      text.includes('مقارنة') ||
      text.includes('compare')

    if (isCompareBtn) {
      e.preventDefault()
      e.stopPropagation()
      const now = Date.now()
      if (now - lastGlobalClickTrigger < 500) return
      lastGlobalClickTrigger = now
      const cfg = view._pycConfig || {}
      const feature = view?.popup?.selectedFeature || view?.popup?.features?.[0]
      openComparisonPopup(view, feature, cfg.originDataSource, cfg.comparisonOptions)
    }
  }

  win._pycGlobalClickHandler = handleGlobalClick
  targetDocs.forEach(d => {
    try {
      d.addEventListener('click', handleGlobalClick, true)
    } catch (e) {}
  })

}

/**
 * Replaces the current popup content with the PersonYearComparison stock trend dashboard.
 * Mounts a full-coverage overlay directly inside the popup container with custom header & responsive scrolling,
 * guaranteeing instantaneous transition without any Esri VDOM conflicts or state loss.
 */
export const openComparisonPopup = (
  view?: any,
  feature?: any,
  originDataSource?: DataSource,
  comparisonOptions?: ComparisonContext
): void => {
  // Resolve target map view
  const views = getTargetJimuMapViews()
  const activeView = view || views.find((v: any) => v?.view?.popup?.visible)?.view || views[0]?.view
  if (!activeView?.popup) {
    console.error('>>> [AdvancedChart] activeView or popup not found!', { views, activeView })
    return
  }

  const activeFeature = feature || activeView.popup?.selectedFeature || activeView.popup?.features?.[0]

  // 1. Resolve Person Name with robust fallbacks
  const attrs = activeFeature?.attributes || (typeof activeFeature?.getData === 'function' ? activeFeature.getData() : {}) || {}
  const entityField = comparisonOptions?.entityField || 'Client'
  let personName = attrs[entityField] ?? attrs[entityField.toLowerCase()] ?? attrs[entityField.toUpperCase()]

  if (!personName) {
    const candidateKey = Object.keys(attrs).find(k => /(?:client|person|owner|عميل|مالك|اسم)/i.test(k) && !/(?:id|code|airport|مطار)/i.test(k))
    if (candidateKey) {
      personName = attrs[candidateKey]
    }
  }

  // Find popup DOM across active view and document contexts
  let popupDom = (activeView.popup?.container as HTMLElement)
  if (!popupDom) {
    const candidateDocs = [
      activeView?.container?.ownerDocument,
      activeView?.popup?.container?.ownerDocument,
      document,
      (window as any).top?.document,
      (window as any).parent?.document
    ].filter(Boolean)

    for (const d of candidateDocs) {
      try {
        const found = d.querySelector('.esri-popup') as HTMLElement
        if (found) {
          popupDom = found
          break
        }
      } catch (e) {}
    }
  }

  const headerTitleEl = popupDom?.querySelector('.esri-popup__header-title') as HTMLElement
  if (!personName && headerTitleEl?.textContent) {
    const titleText = headerTitleEl.textContent.trim()
    if (titleText && !titleText.includes('مقارنة')) {
      personName = titleText
    }
  }

  if (!personName) {
    personName = 'المالك'
  }

  // 2. Resolve Airport Name and Raw Value
  const categoryField = comparisonOptions?.categoryField || 'AirportName'
  const rawAirportValue =
    attrs[categoryField] ??
    attrs[categoryField.toLowerCase()] ??
    attrs.airportname ??
    attrs.AirportName ??
    attrs.AIRPORTNAME

  const airportName = comparisonOptions?.categoryValue ||
    (rawAirportValue != null ? String(rawAirportValue) : '') ||
    attrs.AirportName ||
    attrs.airportname ||
    ''

  // Target DOM container: .esri-popup__main-container (or popupDom)
  const mainContainer = (popupDom?.querySelector('.esri-popup__main-container') as HTMLElement) || popupDom
  if (!mainContainer) {
    console.error('>>> [AdvancedChart] Popup container not found in DOM!', { popupDom })
    return
  }

  // If a previous comparison overlay exists, remove it cleanly so it can re-mount freshly
  const existingWrapper = mainContainer.querySelector('.pyc-mount-wrapper') || document.querySelector('.pyc-mount-wrapper')
  if (existingWrapper && existingWrapper.parentNode) {
    existingWrapper.parentNode.removeChild(existingWrapper)
  }

  // 1. Expand popup main container dimensions
  mainContainer.classList.add('esri-popup--comparison-mode')
  mainContainer.style.setProperty('width', 'min(580px, 94vw)', 'important')
  mainContainer.style.setProperty('max-width', '95vw', 'important')
  mainContainer.style.setProperty('min-width', '480px', 'important')
  mainContainer.style.setProperty('min-height', '540px', 'important')
  mainContainer.style.setProperty('height', '580px', 'important')
  mainContainer.style.setProperty('position', 'relative', 'important')

  const posContainer = popupDom?.querySelector('.esri-popup__position-container') as HTMLElement
  if (posContainer) {
    posContainer.style.setProperty('max-width', '95vw', 'important')
    posContainer.style.setProperty('width', 'auto', 'important')
  }

  // 2. Create the Comparison Overlay Container (use popup's ownerDocument)
  const popupDoc = mainContainer.ownerDocument || document
  const mountContainer = popupDoc.createElement('div')
  mountContainer.className = 'pyc-mount-wrapper'
  mountContainer.style.cssText = `
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 520px !important;
    max-height: 100% !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    background: #0f172a !important;
    color: #f8fafc !important;
    z-index: 99999 !important;
    border-radius: 8px !important;
    box-sizing: border-box !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
    display: block !important;
  `

  let unmounted = false
  let unmountCallback: (() => void) | null = null

  const cleanup = () => {
    if (unmounted) return
    unmounted = true

    if (unmountCallback) {
      try {
        unmountCallback()
      } catch (e) {}
      unmountCallback = null
    }

    if (mainContainer) {
      mainContainer.classList.remove('esri-popup--comparison-mode')
      mainContainer.style.removeProperty('width')
      mainContainer.style.removeProperty('max-width')
      mainContainer.style.removeProperty('min-width')
      mainContainer.style.removeProperty('min-height')
      mainContainer.style.removeProperty('height')
    }

    if (posContainer) {
      posContainer.style.removeProperty('max-width')
      posContainer.style.removeProperty('width')
    }

    if (mountContainer.parentNode) {
      mountContainer.parentNode.removeChild(mountContainer)
    }
  }

  const handleBack = () => {
    cleanup()
  }

  const handleClose = () => {
    cleanup()
    try {
      activeView.popup.close()
    } catch (e) {}
  }

  // Watch for popup close to ensure cleanup
  let visibleWatcher: any = null
  if (typeof activeView.popup.watch === 'function') {
    visibleWatcher = activeView.popup.watch('visible', (visible: boolean) => {
      if (!visible) {
        cleanup()
        try {
          visibleWatcher?.remove?.()
        } catch (e) {}
      }
    })
  }

  let targetLayer = activeFeature?.layer || (originDataSource as any)?.layer
  if (!targetLayer && activeView?.map?.layers) {
    activeView.map.layers.forEach((l: any) => {
      if (!targetLayer && (l?.type === 'feature' || l?.popupTemplate)) {
        targetLayer = l
      }
    })
  }

  const serviceUrl =
    targetLayer?.url ||
    (originDataSource as any)?.url ||
    (originDataSource as any)?.layer?.url ||
    (originDataSource as any)?.getDataSourceJson?.()?.url ||
    (activeFeature?.layer as any)?.url ||
    ''

  // 3. Append the overlay container into mainContainer FIRST
  mainContainer.appendChild(mountContainer)

  // 4. Mount the React Comparison Component into mountContainer
  unmountCallback = mountPersonYearComparison(mountContainer, {
    personName: String(personName),
    airportName: String(airportName),
    rawAirportValue,
    dataSource: originDataSource,
    layer: targetLayer,
    serviceUrl,
    entityField,
    categoryField,
    yearField: comparisonOptions?.yearField || 'Year',
    valueField: comparisonOptions?.valueField || 'إجمالي المساحة بالفدان',
    sampleAttributes: attrs,
    onBack: handleBack,
    onClose: handleClose
  })
}

/**
 * Registers comparison handler on all active map views.
 * Uses a polling interval so that map views appearing after initial render
 * are discovered and configured with the latest config.
 */
/**
 * Stops offering the comparison: halts the poller, drops the shared config and
 * removes any button already injected into an open pop-up.
 */
export const unregisterGlobalPopupComparisonHandler = (): void => {
  const win = window as any
  if (win._pycRegisterIntervalId) {
    clearInterval(win._pycRegisterIntervalId)
    win._pycRegisterIntervalId = undefined
  }
  win._pycGlobalConfig = undefined
  try {
    const docs = [document, win.top?.document, win.parent?.document].filter(Boolean)
    for (const d of docs) {
      d.querySelectorAll('.pyc-incontent-banner').forEach((el: Element) => { el.remove() })
    }
  } catch (e) {}
}

export const registerGlobalPopupComparisonHandler = (
  originDataSource?: DataSource,
  comparisonOptions?: ComparisonContext
): void => {
  const win = window as any

  // Turning the feature off has to actually tear down. Writing an empty config
  // and leaving the poller running used to leave a button behind in any open
  // pop-up, wired to a config that no longer existed, so clicking it did nothing.
  if (!originDataSource && !comparisonOptions) {
    unregisterGlobalPopupComparisonHandler()
    return
  }

  // Always update global config so interval uses the latest
  win._pycGlobalConfig = { originDataSource, comparisonOptions }

  if (!win._pycRegisterIntervalId) {
    win._pycRegisterIntervalId = setInterval(() => {
      const cfg = win._pycGlobalConfig || {}
      if (!cfg.originDataSource && !cfg.comparisonOptions) return

      try {
        const views = getTargetJimuMapViews()
        views.forEach((jmv: any) => {
          const view = jmv?.view
          if (view) {
            // Re-run setup on each view. setupPopupComparisonHandler internally
            // stores view._pycConfig and attaches watchers without duplicating them
            // because of its own view.popup._hasCompareWatchers guard.
            setupPopupComparisonHandler(view, cfg.originDataSource, cfg.comparisonOptions)
          }
        })
      } catch (e) {
        // Ignore errors if map views aren't fully ready yet
      }
    }, 1500)
  }
}

/**
 * Directly zooms active map views to the provided parcel records, flashes the new parcel,
 * highlights it as the sole selection, and displays its pop-up.
 */
export const zoomMapToRecords = async (
  records: DataRecord[],
  categoryField?: string,
  originDataSource?: DataSource,
  openPopup: boolean = true,
  autoZoomToParcel: boolean = true
): Promise<void> => {
  try {
    if (!records || !records.length) {
      clearPreviousMapSelection()
      return
    }

    const { extent, isPoint, geometries, graphics } = extractExtentFromRecords(records)
    if (!extent && !geometries.length && !graphics.length) {
      clearPreviousMapSelection()
      return
    }

    const targetViews = getTargetJimuMapViews()
    if (!targetViews.length) return

    // 1. Remove previous selection and highlights from previous parcel
    clearPreviousMapSelection(targetViews)

    // Load JS API modules if needed
    let ExtentClass: any = null
    let GraphicClass: any = null
    try {
      if (typeof loadArcGISJSAPIModules === 'function') {
        const modules = await loadArcGISJSAPIModules(['esri/geometry/Extent', 'esri/Graphic'])
        ExtentClass = modules?.[0]
        GraphicClass = modules?.[1]
      }
    } catch (e) {}

    for (const jimuMapView of targetViews) {
      const view = jimuMapView?.view
      if (!view) continue

      const targetSR = extent?.spatialReference || view.spatialReference

      let centerPoint: any = null
      if (extent) {
        centerPoint = {
          type: 'point',
          x: (extent.xmin + extent.xmax) / 2,
          y: (extent.ymin + extent.ymax) / 2,
          spatialReference: targetSR
        }
      }

      // Find matching layer on the map view for popup template and highlighting
      let matchingLayer: any = null
      let layerPopupTemplate: any = null

      try {
        if (originDataSource?.id && typeof jimuMapView.getJimuLayerViewByDataSourceId === 'function') {
          const jimuLayerView = jimuMapView.getJimuLayerViewByDataSourceId(originDataSource.id)
          matchingLayer = jimuLayerView?.layer
          layerPopupTemplate = matchingLayer?.popupTemplate
        }

        if (!matchingLayer && view.map?.layers) {
          view.map.layers.forEach((l: any) => {
            if (!matchingLayer && (l?.type === 'feature' || l?.popupTemplate)) {
              matchingLayer = l
              if (l?.popupTemplate) layerPopupTemplate = l.popupTemplate
            }
          })
        }
      } catch (e) {}

      // Prepare graphics for popup and zoom
      const popupGraphics = graphics.map(g => {
        let graphic = g
        if (GraphicClass && !(g instanceof GraphicClass) && typeof GraphicClass.fromJSON === 'function') {
          try {
            graphic = GraphicClass.fromJSON(g)
          } catch (e) {}
        }
        if (matchingLayer && !graphic.layer) {
          graphic.layer = matchingLayer
        }
        if (layerPopupTemplate && !graphic.popupTemplate) {
          graphic.popupTemplate = layerPopupTemplate
        }
        if (!graphic.popupTemplate) {
          const titleField = (categoryField && graphic.attributes?.[categoryField])
            ? `{${categoryField}}`
            : (graphic.attributes ? Object.keys(graphic.attributes)[0] : 'Parcel Details')
          graphic.popupTemplate = {
            title: `{${titleField}}`,
            content: [{ type: 'fields' }]
          }
        }

        // The comparison lives on the view's own action bar, added once per view by
        // ensureCompareAction. Adding it to each graphic's template as well produced
        // a second, differently worded entry for the same thing.

        return graphic
      })

      // 2. Physically zoom in to the new parcel FIRST (if autoZoomToParcel is true)
      if (autoZoomToParcel && typeof view.goTo === 'function') {
        try {
          if (isPoint && extent) {
            await view.goTo({
              center: centerPoint,
              spatialReference: targetSR,
              scale: 2500,
              zoom: 17
            }, { duration: 1000 })
          } else if (extent && ExtentClass) {
            const esriExtent = new ExtentClass({
              xmin: extent.xmin,
              ymin: extent.ymin,
              xmax: extent.xmax,
              ymax: extent.ymax,
              spatialReference: targetSR
            })
            const expanded = typeof esriExtent.expand === 'function' ? esriExtent.expand(1.3) : esriExtent
            await view.goTo(expanded, { duration: 1000 })
          } else if (popupGraphics.length) {
            await view.goTo(popupGraphics.length === 1 ? popupGraphics[0] : popupGraphics, { duration: 1000 })
          } else if (extent) {
            await view.goTo(extent, { duration: 1000 })
          } else if (geometries.length) {
            await view.goTo(geometries.length === 1 ? geometries[0] : geometries, { duration: 1000 })
          }
        } catch (zoomErr) {
          if (popupGraphics.length && zoomToUtils?.zoomTo) {
            try {
              await zoomToUtils.zoomTo(view, popupGraphics, {
                scale: isPoint ? 2500 : undefined
              })
            } catch (e) {}
          }
        }
      }

      // 3. Flash the new parcel on the map
      try {
        if (autoZoomToParcel) {
          flashGraphicsOnView(view, popupGraphics, GraphicClass)
        }
      } catch (flashErr) {}

      // 4. Highlight the new parcel (sole selection) on the layerView
      try {
        if (autoZoomToParcel && matchingLayer && typeof view.whenLayerView === 'function') {
          view.whenLayerView(matchingLayer).then((layerView: any) => {
            if (layerView && typeof layerView.highlight === 'function') {
              const handle = layerView.highlight(popupGraphics)
              if (handle && typeof handle.remove === 'function') {
                activeHighlightHandles.push(handle)
              }
            }
          }).catch(() => {})
        }
      } catch (highlightErr) {}

      // 5. Open pop-up on the newly selected parcel (AFTER camera positioning completes)
      try {
        if (openPopup && popupGraphics.length) {
          const popupLocation = centerPoint || (popupGraphics[0]?.geometry?.type === 'point' ? popupGraphics[0].geometry : (popupGraphics[0]?.geometry?.extent?.center || null))
          if (view.popup) {
            try { view.popup.autoCloseEnabled = false } catch (_) {}
            view.popup.open({
              features: popupGraphics,
              location: popupLocation
            })
          } else if (typeof view.openPopup === 'function') {
            view.openPopup({
              features: popupGraphics,
              location: popupLocation
            })
          }
        }
      } catch (popupErr) {
        console.warn('Failed to open popup for parcel:', popupErr)
      }
    }
  } catch (err) {
    console.error('Failed to zoom map to parcel records and open popup:', err)
  }
}

/**
 * Queries all parcel records for the specified person from originDataSource,
 * zooms the map to them, highlights them, opens the popup, and attaches the Compare button.
 */
export const selectAndZoomToPerson = async (
  personName: string | number,
  activeCategoryField: string,
  originDataSource?: DataSource,
  autoZoomToParcel: boolean = true,
  openSelectionPopup: boolean = true,
  internalSelectionGuard?: { current: boolean }
): Promise<void> => {
  if (!originDataSource || personName == null || personName === '') return

  // 1. Resolve actual field name from originDataSource schema
  const schemaFields = (originDataSource as any)?.getSchema?.()?.fields || {}
  const fieldNames = Object.keys(schemaFields)
  let actualField = activeCategoryField || 'Client'
  if (fieldNames.length) {
    const match = fieldNames.find(f => f.toLowerCase() === actualField.toLowerCase())
    if (match) {
      actualField = match
    } else {
      const candidateKey = fieldNames.find(f =>
        /(?:client|person|owner|عميل|مالك|اسم)/i.test(f) &&
        !/(?:id|code|airport|مطار|area|مساحة|year|سنة)/i.test(f)
      )
      if (candidateKey) actualField = candidateKey
    }
  }

  const strVal = String(personName).trim().replace(/'/g, "''")
  const queryWhere = (typeof personName === 'number')
    ? `${actualField} = ${personName}`
    : `${actualField} = '${strVal}'`

  const queryParams: FeatureLayerQueryParams = {
    where: queryWhere,
    returnGeometry: true,
    outFields: ['*']
  }

  const queriableDs = originDataSource as QueriableDataSource
  if (typeof queriableDs?.query !== 'function') return

  try {
    const result = await queriableDs.query(queryParams, { scope: QueryScope.InConfigView })
    let parcelRecords = result?.records ?? []

    // If remote query returned 0 records, try searching in-memory records from originDataSource
    if (!parcelRecords.length && typeof queriableDs.getRecords === 'function') {
      const memRecs = queriableDs.getRecords() || []
      parcelRecords = memRecs.filter((r: any) => {
        const d = (typeof r.getData === 'function' ? r.getData() : r.attributes) || {}
        const val = d[actualField] ?? d[actualField.toLowerCase()] ?? d.client ?? d.Client
        return val != null && String(val).trim().toLowerCase() === String(personName).trim().toLowerCase()
      })
    }

    if (parcelRecords.length) {
      // Synchronize selection on originDataSource
      try {
        const ids = parcelRecords.map((r: any) => r.getId?.() || r.id).filter(Boolean)
        if (autoZoomToParcel && ids.length && typeof originDataSource.selectRecordsByIds === 'function') {
          if (internalSelectionGuard) internalSelectionGuard.current = true
          originDataSource.selectRecordsByIds(ids)
          setTimeout(() => { if (internalSelectionGuard) internalSelectionGuard.current = false }, 1000)
        }
      } catch (e) {}

      // With the map response switched off, the map is left exactly as the user
      // left it. Opening a pop-up here would gather every parcel belonging to the
      // person and show them as "1 of N", which reveals the other parcels the user
      // did not pick. The figures are still computed on demand from the compare
      // button in whichever pop-up the user opened themselves.
      if (autoZoomToParcel) {
        await zoomMapToRecords(parcelRecords, actualField, originDataSource, openSelectionPopup, autoZoomToParcel)
      }
    }
  } catch (err) {
    console.error('Failed to query parcel records for person:', err)
  }
}

/**
 * Keep the selection of chart and output data source, publish message when selection changes.
 * Supports consistent popup and yearly comparison whether a person is selected from the chart or the list.
 */
const useSelection = (
  widgetId: string,
  outputDataSource: DataSource,
  series: ImmutableArray<WebChartSeries>,
  numberFields?: string[],
  inlineFormatedField?: string,
  originDataSource?: DataSource,
  categoryField?: string,
  autoZoomToParcel: boolean = true,
  openSelectionPopup: boolean = true
): [SelectionData, (...args: any[]) => any] => {
  const numberFieldsRef = hooks.useLatest(numberFields)
  const preSelectedIdsRef = React.useRef<string[]>()
  const isInternalSelectionRef = React.useRef(false)
  const lastProcessedOriginIdsRef = React.useRef<string[]>([])
  const lastProcessedPersonRef = React.useRef<string>('')
  const lastProcessedTimeRef = React.useRef<number>(0)

  const activeCategoryField = categoryField || (series?.[0] as any)?.x || 'Client'

  const handleSelectionChange = hooks.useEventCallback((e) => {
    const sourceRecords = outputDataSource?.getSourceRecords()
    if (!sourceRecords?.length) return

    const selectionSource: SelectionSource = e.detail.selectionSource
    // Only trigger selection change message if selection source is from the user operation
    const selectionByUser =
      selectionSource === SelectionSource.SelectionByClick ||
      selectionSource === SelectionSource.SelectionByRange ||
      selectionSource === SelectionSource.ClearSelection
    if (!selectionByUser) return

    // If selection is cleared or empty
    if (selectionSource === SelectionSource.ClearSelection || !e.detail.selectionItems?.length) {
      preSelectedIdsRef.current = []
      lastProcessedOriginIdsRef.current = []
      lastProcessedPersonRef.current = ''
      outputDataSource?.selectRecordsByIds([])
      clearPreviousMapSelection()
      return
    }

    const where = series[0].query?.where
    const splitByField = getSplitByField(where)

    let selectionItems = getNormalizedSelectionItems(e.detail.selectionItems ?? [], splitByField, inlineFormatedField)
    selectionItems = convertDataItemsFromUpperCase(selectionItems, numberFieldsRef.current)
    const selectedRecords = getMatchedRecords(sourceRecords, selectionItems, inlineFormatedField)
    const selectedIds = selectedRecords.map(record => record.getId())

    preSelectedIdsRef.current = selectedIds

    // Always maintain outputDataSource selection for chart state
    outputDataSource.selectRecordsByIds(selectedIds)

    // Handle origin parcel records for map selection and zoom
    if (originDataSource) {
      const personValues: any[] = selectionItems.map(item => {
        if (activeCategoryField && typeof item[activeCategoryField] !== 'undefined') {
          return item[activeCategoryField]
        }
        if (activeCategoryField && typeof item[activeCategoryField + '_original'] !== 'undefined') {
          return item[activeCategoryField + '_original']
        }
        if (activeCategoryField) {
          const lowerField = activeCategoryField.toLowerCase()
          const matchedKey = Object.keys(item).find(k => k.toLowerCase() === lowerField || k.toLowerCase() === lowerField + '_original')
          if (matchedKey && typeof item[matchedKey] !== 'undefined') {
            return item[matchedKey]
          }
        }
        return item.name ?? item.x
      }).filter(v => v !== undefined && v !== null && v !== '')

      if (personValues.length) {
        const pVal = personValues[0]
        lastProcessedPersonRef.current = String(pVal).trim()
        lastProcessedTimeRef.current = Date.now()
        isInternalSelectionRef.current = true
        setTimeout(() => { isInternalSelectionRef.current = false }, 1000)

        selectAndZoomToPerson(
          pVal,
          activeCategoryField,
          originDataSource,
          autoZoomToParcel,
          openSelectionPopup,
          isInternalSelectionRef
        )
      }
    }

    // Also publish message for other listening widgets
    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(widgetId, selectedRecords)
    )
  })

  // Watch chart's outputDataSource selection
  const originalSelectedIds = ReactRedux.useSelector((state: IMState) => state.dataSourcesInfo?.[outputDataSource?.id]?.selectedIds)
  const [selectionItems, setSelectionItems] = React.useState<WebChartDataItem[]>()

  const getSelectionItems = hooks.useEventCallback((selectedIds) => {
    const sourceRecords = outputDataSource?.getSourceRecords()
    if (!sourceRecords?.length) return
    const items = getSelectedItems(selectedIds ?? [], sourceRecords, inlineFormatedField)
    return items
  })

  React.useEffect(() => {
    if (!originalSelectedIds) return
    const mutableSelectionIds = originalSelectedIds.asMutable()
    // if the selected ids is same as the current selected ids, just return.
    if (lodash.isDeepEqual(mutableSelectionIds, preSelectedIdsRef.current)) return
    preSelectedIdsRef.current = mutableSelectionIds
    let selectionItems = getSelectionItems(mutableSelectionIds)
    selectionItems = convertDataItemsFromUpperCase(selectionItems, numberFieldsRef.current)
    setSelectionItems(selectionItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalSelectedIds])

  // Watch originDataSource selection from EXTERNAL widgets (e.g. List widget showing people in the airport)
  const originSelectedIds = ReactRedux.useSelector((state: IMState) => {
    const dsId = originDataSource?.id
    if (!dsId) return undefined
    const info = state.dataSourcesInfo?.[dsId]
    if (info?.selectedIds?.length) return info.selectedIds

    const mainId = (originDataSource as any)?.mainDataSourceId
    if (mainId && mainId !== dsId) {
      const mainInfo = state.dataSourcesInfo?.[mainId]
      if (mainInfo?.selectedIds?.length) return mainInfo.selectedIds
    }

    // Check dataViews or related layer dataSources in the same root
    const allInfos = state.dataSourcesInfo || {}
    for (const key of Object.keys(allInfos)) {
      if (key !== dsId && (key.startsWith(dsId) || (mainId && key.startsWith(mainId)))) {
        if (allInfos[key]?.selectedIds?.length) {
          return allInfos[key].selectedIds
        }
      }
    }
    return undefined
  })

  // Handle external selection change (from List widget)
  const handleExternalOriginSelection = hooks.useEventCallback(async (selectedIds: string[]) => {
    if (!selectedIds?.length || !originDataSource) return
    if (isInternalSelectionRef.current) return

    try {
      const entityField = categoryField || 'Client'

      // 1. Get the selected record from memory or fetch from data source
      let rec: any = null
      const inMemRecords = originDataSource.getSelectedRecords?.() || []
      rec = inMemRecords.find((r: any) => selectedIds.includes(r.getId?.())) || inMemRecords[0]

      if (!rec && typeof originDataSource.getRecordById === 'function') {
        rec = originDataSource.getRecordById(selectedIds[0])
      }

      if (!rec || !rec.getData?.()) {
        const queriableDs = originDataSource as QueriableDataSource
        if (typeof queriableDs?.query === 'function') {
          const idField = (originDataSource as any).getIdField?.() || 'OBJECTID'
          const idClauses = selectedIds.map(id => /^\d+$/.test(String(id).trim()) ? `${idField} = ${id}` : `${idField} = '${id}'`).join(' OR ')
          try {
            const res = await queriableDs.query({ where: idClauses, outFields: ['*'], returnGeometry: true })
            if (res?.records?.length) {
              rec = res.records[0]
            }
          } catch (e) {}
        }
      }

      if (!rec) return

      const data = (typeof rec.getData === 'function' ? rec.getData() : rec.attributes) || rec || {}

      // 2. Extract person name from record attributes
      let personName =
        data[activeCategoryField] ??
        data[entityField] ??
        data[activeCategoryField?.toLowerCase()] ??
        data[entityField?.toLowerCase()] ??
        data.Client ??
        data.client ??
        data.CLIENT ??
        data.owner ??
        data.Owner ??
        data.person ??
        data.Person ??
        data['الاسم'] ??
        data['اسم العميل'] ??
        data['المالك']

      if (!personName) {
        const candidateKey = Object.keys(data).find(k =>
          /(?:client|person|owner|عميل|مالك|اسم)/i.test(k) &&
          !/(?:id|code|airport|مطار|area|مساحة|year|سنة|status|حالة)/i.test(k)
        )
        if (candidateKey && typeof data[candidateKey] === 'string' && data[candidateKey].trim()) {
          personName = data[candidateKey].trim()
        }
      }

      if (!personName) return
      personName = String(personName).trim()

      const now = Date.now()
      if (personName === lastProcessedPersonRef.current && now - lastProcessedTimeRef.current < 500) {
        return
      }
      lastProcessedPersonRef.current = personName
      lastProcessedTimeRef.current = now

      isInternalSelectionRef.current = true
      setTimeout(() => { isInternalSelectionRef.current = false }, 1000)

      // 3. The selection the user made is left exactly as it is. Widening it to
      // every parcel owned by the same person turned a deliberate pick of one
      // parcel into a "1 of 5" pop-up, so it was no longer clear which parcel was
      // being looked at. The person is still resolved here, which is all the
      // comparison needs: it groups by owner across years on demand, from the
      // pop-up of whichever single parcel the user actually chose.

      // 4. Synchronize chart selection so the corresponding bar is highlighted
      if (outputDataSource) {
        const sourceRecords = outputDataSource.getSourceRecords?.() || []
        const matchedRecords = sourceRecords.filter((r: any) => {
          const d = r.getData?.() || {}
          const name = d[activeCategoryField] ?? d[activeCategoryField + '_original'] ?? d.name ?? d.x
          return name != null && String(name).trim().toLowerCase() === personName.toLowerCase()
        })
        if (matchedRecords.length) {
          const outIds = matchedRecords.map((r: any) => r.getId())
          preSelectedIdsRef.current = outIds
          outputDataSource.selectRecordsByIds(outIds)
        }
      }
    } catch (err) {
      console.error('>>> [AdvancedChart] Error handling origin selection from list:', err)
    } finally {
      setTimeout(() => { isInternalSelectionRef.current = false }, 1000)
    }
  })

  React.useEffect(() => {
    if (isInternalSelectionRef.current) return
    if (!originDataSource || !originSelectedIds?.length) return

    const mutableOriginIds = originSelectedIds.asMutable ? originSelectedIds.asMutable() : Array.from(originSelectedIds)
    if (lodash.isDeepEqual(mutableOriginIds, lastProcessedOriginIdsRef.current)) return
    lastProcessedOriginIdsRef.current = mutableOriginIds

    handleExternalOriginSelection(mutableOriginIds)
  }, [originSelectedIds, originDataSource, handleExternalOriginSelection])

  const selectionData = React.useMemo(() => ({ selectionItems }), [selectionItems])
  return [selectionData, handleSelectionChange]
}

export default useSelection
