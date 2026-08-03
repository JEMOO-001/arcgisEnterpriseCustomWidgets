/** @jsx jsx */
/** @jsxFrag React.Fragment */
import {
  React,
  jsx,
  type AllWidgetProps,
  DataSourceComponent,
  type DataSource,
  type FeatureLayerQueryParams,
  type IMDataSourceInfo,
  MessageManager,
  StringSelectionChangeMessage
} from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Loading, LoadingType } from 'jimu-ui'
import { type IMConfig } from '../config'
import './widget.css'

interface CategoryItem {
  value: string | number
  label: string
}

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const { config, id, useDataSources, intl } = props

  /* ── state ── */
  const [categories, setCategories] = React.useState<CategoryItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  /* ── refs ── */
  const dataSourceRef = React.useRef<DataSource | null>(null)
  const jimuMapViewRef = React.useRef<JimuMapView | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const parentWhereRef = React.useRef<string>('1=1')
  const realFieldNameRef = React.useRef<string>(config?.categoryField || '')
  const hasLoadedRef = React.useRef<boolean>(false)

  /* ── force overflow visible on all ExB parent wrappers ── */
  React.useEffect(() => {
    if (!wrapperRef.current) return
    let el: HTMLElement | null = wrapperRef.current.parentElement
    while (el && el !== document.body) {
      el.style.overflow = 'visible'
      el = el.parentElement
    }
  })

  /* ── click-outside to close dropdown ── */
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])



  /* ── map view callback ── */
  const onActiveViewChange = React.useCallback((jmv: JimuMapView) => {
    jimuMapViewRef.current = jmv
  }, [])

  /* ── load unique category values (respects layer filters + parent WHERE filter) ── */
  const loadCategories = React.useCallback(async (ds: DataSource, parentWhere: string = '1=1', showLoading: boolean = true) => {
    if (!config?.categoryField) return []

    if (showLoading) setLoading(true)
    try {
      const seen = new Map<string, CategoryItem>()

      const layer = (ds as any).layer
        || (ds as any).getLayer?.()
        || (ds as any)._innerLayer
        || (ds as any).layerDefinition

      if (layer && typeof layer.load === 'function') {
        await layer.load()
      }

      // 1. Resolve real database field name vs jimuName vs alias
      let realFieldName = config.categoryField
      let jimuFieldName = config.categoryField
      let fieldType: string | undefined

      if (ds && typeof (ds as any).getSchema === 'function') {
        try {
          const schema = (ds as any).getSchema()
          if (schema?.fields) {
            const fSchema = schema.fields[config.categoryField] || Object.values(schema.fields).find(
              (f: any) => f.jimuName === config.categoryField || f.name === config.categoryField || f.alias === config.categoryField || f.name?.toLowerCase() === config.categoryField?.toLowerCase()
            )
            if (fSchema) {
              if (fSchema.name) realFieldName = fSchema.name
              if (fSchema.jimuName) jimuFieldName = fSchema.jimuName
              fieldType = fSchema.type
            }
          }
        } catch { }
      }

      if (layer?.fields?.length > 0 && (!realFieldName || realFieldName === config.categoryField)) {
        const fieldObj = layer.fields.find(
          (f: any) => f.name === config.categoryField || f.alias === config.categoryField || f.jimuName === config.categoryField || f.name?.toLowerCase() === config.categoryField?.toLowerCase()
        )
        if (fieldObj?.name) realFieldName = fieldObj.name
        if (fieldObj?.type) fieldType = fieldObj.type
      }

      // Remember the real DB field name so later WHERE clauses (filter + zoom) use it
      if (realFieldName) {
        realFieldNameRef.current = realFieldName
      }

      // 2. Subtype / coded-value domain catalog — used for LABELS only.
      //    Which values are shown is decided by the actual data below.
      const labelMap = new Map<string, { value: any, label: string }>()
      if (layer?.subtypes?.length > 0 && layer.subtypeField === realFieldName) {
        layer.subtypes.forEach((st: any) => {
          labelMap.set(String(st.code ?? st.id), { value: st.code ?? st.id, label: String(st.name) })
        })
      }
      const domainField = layer?.fields?.find(
        (f: any) => f.name === realFieldName || f.name === config.categoryField || f.name === jimuFieldName
      )
      if (domainField?.domain?.codedValues?.length > 0) {
        domainField.domain.codedValues.forEach((cv: any) => {
          labelMap.set(String(cv.code ?? cv.value), { value: cv.code ?? cv.value, label: String(cv.name ?? cv.label) })
        })
      }

      const getRawValue = (r: any): any => {
        if (!r) return undefined
        if (typeof r.getFieldValue === 'function') {
          const v1 = r.getFieldValue(jimuFieldName)
          if (v1 != null) return v1
          const v2 = r.getFieldValue(realFieldName)
          if (v2 != null) return v2
          const v3 = r.getFieldValue(config.categoryField)
          if (v3 != null) return v3
        }
        const data = typeof r.getData === 'function' ? r.getData() : (r.attributes || r.feature?.attributes || r)
        if (data) {
          if (data[realFieldName] != null) return data[realFieldName]
          if (data[jimuFieldName] != null) return data[jimuFieldName]
          if (data[config.categoryField] != null) return data[config.categoryField]
          const kLow = (realFieldName || '').toLowerCase()
          const foundKey = Object.keys(data).find(k => k.toLowerCase() === kLow)
          if (foundKey && data[foundKey] != null) return data[foundKey]
        }
        return undefined
      }

      // 3. Collect EVERY filter applied to this layer / data source:
      //    - filters configured outside ExB (e.g. web map layer filter)
      //    - filters configured at the ExB data source level
      //    - runtime filters from OTHER widgets (excludes this widget's own selection)
      //    - the parentWhere passed in from onDataSourceInfoChange
      //    The layer's definition expression is used only as a fallback, because ExB
      //    may also merge widget-applied queries into it.
      const filterSources: string[] = []
      const pushWhere = (w: any) => {
        if (w && typeof w === 'string' && w.trim() !== '' && w.trim().toLowerCase() !== '1=1') {
          filterSources.push(`(${w.trim()})`)
        }
      }
      pushWhere((ds as any).getRemoteQueryParams?.()?.where)
      pushWhere((ds as any).getConfigQueryParams?.()?.where)
      pushWhere((ds as any).getRuntimeQueryParams?.(id)?.where)
      pushWhere(parentWhere)
      if (filterSources.length === 0) {
        pushWhere(layer?.definitionExpression)
        pushWhere((ds as any).getDefinitionExpression?.())
      }
      const effectiveWhere = filterSources.length > 0 ? filterSources.join(' AND ') : '1=1'

      console.log(`[Widget ${id}] Categories effectiveWhere:`, effectiveWhere)

      const pushItem = (raw: any) => {
        if (raw == null) return
        const strKey = String(raw)
        if (strKey.trim() === '') return
        if (seen.has(strKey)) return
        const mapped = labelMap.get(strKey)
        seen.set(strKey, { value: raw, label: mapped ? mapped.label : strKey })
      }

      // 4. METHOD A - distinct value query: server-side, filter-aware, works for any field type.
      //    Skipped for date fields so METHOD B can produce formatted labels.
      const isDateField = fieldType === 'esriFieldTypeDate'
      let dataQueryFailed = false
      try {
        if (!isDateField && layer && typeof layer.queryFeatures === 'function') {
          const res = await layer.queryFeatures({
            where: effectiveWhere,
            outFields: [realFieldName],
            returnDistinctValues: true,
            returnGeometry: false
          })
          res?.features?.forEach((f: any) => {
            let raw = f?.attributes?.[realFieldName]
            if (raw == null && jimuFieldName !== realFieldName) raw = f?.attributes?.[jimuFieldName]
            if (raw == null) {
              const key = Object.keys(f?.attributes || {}).find(k => k.toLowerCase() === realFieldName.toLowerCase())
              if (key != null) raw = f.attributes[key]
            }
            pushItem(raw)
          })
        }
      } catch (e) {
        console.warn('[Widget] Distinct value query failed, falling back to record query', e)
      }

      // 5. METHOD B - query all records (paged) and aggregate values
      if (seen.size === 0) {
        try {
          const pageSize = 2000
          for (let start = 0; start < 40000; start += pageSize) {
            let records: any[] = []
            if (layer && typeof layer.queryFeatures === 'function') {
              const res = await layer.queryFeatures({
                where: effectiveWhere,
                outFields: ['*'],
                returnGeometry: false,
                num: pageSize,
                start
              })
              records = res?.features || []
            } else {
              const result = await (ds as any).query({
                where: effectiveWhere,
                outFields: ['*'],
                returnGeometry: false,
                pageSize,
                start
              })
              records = result?.records || []
            }

            records.forEach((r: any) => {
              const raw = getRawValue(r)
              if (raw == null) return
              const strKey = String(raw)
              if (strKey.trim() === '') return
              if (seen.has(strKey)) return
              let label = labelMap.get(strKey)?.label || strKey
              if (!labelMap.has(strKey) && typeof r.getFormattedFieldValue === 'function') {
                try {
                  const fmt = r.getFormattedFieldValue?.(jimuFieldName, intl)
                    || r.getFormattedFieldValue?.(realFieldName, intl)
                    || r.getFormattedFieldValue?.(config.categoryField, intl)
                  if (fmt && typeof fmt === 'string' && fmt !== strKey) label = fmt
                } catch { }
              }
              seen.set(strKey, { value: raw, label })
            })

            if (records.length < pageSize) break
          }
        } catch (e) {
          console.warn('[Widget] Record query failed', e)
          dataQueryFailed = true
        }
      }

      // 6. FALLBACK - only when the data query itself failed, or when no filter is active
      //    and the layer returned no records, use the subtype/domain catalog.
      if (seen.size === 0 && (dataQueryFailed || effectiveWhere === '1=1')) {
        labelMap.forEach((entry) => {
          pushItem(entry.value)
        })
      }

      // 7. Sort & save
      const finalItems = Array.from(seen.values())
      finalItems.sort((a, b) => String(a.label).localeCompare(String(b.label), 'ar'))
      setCategories(finalItems)
      console.log(`[Widget ${id}] Loaded Categories (${finalItems.length}):`, finalItems)
      return finalItems

    } catch (err) {
      console.error('Failed to load categories:', err)
      return []
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [config?.categoryField, intl, id])

  React.useEffect(() => {
    if (dataSourceRef.current && config?.categoryField) {
      loadCategories(dataSourceRef.current, parentWhereRef.current, true)
    }
  }, [config?.categoryField, loadCategories])

  /* ── initial data source load (only once) ── */
  const onDataSourceCreated = React.useCallback(async (ds: DataSource) => {
    dataSourceRef.current = ds
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      await loadCategories(ds, '1=1', true)
    }
  }, [loadCategories])

  /* ── CASCADING: detect when another widget filters the shared data source ── */
  const onDataSourceInfoChange = React.useCallback((info: IMDataSourceInfo) => {
    if (!dataSourceRef.current || !config?.categoryField) return

    const widgetQueries = info?.widgetQueries
    let parentWhere = '1=1'

    console.log(`[Widget ${id}] onDataSourceInfoChange — widgetQueries:`, JSON.stringify(widgetQueries))

    if (widgetQueries) {
      const otherWheres: string[] = []

      // widgetQueries is a Seamless-Immutable object — safely convert
      const queriesObj: any = typeof (widgetQueries as any).asMutable === 'function'
        ? (widgetQueries as any).asMutable({ deep: true })
        : widgetQueries

      Object.keys(queriesObj).forEach((wId: string) => {
        if (wId !== id) {
          const w = queriesObj[wId]?.where
          console.log(`[Widget ${id}] Found query from widget ${wId}:`, w)
          if (w && w !== '1=1') {
            otherWheres.push(w)
          }
        }
      })

      if (otherWheres.length > 0) {
        parentWhere = otherWheres.join(' AND ')
      }
    }

    console.log(`[Widget ${id}] Computed parentWhere:`, parentWhere, '| Previous:', parentWhereRef.current)

    // Only re-load categories when the parent filter actually changed
    if (parentWhere !== parentWhereRef.current) {
      parentWhereRef.current = parentWhere

      // Load new categories based on the new parent filter
      loadCategories(dataSourceRef.current, parentWhere, false).then((newCategories: CategoryItem[]) => {
        // Only reset our own selection if the currently selected value is NO LONGER valid
        // in the newly filtered list.
        if (activeCategory !== null) {
          const stillValid = newCategories?.some((c: CategoryItem) => String(c.value) === activeCategory)
          if (!stillValid) {
            setActiveCategory(null);
            (dataSourceRef.current as any).updateQueryParams({ where: '1=1' } as FeatureLayerQueryParams, id)
          }
        }
      })
    }
  }, [config?.categoryField, id, loadCategories, activeCategory])

  /* ── publish StringSelectionChangeMessage for cascading ── */
  const publishSelectionMessage = React.useCallback((values: string[]) => {
    MessageManager.getInstance().publishMessage(
      new StringSelectionChangeMessage(id, values.join(','))
    )
  }, [id])

  /* ── item selected ── */
  const onItemSelect = async (val: string | null, label: string) => {
    setActiveCategory(val);
    setIsOpen(false)

    // Publish for cascading (to other widget types via Action panel)
    publishSelectionMessage(val !== null ? [val] : [])

    const ds = dataSourceRef.current
    if (!ds || !config?.categoryField) return

    let where = '1=1'
    if (val !== null) {
      const catItem = categories.find((c: CategoryItem) => String(c.value) === val)
      const originalValue = catItem ? catItem.value : val
      const whereField = realFieldNameRef.current || config.categoryField

      if (typeof originalValue === 'number') {
        where = `${whereField} = ${originalValue}`
      } else {
        where = `${whereField} = '${String(originalValue).replace(/'/g, "''")}'`
      }
    }

    // 1. Update map filter (widget-scoped)
    (ds as any).updateQueryParams({ where } as FeatureLayerQueryParams, id)

    // 2. Zoom to the combined extent of all matching features
    const jmv = jimuMapViewRef.current
    if (jmv?.view) {
      try {
        const isAllItems = val === null

        // A category selection must include every feature in that category.
        // The all-items selection is intentionally different: it returns to
        // the complete extent of the configured feature layer, regardless of
        // the current category or other widget filters.
        const combinedWhere = parentWhereRef.current !== '1=1'
          ? `(${parentWhereRef.current}) AND (${where})`
          : where

        const layerDs = ds as any
        const featureLayer = layerDs.layer || layerDs.getLayerDefinition?.()?.layer

        let zoomExtent: any = null
        const zoomGraphics: any[] = []

        const tableWhere = isAllItems ? parentWhereRef.current : combinedWhere

        // Fast path: ask the filtered data source for an aggregate extent.
        // This keeps the Table/Data Source filters while avoiding transfer of
        // every feature geometry to the browser.
        if (typeof (ds as any).queryExtent === 'function') {
          try {
            const result = await (ds as any).queryExtent({ where: tableWhere })
            if (result?.extent) zoomExtent = result.extent
          } catch (e) {
            console.warn('[Widget] Data source queryExtent failed, paging records', e)
          }
        }

        // The table/data source remains the source of truth. If it does not
        // expose queryExtent(), query every filtered table record and union its
        // geometry. This is slower but preserves exact filter behavior.
        if (!zoomExtent && typeof (ds as any).query === 'function') {
          try {
            const pageSize = 1000
            for (let start = 0; start < 40000; start += pageSize) {
              const result = await (ds as any).query({
                where: tableWhere,
                outFields: ['*'],
                returnGeometry: true,
                pageSize,
                start
              })
              const records = result?.records || []
              records.forEach((record: any) => {
                const feature = typeof record?.getFeature === 'function'
                  ? record.getFeature()
                  : record?.feature
                const geometry = feature?.geometry || record?.geometry
                if (geometry) zoomGraphics.push({ geometry })
              })
              if (records.length < pageSize) break
            }

            for (const graphic of zoomGraphics) {
              const extent = graphic.geometry?.extent || graphic.geometry
              if (!extent) continue
              zoomExtent = zoomExtent ? zoomExtent.union(extent) : (extent.clone?.() || extent)
            }
          } catch (e) {
            console.warn('[Widget] Filtered table extent query failed, falling back', e)
          }
        }

        // Fallback only for data sources that expose neither queryExtent() nor
        // query(). The supplied WHERE still includes the parent/category
        // selection.
        if (!zoomExtent && featureLayer && typeof featureLayer.queryExtent === 'function') {
          try {
            const extentResult = await featureLayer.queryExtent({ where: tableWhere })
            if (extentResult?.extent) zoomExtent = extentResult.extent
          } catch (e) {
            console.warn('[Widget] Layer queryExtent failed, falling back to records', e)
          }
        }

        // Last fallback for a raw FeatureLayer data source.
        if (!zoomExtent && featureLayer && typeof featureLayer.queryFeatures === 'function') {
          try {
            const pageSize = 1000
            for (let start = 0; start < 20000; start += pageSize) {
              const res = await featureLayer.queryFeatures({
                where: tableWhere,
                returnGeometry: true,
                outFields: ['*'],
                num: pageSize,
                start
              })
              const feats = res?.features || []
              feats.forEach((f: any) => {
                if (f?.geometry) zoomGraphics.push(f)
              })
              if (feats.length < pageSize) break
            }

            for (const g of zoomGraphics) {
              const geom = g.geometry
              const gExtent = geom?.extent || geom
              if (!gExtent) continue
              zoomExtent = zoomExtent ? zoomExtent.union(gExtent) : (gExtent.clone?.() || gExtent)
            }
          } catch (e) {
            console.warn('[Widget] Record extent fallback failed', e)
          }
        }

        if (zoomExtent) {
          const w = (zoomExtent as any).width
          const h = (zoomExtent as any).height
          if (w === 0 || h === 0) {
            // Degenerate extent (e.g. a single point): center the view instead
            await jmv.view.goTo({ target: zoomExtent.center, zoom: jmv.view.zoom })
          } else if (isAllItems) {
            // Do not pad the configured full extent. This returns exactly to
            // the complete layer extent requested by the widget behavior.
            await jmv.view.goTo(zoomExtent)
          } else {
            // Add 20% padding around the extent
            await jmv.view.goTo(zoomExtent.expand(1.2))
          }
        } else if (zoomGraphics.length > 0) {
          await jmv.view.goTo(zoomGraphics)
        }
      } catch (err) {
        console.error('Zoom failed:', err)
      }
    }
  }

  /* ── derived labels ── */
  const buttonLabel = config?.buttonLabel || 'اختر التصنيف'
  const allItemsLabel = config?.allItemsLabel || 'كل التصنيفات'

  const displayLabel = activeCategory !== null
    ? (categories.find((c: CategoryItem) => String(c.value) === activeCategory)?.label || activeCategory)
    : buttonLabel

  /* ── guard: not configured ── */
  if (!useDataSources?.[0] || !config?.categoryField) {
    return (
      <div className="p-3 text-center" dir="rtl">
        يرجى إختيار &quot;تصنيف البيانات&quot; من الإعدادات.
      </div>
    )
  }

  /* ── render ── */
  return (
    <div className="widget-list-custom" dir="rtl">

      {loading && (
        <div className="loading-overlay">
          <Loading type={LoadingType.Secondary} />
        </div>
      )}

      {/* Button + Dropdown */}
      <div className="dropdown-wrapper" ref={wrapperRef}>
        <button
          className={`dropdown-btn${isOpen ? ' open' : ''}`}
          onClick={() => setIsOpen((prev: boolean) => !prev)}
          type="button"
        >
          <span>{displayLabel}</span>
          <span className="chevron">▼</span>
        </button>

        <ul className={`dropdown-list${isOpen ? ' show' : ''}`}>
          {/* "All" option */}
          <li
            className={`dropdown-item${activeCategory === null ? ' selected' : ''}`}
            onClick={() => onItemSelect(null, allItemsLabel)}
          >
            {allItemsLabel}
          </li>

          {categories.map((cat: CategoryItem) => (
            <li
              key={String(cat.value)}
              className={`dropdown-item${activeCategory === String(cat.value) ? ' selected' : ''}`}
              onClick={() => onItemSelect(String(cat.value), cat.label)}
            >
              {cat.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Data source + map wiring */}
      <DataSourceComponent
        useDataSource={useDataSources[0]}
        onDataSourceCreated={onDataSourceCreated}
        onDataSourceInfoChange={onDataSourceInfoChange}
        widgetId={id}
      />
      {config?.mapWidgetId && <JimuMapViewComponent useMapWidgetId={config.mapWidgetId} onActiveViewChange={onActiveViewChange} />}
    </div>
  )
}
