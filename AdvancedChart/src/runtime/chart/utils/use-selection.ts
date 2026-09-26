import { React, type IMState, ReactRedux, lodash, MessageManager, DataRecordsSelectionChangeMessage, type DataSource, hooks, type DataRecord, type ImmutableArray, type QueriableDataSource, type FeatureLayerQueryParams } from 'jimu-core'
import { type SelectionData, SelectionSource, getSplitByField, type WebChartDataItem } from 'jimu-ui/advanced/chart'
import { MapViewManager, zoomToUtils, loadArcGISJSAPIModules } from 'jimu-arcgis'
import { type WebChartSeries } from '../../../config'
import convertDataItemsFromUpperCase from './convert-data-items-from-uppercase'

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
 * Directly zooms active map views to the provided parcel records, flashes the new parcel,
 * highlights it as the sole selection, and displays its pop-up.
 */
export const zoomMapToRecords = async (
  records: DataRecord[],
  categoryField?: string,
  originDataSource?: DataSource,
  openPopup: boolean = true
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
  openSelectionPopup: boolean = true
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
                zoomMapToRecords(parcelRecords, activeCategoryField, originDataSource, openSelectionPopup)
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
  const selectionData = React.useMemo(() => ({ selectionItems }), [selectionItems])
  return [selectionData, handleSelectionChange]
}

export default useSelection
