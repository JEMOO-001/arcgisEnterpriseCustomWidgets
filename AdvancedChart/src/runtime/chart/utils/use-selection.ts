import { React, type IMState, ReactRedux, lodash, MessageManager, DataRecordsSelectionChangeMessage, type DataSource, hooks, type DataRecord, type ImmutableArray, type QueriableDataSource, type FeatureLayerQueryParams } from 'jimu-core'
import { type SelectionData, SelectionSource, getSplitByField, type WebChartDataItem } from 'jimu-ui/advanced/chart'
import { MapViewManager, zoomToUtils, loadArcGISJSAPIModules } from 'jimu-arcgis'
import { type WebChartSeries, type ComparisonOptions } from '../../../config'
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
    const feat = (r as any)?.feature
    if (feat) {
      graphics.push(feat)
      if (feat.geometry) {
        geometries.push(feat.geometry)
        inspectGeom(feat.geometry)
      }
    }

    if (typeof r.getGeometry === 'function') {
      try {
        const g = r.getGeometry()
        if (g) {
          geometries.push(g)
          inspectGeom(g)
        }
      } catch (e) {}
    }

    if (typeof (r as any).getRawGeometry === 'function') {
      try {
        const rg = (r as any).getRawGeometry()
        if (rg) {
          geometries.push(rg)
          inspectGeom(rg)
        }
      } catch (e) {}
    }

    const plain = (r as any)?.geometry
    if (plain) {
      geometries.push(plain)
      inspectGeom(plain)
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
 * Injects a prominent call-to-action button into the popup DOM with retry support.
 * Creates all elements using the popup's own ownerDocument to guarantee event handlers
 * fire correctly even when the popup lives in a different iframe/document context.
 */
export const injectCompareButtonIntoPopupDOM = (
  view: any,
  originDataSource?: DataSource,
  comparisonOptions?: ComparisonOptions,
  retryCount: number = 0,
  selectedFeature?: any
): void => {
  const tryInject = () => {
    try {
      if (!view?.popup?.visible) return

      const targetDoc = view?.container?.ownerDocument || view?.popup?.container?.ownerDocument || document
      const popupDom = (view.popup.container as HTMLElement) || (targetDoc.querySelector('.esri-popup') as HTMLElement) || (document.querySelector('.esri-popup') as HTMLElement)
      if (!popupDom) {
        if (retryCount < 8) {
          setTimeout(() => injectCompareButtonIntoPopupDOM(view, originDataSource, comparisonOptions, retryCount + 1, selectedFeature), 150)
        }
        return
      }

      const contentEl = (popupDom.querySelector('.esri-popup__content') as HTMLElement) || (targetDoc.querySelector('.esri-popup__content') as HTMLElement)
      if (!contentEl) {
        if (retryCount < 8) {
          setTimeout(() => injectCompareButtonIntoPopupDOM(view, originDataSource, comparisonOptions, retryCount + 1, selectedFeature), 150)
        }
        return
      }

      // If already in comparison mode or banner already exists, do not duplicate
      if (contentEl.querySelector('.pyc-incontent-banner') || popupDom.querySelector('.pyc-mount-wrapper')) {
        return
      }

      // Ensure click delegation is active
      setupPopupComparisonHandler(view, originDataSource, comparisonOptions)

      // CRITICAL: Use the popup element's own ownerDocument for createElement.
      // In Experience Builder, the popup may live in an iframe. Elements created
      // with the widget's `document` render visually when cross-adopted, but their
      // event handlers are bound to the wrong event loop and silently never fire.
      const popupOwnerDoc = contentEl.ownerDocument || targetDoc || document

      const banner = popupOwnerDoc.createElement('div')
      banner.className = 'pyc-incontent-banner'
      banner.style.cssText = 'margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); text-align: center; direction: rtl;'

      const btn = popupOwnerDoc.createElement('button')
      btn.type = 'button'
      btn.className = 'pyc-trigger-btn'
      btn.setAttribute('data-comparison-trigger', 'true')
      btn.style.cssText = 'width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer !important; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4); transition: all 0.2s; position: relative; z-index: 10; pointer-events: auto !important; user-select: none;'
      btn.innerHTML = '<span style="font-size: 16px; pointer-events: none;">📈</span><span style="pointer-events: none;">مقارنة أراضي المالك عبر السنوات (سنة الرفع)</span>'

      btn.onmouseenter = () => {
        btn.style.background = 'linear-gradient(135deg, #0369a1 0%, #075985 100%)'
        btn.style.transform = 'translateY(-1px)'
      }
      btn.onmouseleave = () => {
        btn.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
        btn.style.transform = 'translateY(0)'
      }

      // Store reference on window so the postMessage fallback can reach it
      const win = (popupOwnerDoc.defaultView || window) as any
      win._pycCompareView = view
      win._pycCompareDS = originDataSource
      win._pycCompareOpts = comparisonOptions
      win._pycCompareFeature = selectedFeature

      let lastTrigger = 0
      const triggerOpen = (e?: Event) => {
        if (e) {
          try { e.preventDefault() } catch (_) {}
          try { e.stopPropagation() } catch (_) {}
        }
        const now = Date.now()
        if (now - lastTrigger < 500) return
        lastTrigger = now
        console.log('>>> [AdvancedChart] Compare button clicked directly!', { selectedFeature })
        const feature = selectedFeature || view?.popup?.selectedFeature || view?.popup?.features?.[0]
        openComparisonPopup(view, feature, originDataSource, comparisonOptions)
      }

      // Primary: onclick property (works in same-document context)
      btn.onclick = triggerOpen

      // Secondary: addEventListener in capture phase
      btn.addEventListener('click', triggerOpen, true)

      // Tertiary: pointerup as fallback for touch/pen
      btn.addEventListener('pointerup', (e: PointerEvent) => {
        if (e.button === 0) triggerOpen(e)
      }, true)

      // Quaternary: inline onclick attribute — this compiles into the popup's own
      // document context, bypassing any cross-document event binding issues
      btn.setAttribute('onclick',
        "event.preventDefault();event.stopPropagation();" +
        "var w=this.ownerDocument.defaultView||window;" +
        "console.log('>>> [AdvancedChart] Compare via inline onclick');" +
        "if(w._pycTriggerCompare){w._pycTriggerCompare()}" +
        "else if(w.parent&&w.parent._pycTriggerCompare){w.parent._pycTriggerCompare()}" +
        "else if(w.top&&w.top._pycTriggerCompare){w.top._pycTriggerCompare()}"
      )

      // Register the trigger function on ALL reachable windows so inline onclick can find it
      const triggerFn = () => triggerOpen()
      ;[window, win].forEach((w: any) => {
        if (w) {
          try { w._pycTriggerCompare = triggerFn } catch (_) {}
        }
      })
      try {
        if ((window as any).parent) (window as any).parent._pycTriggerCompare = triggerFn
      } catch (_) {}
      try {
        if ((window as any).top) (window as any).top._pycTriggerCompare = triggerFn
      } catch (_) {}

      // Also listen for postMessage as ultimate fallback
      const messageKey = '_pyc_compare_trigger_' + Date.now()
      btn.setAttribute('data-pyc-msg-key', messageKey)
      const msgHandler = (ev: MessageEvent) => {
        if (ev.data === messageKey) {
          triggerOpen()
        }
      }
      win.addEventListener('message', msgHandler)
      window.addEventListener('message', msgHandler)

      banner.appendChild(btn)
      contentEl.appendChild(banner)
      console.log('>>> [AdvancedChart] Compare button injected into popup DOM successfully', {
        popupOwnerDocURL: popupOwnerDoc?.location?.href || '(same)',
        widgetDocURL: document?.location?.href || '(same)',
        sameDoc: popupOwnerDoc === document,
        contentElTag: contentEl.tagName,
        btnInDOM: contentEl.contains(btn)
      })
    } catch (e) {
      console.error('>>> [AdvancedChart] Error injecting compare button:', e)
    }
  }

  setTimeout(tryInject, 100)
}

/**
 * Sets up action trigger, click delegation, and view watchers on a MapView popup.
 * Stores latest originDataSource and comparisonOptions on the view itself so that
 * the popup watchers always use current values — not stale closure captures.
 * This ensures the Compare button appears on EVERY popup: chart click, map click, or list selection.
 */
export const setupPopupComparisonHandler = (
  view: any,
  originDataSource?: DataSource,
  comparisonOptions?: ComparisonOptions
): void => {
  if (!view?.popup) return

  // Always update the stored config on the view so watchers use the latest values
  view._pycConfig = { originDataSource, comparisonOptions }

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
        console.log('>>> [AdvancedChart] Trigger action clicked:', event.action)
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
      console.log('>>> [AdvancedChart] Compare button clicked via global delegation!', { target })
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

  // 3. Watchers for visible & selectedFeature to inject button banner into ANY popup
  // The watchers read from view._pycConfig (set above) instead of closure values,
  // so even if comparisonOptions or originDataSource change later, the button always
  // gets the latest config.
  if (typeof view.popup.watch === 'function' && !view.popup._hasCompareWatchers) {
    view.popup._hasCompareWatchers = true
    try {
      view.popup.watch('visible', (visible: boolean) => {
        if (visible) {
          const cfg = view._pycConfig || {}
          // Inject after a small delay to let popup content render
          setTimeout(() => {
            if (view.popup?.visible) {
              injectCompareButtonIntoPopupDOM(view, cfg.originDataSource, cfg.comparisonOptions, 0, view.popup.selectedFeature)
            }
          }, 200)
        }
      })
      view.popup.watch('selectedFeature', (sf: any) => {
        if (view.popup.visible) {
          const cfg = view._pycConfig || {}
          injectCompareButtonIntoPopupDOM(view, cfg.originDataSource, cfg.comparisonOptions, 0, sf)
        }
      })
      // Also watch 'features' array changes (fires when popup.open({features}) is called)
      view.popup.watch('features', () => {
        if (view.popup.visible) {
          const cfg = view._pycConfig || {}
          const sf = view.popup.selectedFeature || view.popup.features?.[0]
          setTimeout(() => {
            if (view.popup?.visible) {
              injectCompareButtonIntoPopupDOM(view, cfg.originDataSource, cfg.comparisonOptions, 0, sf)
            }
          }, 300)
        }
      })
    } catch (e) {}
  }

  // 4. Periodic check: re-inject button if popup is visible but button is missing
  // This catches popups opened by direct map clicks where watchers may not fire
  if (!view.popup._pycIntervalId) {
    view.popup._pycIntervalId = setInterval(() => {
      try {
        if (!view.popup?.visible) return
        const cfg = view._pycConfig || {}
        if (!cfg.originDataSource && !cfg.comparisonOptions) return

        const targetDoc = view?.container?.ownerDocument || document
        const popupDom = (view.popup.container as HTMLElement) || (targetDoc.querySelector('.esri-popup') as HTMLElement)
        if (!popupDom) return

        const contentEl = popupDom.querySelector('.esri-popup__content') as HTMLElement
        if (!contentEl) return

        // Only inject if no banner exists yet and not in comparison mode
        if (!contentEl.querySelector('.pyc-incontent-banner') && !popupDom.querySelector('.pyc-mount-wrapper')) {
          const sf = view.popup.selectedFeature || view.popup.features?.[0]
          injectCompareButtonIntoPopupDOM(view, cfg.originDataSource, cfg.comparisonOptions, 0, sf)
        }
      } catch (e) {}
    }, 1500)
  }
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
  comparisonOptions?: ComparisonOptions
): void => {
  console.log('>>> [AdvancedChart] openComparisonPopup initiated', { view, feature, comparisonOptions })

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
  const clientField = comparisonOptions?.clientField || 'Client'
  let personName = attrs[clientField] ?? attrs[clientField.toLowerCase()] ?? attrs[clientField.toUpperCase()]

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

  // 2. Resolve Airport Name
  const airportField = comparisonOptions?.airportField || 'AirportName'
  const airportName = comparisonOptions?.selectedAirportName ||
    attrs[airportField] ||
    attrs[airportField.toLowerCase()] ||
    attrs.AirportName ||
    attrs.airportname ||
    ''

  console.log('>>> [AdvancedChart] Resolved comparison target:', { personName, airportName, clientField, airportField })

  // Target DOM container: .esri-popup__main-container (or popupDom)
  const mainContainer = (popupDom?.querySelector('.esri-popup__main-container') as HTMLElement) || popupDom
  if (!mainContainer) {
    console.error('>>> [AdvancedChart] Popup container not found in DOM!', { popupDom })
    return
  }

  // If a previous comparison overlay exists, remove it cleanly so it can re-mount freshly
  const existingWrapper = mainContainer.querySelector('.pyc-mount-wrapper') || document.querySelector('.pyc-mount-wrapper')
  if (existingWrapper && existingWrapper.parentNode) {
    console.log('>>> [AdvancedChart] Removing stale pyc-mount-wrapper before mounting')
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
    console.log('>>> [AdvancedChart] Cleaning up comparison popup')

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

  // 3. Append the overlay container into mainContainer FIRST
  mainContainer.appendChild(mountContainer)
  console.log('>>> [AdvancedChart] Appended mountContainer to mainContainer successfully')

  // 4. Mount the React Comparison Component into mountContainer
  unmountCallback = mountPersonYearComparison(mountContainer, {
    personName: String(personName),
    airportName: String(airportName),
    dataSource: originDataSource,
    layer: targetLayer,
    clientField,
    airportField,
    yearField: comparisonOptions?.yearField || 'Year',
    areaField: comparisonOptions?.areaField || 'إجمالي المساحة بالفدان',
    onBack: handleBack,
    onClose: handleClose
  })
  console.log('>>> [AdvancedChart] mountPersonYearComparison invoked successfully')
}

/**
 * Registers comparison handler on all active map views.
 * Uses a polling interval so that map views appearing after initial render
 * are discovered and configured with the latest config.
 */
export const registerGlobalPopupComparisonHandler = (
  originDataSource?: DataSource,
  comparisonOptions?: ComparisonOptions
): void => {
  const win = window as any
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
  comparisonOptions?: ComparisonOptions
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
      if (!view || typeof view.goTo !== 'function') continue

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

        // Attach comparison action to popupTemplate
        try {
          const tpl = graphic.popupTemplate?.clone ? graphic.popupTemplate.clone() : { ...(graphic.popupTemplate || {}) }
          const actions = Array.isArray(tpl.actions) ? [...tpl.actions] : []
          if (!actions.some((a: any) => a?.id === 'compare-parcels-year-action')) {
            actions.push({
              id: 'compare-parcels-year-action',
              title: '📈 مقارنة أراضي المالك عبر السنوات (سنة الرفع)',
              className: 'esri-icon-line-chart'
            })
          }
          tpl.actions = actions
          graphic.popupTemplate = tpl
        } catch (e) {}

        return graphic
      })

      // 2. Physically zoom in to the new parcel
      try {
        if (isPoint && extent) {
          await view.goTo({
            center: centerPoint,
            spatialReference: targetSR,
            scale: 2500,
            zoom: 17
          }, { duration: 1200 })
        } else if (extent && ExtentClass) {
          const esriExtent = new ExtentClass({
            xmin: extent.xmin,
            ymin: extent.ymin,
            xmax: extent.xmax,
            ymax: extent.ymax,
            spatialReference: targetSR
          })
          const expanded = typeof esriExtent.expand === 'function' ? esriExtent.expand(1.3) : esriExtent
          await view.goTo(expanded, { duration: 1200 })
        } else if (popupGraphics.length) {
          await view.goTo(popupGraphics.length === 1 ? popupGraphics[0] : popupGraphics, { duration: 1200 })
        } else if (extent) {
          await view.goTo(extent, { duration: 1200 })
        } else if (geometries.length) {
          await view.goTo(geometries.length === 1 ? geometries[0] : geometries, { duration: 1200 })
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

      // 3. Flash the new parcel on the map
      try {
        flashGraphicsOnView(view, popupGraphics, GraphicClass)
      } catch (flashErr) {}

      // 4. Highlight the new parcel (sole selection) on the layerView
      try {
        if (matchingLayer && typeof view.whenLayerView === 'function') {
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

      // 5. Open pop-up on the newly selected parcel.
      // Skipped when the clicked data point is an aggregate of several features,
      // because the pop-up would then describe whichever one the query returned first.
      try {
        if (openPopup && popupGraphics.length) {
          const popupLocation = centerPoint || (popupGraphics[0]?.geometry?.type === 'point' ? popupGraphics[0].geometry : null)
          if (view.popup) {
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

          setupPopupComparisonHandler(view, originDataSource, comparisonOptions)
          injectCompareButtonIntoPopupDOM(view, originDataSource, comparisonOptions, 0, popupGraphics[0])
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
 * Keep the selection of chart and output data source, publish message when selection changes.
 * When a person is clicked, queries their parcels from originDataSource, selects them, and zooms the map.
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
  openSelectionPopup: boolean = true,
  comparisonOptions?: ComparisonOptions
): [SelectionData, (...args: any[]) => any] => {
  const numberFieldsRef = hooks.useLatest(numberFields)
  const preSelectedIdsRef = React.useRef<string[]>()
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
      const activeCategoryField = categoryField || (series?.[0] as any)?.x
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

      if (personValues.length && activeCategoryField) {
        const clauses = personValues.map(v => {
          if (typeof v === 'number') {
            return `${activeCategoryField} = ${v}`
          }
          const strVal = String(v).replace(/'/g, "''")
          return `(${activeCategoryField} = '${strVal}' OR ${activeCategoryField} = N'${strVal}')`
        })
        const queryWhere = clauses.join(' OR ')

        const queryParams: FeatureLayerQueryParams = {
          where: queryWhere,
          returnGeometry: true,
          outFields: ['*']
        }

        const queriableDs = originDataSource as QueriableDataSource
        if (typeof queriableDs?.query === 'function') {
          queriableDs.query(queryParams).then((result) => {
            const parcelRecords = result?.records ?? []
            if (parcelRecords.length) {
              // Automatically zoom map in on the parcel(s), and display the pop-up
              // only when the clicked point maps to individual records.
              if (autoZoomToParcel) {
                zoomMapToRecords(parcelRecords, activeCategoryField, originDataSource, openSelectionPopup, comparisonOptions)
              }
            } else {
              clearPreviousMapSelection()
            }
          }).catch(err => {
            console.error('Failed to query parcel records for person:', err)
            clearPreviousMapSelection()
          })
          return
        }
      }
    }

    // Default publish if no originDataSource
    MessageManager.getInstance().publishMessage(
      new DataRecordsSelectionChangeMessage(widgetId, selectedRecords)
    )
  })

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

  React.useEffect(() => {
    registerGlobalPopupComparisonHandler(originDataSource, comparisonOptions)
  }, [originDataSource, comparisonOptions])

  const selectionData = React.useMemo(() => ({ selectionItems }), [selectionItems])
  return [selectionData, handleSelectionChange]
}

export default useSelection
