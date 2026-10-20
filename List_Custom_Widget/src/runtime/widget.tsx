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
import { categoryWhere, type CategoryItem } from './selection'
import './widget.css'

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const { config, id, useDataSources, intl } = props

  /* ── state ── */
  const [categories, setCategories] = React.useState<CategoryItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedValues, setSelectedValues] = React.useState<string[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const multiChoice = config?.enableMultiChoice === true

  /* ── refs ── */
  const dataSourceRef = React.useRef<DataSource | null>(null)
  const jimuMapViewRef = React.useRef<JimuMapView | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const toggleRef = React.useRef<HTMLButtonElement | null>(null)
  const selectedValuesRef = React.useRef<string[]>([])
  const selectionRevisionRef = React.useRef(0)
  const categoryLoadRevisionRef = React.useRef(0)
  const parentWhereRef = React.useRef<string>('1=1')
  const tableWhereRef = React.useRef<string>('1=1')
  const realFieldNameRef = React.useRef<string>(config?.categoryField || '')
  const hasLoadedRef = React.useRef<boolean>(false)

  React.useEffect(() => () => {
    ++selectionRevisionRef.current
    ++categoryLoadRevisionRef.current
  }, [])

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
    const loadRevision = ++categoryLoadRevisionRef.current

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
      if (realFieldName && loadRevision === categoryLoadRevisionRef.current) {
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
       // Do not include this widget's own runtime query. During a new
       // selection it can still contain the previous category, and for
       // All Items that would incorrectly keep the old category filter.
       // Other widget filters are supplied separately through parentWhere.
      pushWhere(parentWhere)
      if (filterSources.length === 0 && typeof (ds as any).getRemoteQueryParams !== 'function' && typeof (ds as any).getConfigQueryParams !== 'function') {
        pushWhere(layer?.definitionExpression)
        pushWhere((ds as any).getDefinitionExpression?.())
      }
      const effectiveWhere = filterSources.length > 0 ? filterSources.join(' AND ') : '1=1'
      if (loadRevision === categoryLoadRevisionRef.current) tableWhereRef.current = effectiveWhere

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
      if (loadRevision !== categoryLoadRevisionRef.current) return
      setCategories(finalItems)
      console.log(`[Widget ${id}] Loaded Categories (${finalItems.length}):`, finalItems)
      return finalItems

    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      if (loadRevision === categoryLoadRevisionRef.current) setLoading(false)
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

  /* ── publish StringSelectionChangeMessage for cascading ── */
  const publishSelectionMessage = React.useCallback((values: string[]) => {
    MessageManager.getInstance().publishMessage(
      new StringSelectionChangeMessage(id, values.join(','))
    )
  }, [id])

  const applySelection = React.useCallback(async (nextValues: string[]) => {
    const selectionRevision = ++selectionRevisionRef.current
    selectedValuesRef.current = nextValues
    setSelectedValues(nextValues)

    // Publish for cascading (to other widget types via Action panel)
    publishSelectionMessage(nextValues)

    const ds = dataSourceRef.current
    if (!ds || !config?.categoryField) return

    const layerDs = ds as any
    const where = categoryWhere(realFieldNameRef.current || config.categoryField, nextValues, categories)

    // 1. Update map filter (widget-scoped)
    layerDs.updateQueryParams({ where } as FeatureLayerQueryParams, id)

    // 2. Zoom to the combined extent of all matching features
    const jmv = jimuMapViewRef.current
    if (jmv?.view) {
      try {
        const isAllItems = nextValues.length === 0

        // Keep the Table/Data Source filter in the server query. The category
        // condition is added only for a category selection.
        const tableWhere = tableWhereRef.current !== '1=1'
          ? `(${tableWhereRef.current})`
          : ''
        const combinedWhere = [tableWhere, where !== '1=1' ? `(${where})` : '']
          .filter(Boolean)
          .join(' AND ') || '1=1'

        const featureLayer = layerDs.layer || layerDs.getLayerDefinition?.()?.layer

        let zoomExtent: any = null

        const extentWhere = isAllItems ? (tableWhere || '1=1') : combinedWhere

        // Use the same server-side queryExtent pattern as the reference
        // implementation. No feature geometries are downloaded or unioned.
        if (featureLayer && typeof featureLayer.queryExtent === 'function') {
          try {
            const result = await featureLayer.queryExtent({ where: extentWhere })
            if (result?.extent) zoomExtent = result.extent
          } catch (e) {
            console.warn('[Widget] Server-side extent query failed', e)
          }
        }

        // DataSource queryExtent is a secondary server-side option.
        if (!zoomExtent && typeof (ds as any).queryExtent === 'function') {
          try {
            const result = await (ds as any).queryExtent({ where: extentWhere })
            if (result?.extent) zoomExtent = result.extent
          } catch (e) {
            console.warn('[Widget] Data source server extent query failed', e)
          }
        }


        // Rapid checkbox changes can complete out of order; only the latest may move the map.
        if (selectionRevision !== selectionRevisionRef.current) return
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
        }
      } catch (err) {
        console.error('Zoom failed:', err)
      }
    }
  }, [categories, config?.categoryField, id, publishSelectionMessage])

  const onItemSelect = (selected: string) => {
    const current = selectedValuesRef.current
    const next = multiChoice
      ? (current.includes(selected) ? current.filter(code => code !== selected) : [...current, selected])
      : [selected]
    if (!multiChoice) {
      toggleRef.current?.focus()
      setIsOpen(false)
    }
    void applySelection(next)
  }

  const resetSelection = () => {
    // Move focus before Reset becomes disabled, so clearing does not dismiss the menu.
    toggleRef.current?.focus()
    void applySelection([])
  }

  React.useEffect(() => {
    if (!multiChoice && selectedValuesRef.current.length > 1) {
      void applySelection(selectedValuesRef.current.slice(0, 1))
    }
  }, [multiChoice, applySelection])

  /* ── CASCADING: detect when another widget filters the shared data source ── */
  const onDataSourceInfoChange = React.useCallback((info: IMDataSourceInfo) => {
    if (!dataSourceRef.current || !config?.categoryField) return
    const widgetQueries: any = info?.widgetQueries
    const queries = typeof widgetQueries?.asMutable === 'function'
      ? widgetQueries.asMutable({ deep: true })
      : widgetQueries || {}
    const parentWhere = Object.keys(queries)
      .filter(widgetId => widgetId !== id)
      .map(widgetId => queries[widgetId]?.where)
      .filter(where => where && where !== '1=1')
      .map(where => `(${where})`)
      .join(' AND ') || '1=1'
    if (parentWhere === parentWhereRef.current) return
    parentWhereRef.current = parentWhere
    // Prevent an older category/extent response from undoing a newer checkbox selection.
    ++selectionRevisionRef.current
    void loadCategories(dataSourceRef.current, parentWhere, false).then(newCategories => {
      if (!newCategories || parentWhere !== parentWhereRef.current) return
      const available = new Set(newCategories.map(category => String(category.value)))
      const current = selectedValuesRef.current
      const retained = current.filter(code => available.has(code))
      if (retained.length !== current.length) void applySelection(retained)
    })
  }, [config?.categoryField, id, loadCategories, applySelection])

  /* ── derived labels ── */
  const buttonLabel = config?.buttonLabel || 'اختر التصنيف'
  const allItemsLabel = config?.allItemsLabel || 'كل التصنيفات'

  const selectedLabels = selectedValues.map(code => categories.find(category => String(category.value) === code)?.label || code)
  const displayLabel = selectedValues.length > 1
    ? `تم اختيار ${selectedValues.length}`
    : selectedLabels[0] || buttonLabel
  const menuId = `${id}-category-menu`

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
      <div className="dropdown-wrapper" ref={wrapperRef}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsOpen(false)
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setIsOpen(false)
            toggleRef.current?.focus()
          }
        }}
      >
        <button
          ref={toggleRef}
          className={`dropdown-btn${isOpen ? ' open' : ''}`}
          onClick={() => setIsOpen((prev: boolean) => !prev)}
          type="button"
          aria-expanded={isOpen}
          aria-controls={menuId}
          title={selectedLabels.join('، ')}
        >
          <span className="category-summary">{displayLabel}</span>
          <span className="chevron" aria-hidden="true">▼</span>
        </button>

        <div id={menuId} className={`dropdown-list${isOpen ? ' show' : ''}`} aria-hidden={!isOpen}>
          <div className="dropdown-toolbar">
            <span aria-live="polite">{`المحدد: ${selectedValues.length}`}</span>
            <button type="button" className="category-reset" disabled={!selectedValues.length} onClick={resetSelection}>
              إعادة تعيين
            </button>
          </div>
          <button
            type="button"
            className={`dropdown-item dropdown-all${selectedValues.length === 0 ? ' selected' : ''}`}
            onClick={() => {
              resetSelection()
              if (!multiChoice) setIsOpen(false)
            }}
          >
            {allItemsLabel}
          </button>

          <ul className="category-options" aria-label={buttonLabel}>
            {categories.map(cat => (
              <li key={String(cat.value)}>
                <button
                  type="button"
                  className={`dropdown-item category-option${selectedValues.includes(String(cat.value)) ? ' selected' : ''}`}
                  role={multiChoice ? 'checkbox' : undefined}
                  aria-checked={multiChoice ? selectedValues.includes(String(cat.value)) : undefined}
                  aria-pressed={!multiChoice ? selectedValues.includes(String(cat.value)) : undefined}
                  onClick={() => onItemSelect(String(cat.value))}
                >
                  {multiChoice && (
                    <span className="category-checkbox" aria-hidden="true">
                      {selectedValues.includes(String(cat.value)) && (
                        <svg viewBox="0 0 16 16" width="14" height="14" focusable="false">
                          <path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                    </span>
                  )}
                  <span className="category-label">{cat.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
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
