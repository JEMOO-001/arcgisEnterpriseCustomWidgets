/** @jsx jsx */
/** @jsxFrag React.Fragment */
import {
  React,
  jsx,
  type AllWidgetProps,
  DataSourceComponent,
  type DataSource,
  type FeatureLayerQueryParams,
  type DataRecord,
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

  /* ── load unique category values (with optional parent WHERE filter) ── */
  /* ── load unique category values (with optional parent WHERE filter) ── */
  const loadCategories = React.useCallback(async (ds: DataSource, parentWhere: string = '1=1', showLoading: boolean = true) => {
    if (!config?.categoryField) return

    if (showLoading) setLoading(true)
    try {
      const items: CategoryItem[] = []
      const seen = new Map<any, CategoryItem>()

      const layer = (ds as any).layer
        || (ds as any).getLayer?.()
        || (ds as any)._innerLayer
        || (ds as any).layerDefinition

      if (layer && typeof layer.load === 'function') {
        await layer.load()
      }

      // METHOD 1 - Read from Subtype directly
      if (layer?.subtypes?.length > 0 && layer.subtypeField === config.categoryField) {
        layer.subtypes.forEach((st: any) => {
          items.push({
            value: st.code ?? st.id,
            label: String(st.name)
          })
        })
      }

      // METHOD 2 - Read from Coded Value Domain
      if (items.length === 0) {
        const field = layer?.fields?.find(
          (f: any) => f.name === config.categoryField || f.alias === config.categoryField
        )
        if (field?.domain?.type === 'coded-value' || field?.domain?.codedValues?.length > 0) {
          const cvs = field.domain.codedValues || []
          cvs.forEach((cv: any) => {
            items.push({
              value: cv.code ?? cv.value,
              label: String(cv.name ?? cv.label)
            })
          })
        }
      }

      // If Method 1 or 2 worked, prune codes not active in parent filter
      if (items.length > 0 && parentWhere !== '1=1') {
        try {
          const result = await (ds as any).query({
            where: parentWhere,
            outFields: [config.categoryField],
            returnGeometry: false
          })
          const validCodes = new Set()
          result?.records?.forEach((r: any) => {
            const raw = r.getData()?.[config.categoryField]
            if (raw != null) validCodes.add(raw)
          })
          if (validCodes.size > 0) {
            for (let i = items.length - 1; i >= 0; i--) {
              if (!validCodes.has(items[i].value)) {
                items.splice(i, 1)
              }
            }
          }
        } catch (e) {
          console.warn('Parent filter application failed on domain payload', e)
        }
      }

      // METHOD 3 - Use ds.query with getFormattedFieldValue
      if (items.length === 0) {
        try {
          const result = await (ds as any).query({
            where: parentWhere,
            outFields: [config.categoryField],
            pageSize: 5000,
            returnGeometry: false
          })
          result?.records?.forEach((r: any) => {
            const raw = r.getData()?.[config.categoryField]
            if (raw == null || seen.has(raw)) return
            let label = String(raw)
            try {
              const fmt = r.getFormattedFieldValue?.(config.categoryField, intl)
              if (fmt && typeof fmt === 'string' && fmt !== String(raw)) {
                label = fmt
              } else if (r.feature?.attributes) {
                const featRaw = r.feature.attributes[config.categoryField]
                if (featRaw != null) label = String(featRaw)
              }
            } catch { }
            seen.set(raw, { value: raw, label })
          })

          if (seen.size > 0) {
            seen.forEach(val => items.push(val))
          }
        } catch (e) {
          console.warn('Method 3 ds.query failed', e)
        }
      }

      // METHOD 4 - Direct layer.queryFeatures fallback
      if (items.length === 0 && layer && typeof layer.queryFeatures === 'function') {
        try {
          const res = await layer.queryFeatures({
            where: parentWhere,
            outFields: [config.categoryField],
            returnGeometry: false,
            returnDistinctValues: true
          })
          res?.features?.forEach((f: any) => {
            const raw = f.attributes?.[config.categoryField]
            if (raw != null && !seen.has(raw)) {
              seen.set(raw, { value: raw, label: String(raw) })
            }
          })
          if (seen.size > 0) {
            seen.forEach(val => items.push(val))
          }
        } catch (e) {
          console.warn('Method 4 layer.queryFeatures failed', e)
        }
      }

      // Apply Sort & Save Result
      items.sort((a, b) => String(a.label).localeCompare(String(b.label), 'ar'))
      setCategories(items)
      console.log(`[Widget ${id}] Loaded Categories:`, items)
      return items

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
            setActiveCategory(null)
            dataSourceRef.current.updateQueryParams({ where: '1=1' } as FeatureLayerQueryParams, id)
          }
        }
      })
    }
  }, [config?.categoryField, id, loadCategories, activeCategory])

  /* ── publish StringSelectionChangeMessage for cascading ── */
  const publishSelectionMessage = React.useCallback((values: string[]) => {
    MessageManager.getInstance().publishMessage(
      new StringSelectionChangeMessage(id, values)
    )
  }, [id])

  /* ── item selected ── */
  const onItemSelect = async (val: string | null, label: string) => {
    setActiveCategory(val)
    setIsOpen(false)

    // Publish for cascading (to other widget types via Action panel)
    publishSelectionMessage(val !== null ? [val] : [])

    const ds = dataSourceRef.current
    if (!ds || !config?.categoryField) return

    let where = '1=1'
    if (val !== null) {
      const catItem = categories.find((c: CategoryItem) => String(c.value) === val)
      const originalValue = catItem ? catItem.value : val

      if (typeof originalValue === 'number') {
        where = `${config.categoryField} = ${originalValue}`
      } else {
        where = `${config.categoryField} = '${String(originalValue).replace(/'/g, "''")}'`
      }
    }

    // 1. Update map filter (widget-scoped)
    ds.updateQueryParams({ where } as FeatureLayerQueryParams, id)

    // 2. Zoom to the combined extent of all matching features
    const jmv = jimuMapViewRef.current
    if (jmv?.view) {
      try {
        // Combine parent filter with our own filter for zooming
        const combinedWhere = parentWhereRef.current !== '1=1'
          ? `(${parentWhereRef.current}) AND (${where})`
          : where

        // Try using the feature layer's queryExtent for precise calculation
        const layerDs = ds as any
        const featureLayer = layerDs.layer || layerDs.getLayerDefinition?.()?.layer

        if (featureLayer?.queryExtent) {
          const extentResult = await featureLayer.queryExtent({
            where: combinedWhere
          })
          if (extentResult?.extent) {
            // Add 20% padding around the extent
            await jmv.view.goTo(extentResult.extent.expand(1.2))
          }
        } else {
          // Fallback: query records and compute extent from graphics
          const query: FeatureLayerQueryParams = { where: combinedWhere, returnGeometry: true, outFields: ['*'] }
          const result = await layerDs.query(query)
          if (result?.records?.length > 0) {
            const graphics = result.records.map((r: DataRecord) => (r as any).feature).filter(Boolean)
            if (graphics.length > 0) {
              // Build a union extent from all graphics
              let extent: any = null
              for (const g of graphics) {
                const geom = g.geometry
                if (!geom) continue
                const gExtent = geom.extent || geom
                extent = extent ? extent.union(gExtent) : gExtent.clone?.() || gExtent
              }
              if (extent?.expand) {
                await jmv.view.goTo(extent.expand(1.2))
              } else {
                await jmv.view.goTo(graphics)
              }
            }
          }
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
