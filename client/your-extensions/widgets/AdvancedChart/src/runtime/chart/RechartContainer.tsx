import { React, ReactRedux, DataSourceManager, Immutable, type ImmutableObject, type UseDataSource, type WidgetInitDragCallback, type QueriableDataSource, type IMState, type DataSource, dataSourceUtils } from 'jimu-core'
import { type ChartComponentProps, type ChartTools, type IWebChart, type TemplateType, type RechartConfig } from '../../config'
import { getChartText, DefaultTitleSize, DefaultTitleColor } from '../../utils/default'
import { ChartRuntimeStateProvider } from '../state'
import Chart from './index'

function escapeRegex (str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Scans record data/attributes for an airport name.
 * Discards purely numeric IDs/numbers (e.g. "15", 15) to ensure only actual airport names are used.
 */
export function findAirportNameInAttributes (data: Record<string, any>): string | undefined {
  if (!data || typeof data !== 'object') return undefined

  const isGoodAirportName = (val: any): boolean => {
    if (val == null) return false
    const str = String(val).trim()
    if (!str) return false
    if (/^\d+$/.test(str)) return false
    if (/^(?:null|undefined|none|nan)$/i.test(str)) return false
    return true
  }

  const keys = Object.keys(data)

  const p1 = keys.filter(k =>
    /(?:airport.*name|name.*airport|airport.*title|اسم.*مطار|مطار.*اسم|اسم_المطار)/i.test(k)
  )
  for (const k of p1) {
    if (isGoodAirportName(data[k])) return String(data[k]).trim()
  }

  const p2 = keys.filter(k =>
    /(?:airport|مطار)/i.test(k) && !/(?:id|code|num|no|fk|pk|objectid|fid)/i.test(k)
  )
  for (const k of p2) {
    if (isGoodAirportName(data[k])) return String(data[k]).trim()
  }

  const p3 = keys.filter(k =>
    /^(?:name|title|label|airport)$/i.test(k) && !/(?:client|person|owner|عميل|مالك)/i.test(k)
  )
  for (const k of p3) {
    if (isGoodAirportName(data[k])) return String(data[k]).trim()
  }

  return undefined
}

/**
 * Resolves a coded value domain code to its display name/label (e.g. 5 -> "Cairo Airport").
 * Checks JSAPI layer, layerDefinition, schema, subtypes, and cross-data sources.
 */
export function lookupDomainName (field?: string, codeVal?: any, ds?: any): string | undefined {
  if (codeVal == null) return undefined
  const strCode = String(codeVal).trim()
  if (!strCode) return undefined

  const checkCodedValues = (codedValues?: any[]): string | undefined => {
    if (!Array.isArray(codedValues)) return undefined
    for (const cv of codedValues) {
      if (cv == null) continue
      const c = cv.code != null ? String(cv.code).trim() : (cv.value != null ? String(cv.value).trim() : '')
      if (c === strCode) {
        const name = (cv.name != null ? String(cv.name) : (cv.label != null ? String(cv.label) : '')).trim()
        if (name && !/^\d+$/.test(name)) {
          return name
        }
      }
    }
    return undefined
  }

  const checkDomainObject = (domain?: any): string | undefined => {
    if (!domain) return undefined
    return checkCodedValues(domain.codedValues)
  }

  const checkLayer = (layer?: any, targetField?: string): string | undefined => {
    if (!layer) return undefined

    // 1. layer.getFieldDomain
    if (typeof layer.getFieldDomain === 'function') {
      if (targetField) {
        const d = layer.getFieldDomain(targetField)
        const res = checkDomainObject(d)
        if (res) return res
      }
      if (Array.isArray(layer.fields)) {
        for (const f of layer.fields) {
          if (!targetField || f.name?.toLowerCase() === targetField.toLowerCase() || /(?:airport|مطار)/i.test(f.name || '')) {
            const d = layer.getFieldDomain(f.name) || f.domain
            const res = checkDomainObject(d)
            if (res) return res
          }
        }
      }
    }

    // 2. layer.fields directly
    if (Array.isArray(layer.fields)) {
      for (const f of layer.fields) {
        if (!targetField || f.name?.toLowerCase() === targetField.toLowerCase() || /(?:airport|مطار)/i.test(f.name || '')) {
          const res = checkDomainObject(f.domain)
          if (res) return res
        }
      }
    }

    // 3. layer.types (subtypes)
    if (Array.isArray(layer.types)) {
      for (const t of layer.types) {
        if (t?.domains) {
          for (const k of Object.keys(t.domains)) {
            if (!targetField || k.toLowerCase() === targetField.toLowerCase() || /(?:airport|مطار)/i.test(k)) {
              const res = checkDomainObject(t.domains[k])
              if (res) return res
            }
          }
        }
      }
    }

    return undefined
  }

  const checkDataSource = (targetDs?: any, targetField?: string): string | undefined => {
    if (!targetDs) return undefined

    // 1. Check JSAPI layer on dataSource
    const resLayer = checkLayer(targetDs.layer, targetField)
    if (resLayer) return resLayer

    // 2. Check getLayerDefinition
    if (typeof targetDs.getLayerDefinition === 'function') {
      const layerDef = targetDs.getLayerDefinition()
      if (layerDef) {
        if (targetField && typeof dataSourceUtils?.getCodedValueListForCodedValueOrSubtypeField === 'function') {
          try {
            const cvs = dataSourceUtils.getCodedValueListForCodedValueOrSubtypeField(layerDef, targetField)
            const res = checkCodedValues(cvs)
            if (res) return res
          } catch (e) {}
        }

        if (Array.isArray(layerDef.fields)) {
          for (const f of layerDef.fields) {
            if (!targetField || f.name?.toLowerCase() === targetField.toLowerCase() || /(?:airport|مطار)/i.test(f.name || '')) {
              const res = checkDomainObject(f.domain)
              if (res) return res
            }
          }
        }

        if (Array.isArray(layerDef.types)) {
          for (const t of layerDef.types) {
            if (t?.domains) {
              for (const k of Object.keys(t.domains)) {
                if (!targetField || k.toLowerCase() === targetField.toLowerCase() || /(?:airport|مطار)/i.test(k)) {
                  const res = checkDomainObject(t.domains[k])
                  if (res) return res
                }
              }
            }
          }
        }
      }
    }

    // 3. Check getSchema
    if (typeof targetDs.getSchema === 'function') {
      const schemaFields = targetDs.getSchema()?.fields || {}
      for (const k of Object.keys(schemaFields)) {
        if (!targetField || k.toLowerCase() === targetField.toLowerCase() || /(?:airport|مطار)/i.test(k)) {
          const res = checkDomainObject((schemaFields[k] as any)?.domain)
          if (res) return res
        }
      }
    }

    // 4. Check mainDataSource if different
    const mainDs = typeof targetDs.getMainDataSource === 'function' ? targetDs.getMainDataSource() : undefined
    if (mainDs && mainDs !== targetDs) {
      const resMain = checkDataSource(mainDs, targetField)
      if (resMain) return resMain
    }

    return undefined
  }

  // First check given ds with specific field
  if (ds) {
    const resSpecific = checkDataSource(ds, field)
    if (resSpecific) return resSpecific

    // Check given ds across all candidate airport fields
    if (field) {
      const resAllFields = checkDataSource(ds, undefined)
      if (resAllFields) return resAllFields
    }
  }

  // Cross-data source domain lookup
  try {
    const allDs = DataSourceManager.getInstance().getDataSources() || {}
    for (const dsId of Object.keys(allDs)) {
      const otherDs = allDs[dsId]
      if (!otherDs || otherDs === ds) continue
      const isAirportRelated = /(?:airport|مطار)/i.test(dsId) ||
        /(?:airport|مطار)/i.test(otherDs?.getDataSourceJson?.()?.name || '') ||
        /(?:airport|مطار)/i.test((otherDs as any)?.label || '')

      if (isAirportRelated) {
        const resOther = checkDataSource(otherDs, field) || checkDataSource(otherDs, undefined)
        if (resOther) return resOther
      }
    }

    // If still not found, check remaining data sources
    for (const dsId of Object.keys(allDs)) {
      const otherDs = allDs[dsId]
      if (!otherDs || otherDs === ds) continue
      const resOther = checkDataSource(otherDs, field)
      if (resOther) return resOther
    }
  } catch (e) {}

  return undefined
}

/**
 * True when the data source itself represents airports, so its record titles
 * can be trusted as airport names. A parcel layer fails this check, because its
 * display field is the owner name.
 */
export function isAirportDataSource (targetDs?: any, targetId?: string): boolean {
  if (!targetDs) return false
  return /(?:airport|مطار)/i.test(targetId || '') ||
    /(?:airport|مطار)/i.test(targetDs?.getDataSourceJson?.()?.name || '') ||
    /(?:airport|مطار)/i.test(targetDs?.label || '')
}

export function findAirportNameFromAllDataSources (): string | undefined {
  try {
    const allDs = DataSourceManager.getInstance().getDataSources() || {}
    for (const dsId of Object.keys(allDs)) {
      const otherDs = allDs[dsId]
      if (!otherDs) continue

      const selected = (otherDs as QueriableDataSource)?.getSelectedRecords?.() || []
      if (selected.length === 1) {
        const rec = selected[0]
        const recData = rec?.getData?.() || {}
        const nameFromData = findAirportNameInAttributes(recData)
        if (nameFromData) return nameFromData

        if (isAirportDataSource(otherDs, dsId) && typeof (rec as any).getTitle === 'function') {
          const t = (rec as any).getTitle()
          if (t && !/^\d+$/.test(String(t).trim())) {
            return String(t).trim()
          }
        }
      }
    }
  } catch (e) {}
  return undefined
}

export const extractSingleFilterValue = (where?: string, targetField?: string): string | undefined => {
  if (!where || typeof where !== 'string') return undefined
  const str = where.trim()
  if (!str || str === '1=1' || str === '1 = 1' || str === '(1=1)' || str === '(1 = 1)') {
    return undefined
  }

  if (targetField) {
    const cleanTarget = targetField.trim().replace(/^[\["']+|[\]"']+$/g, '')
    const fieldRegex = new RegExp(`(?:^|[^a-zA-Z0-9_\u0600-\u06FF])(?:\\[|")?(?:[a-zA-Z0-9_\u0600-\u06FF]+\\.)?${escapeRegex(cleanTarget)}(?:\\]|")?(?:$|[^a-zA-Z0-9_\u0600-\u06FF])`, 'i')

    if (!fieldRegex.test(str)) {
      return undefined
    }

    // Check for IN clause on targetField: e.g. AirportName IN (...) or LOWER(AirportName) IN (...)
    const inRegex = new RegExp(`(?:\\b(?:LOWER|UPPER)\\s*\\(\\s*)?(?:\\[|")?(?:[a-zA-Z0-9_\u0600-\u06FF]+\\.)?${escapeRegex(cleanTarget)}(?:\\]|")?\\s*\\)?\\s+IN\\s*\\(([^)]+)\\)`, 'i')
    const inMatch = str.match(inRegex)
    if (inMatch) {
      const inContent = inMatch[1].trim()
      const items = inContent.split(/,(?=(?:(?:[^']*'){2})*[^']*$)(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim()).filter(Boolean)
      if (items.length === 1) {
        const orRegex = new RegExp(`(?:\\bOR\\b[^(]*?(?:\\[|")?${escapeRegex(cleanTarget)}(?:\\]|")?)|(?:(?:\\[|")?${escapeRegex(cleanTarget)}(?:\\]|")?[^)]*?\\bOR\\b)`, 'i')
        if (!orRegex.test(str)) {
          const raw = items[0]
          const cleanVal = raw.replace(/^N?'(.*)'$/s, '$1').replace(/^"(.*)"$/s, '$1').trim()
          if (cleanVal && cleanVal.toLowerCase() !== cleanTarget.toLowerCase()) {
            return cleanVal
          }
        }
      }
      return undefined
    }

    const orRegex = new RegExp(`(?:\\bOR\\b[^(]*?(?:\\[|")?${escapeRegex(cleanTarget)}(?:\\]|")?)|(?:(?:\\[|")?${escapeRegex(cleanTarget)}(?:\\]|")?[^)]*?\\bOR\\b)`, 'i')
    if (orRegex.test(str)) {
      return undefined
    }

    // Check for equality on targetField: e.g. AirportName = 'Cairo', LOWER(AirportName) = 'Cairo', AirportName = N'Cairo'
    const eqRegex = new RegExp(`(?:\\b(?:LOWER|UPPER)\\s*\\(\\s*)?(?:\\[|")?(?:[a-zA-Z0-9_\u0600-\u06FF]+\\.)?${escapeRegex(cleanTarget)}(?:\\]|")?\\s*\\)?\\s*=\\s*(?:\\b(?:LOWER|UPPER)\\s*\\(\\s*)?(?:N?'([^']*)'|"([^"]*)"|([^\\s)]+))\\s*\\)?`, 'gi')
    const matches = Array.from(str.matchAll(eqRegex))

    if (matches.length === 1) {
      const val = (matches[0][1] ?? matches[0][2] ?? matches[0][3] ?? '').trim()
      if (val && val.toLowerCase() !== cleanTarget.toLowerCase()) {
        return val
      }
    }

    return undefined
  }

  if (/\bOR\b/i.test(str) || /\bIN\s*\(/i.test(str)) {
    return undefined
  }

  let cleaned = str
    .replace(/\(\s*1\s*=\s*1\s*\)/gi, '')
    .replace(/\b1\s*=\s*1\b/gi, '')
    .replace(/\bAND\s+AND\b/gi, 'AND')
    .trim()
  cleaned = cleaned.replace(/^AND\s+/i, '').replace(/\s+AND$/i, '').trim()
  while (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1).trim()
  }

  if (!cleaned || cleaned === '1=1') return undefined

  const ignoredFields = ['year', 'archive', 'status', 'parcelstatus', 'deleted', 'isdeleted', 'objectid', 'fid', 'globalid', '1']

  const singleEq = cleaned.match(/^["']?([a-zA-Z_\u0600-\u06FF][a-zA-Z0-9_\u0600-\u06FF]*)["']?\s*=\s*(?:N?'([^']*)'|"([^"]*)"|([^'"=\s]+))$/i)
  if (singleEq) {
    const field = singleEq[1].trim().toLowerCase()
    const val = (singleEq[2] ?? singleEq[3] ?? singleEq[4] ?? '').trim()
    if (!ignoredFields.includes(field) && val && val.toLowerCase() !== field) {
      return val
    }
  }

  return undefined
}

export const isFieldFilteredToSingleValue = (where?: string, targetField?: string): boolean => {
  if (targetField) {
    return extractSingleFilterValue(where, targetField) !== undefined
  }
  return extractSingleFilterValue(where) !== undefined
}

export function formatDynamicChartTitle (
  airportName: string,
  count: number | undefined,
  baseTitle?: string
): string {
  const displayCount = count && count > 0 ? count : 15
  let cleanAirport = (airportName || '').trim()

  if (!cleanAirport || /^\d+$/.test(cleanAirport) || cleanAirport.toLowerCase() === 'airport name') {
    cleanAirport = 'اسم المطار'
  }

  let formattedAirport = cleanAirport
  if (cleanAirport !== 'اسم المطار') {
    if (!cleanAirport.startsWith('مطار')) {
      formattedAirport = `مطار ${cleanAirport}`
    }
  }

  const defaultPersonWord = (displayCount >= 3 && displayCount <= 10) ? 'أشخاص' : 'شخص'
  let metricPhrase = `${defaultPersonWord} حسب المساحة`

  if (baseTitle && typeof baseTitle === 'string') {
    let text = baseTitle.trim()

    let metricPart = ''
    if (text.includes('—') || text.includes('–') || text.includes(' - ')) {
      const parts = text.split(/[—–]|\s+-\s+/).map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        if (/^(?:Top|أعلى)\s*\d*/i.test(parts[0])) {
          metricPart = parts[0]
        } else if (/^(?:Top|أعلى)\s*\d*/i.test(parts[1])) {
          metricPart = parts[1]
        }
      }
    } else if (/^(?:Top|أعلى)\s*\d*/i.test(text)) {
      metricPart = text
    }

    if (metricPart) {
      let cleaned = metricPart.replace(/^(?:Top|أعلى)\s*\d*\s*/i, '').trim()
      if (/^(?:People\s+by\s+Area|by\s+Area|أشخاص\s+حسب\s+المساحة|شخص\s+حسب\s+المساحة|حسب\s+المساحة)$/i.test(cleaned)) {
        metricPhrase = `${defaultPersonWord} حسب المساحة`
      } else {
        const isGeneric = /^(?:chart(?:\s+title)?|advanced\s+chart|airport(?:\s+name)?|title|اسم(?:\s+المطار)?)$/i.test(cleaned)
        if (cleaned.length > 0 && !isGeneric) {
          metricPhrase = cleaned
        }
      }
    }
  }

  return `أعلى ${displayCount} ${metricPhrase} – ${formattedAirport}`
}

export function getConfiguredPeopleCount (
  webChart?: ImmutableObject<IWebChart> | IWebChart,
  options?: ImmutableObject<ChartComponentProps> | ChartComponentProps,
  fallbackCount: number = 15
): number {
  const queryPageSize = (webChart as any)?.dataSource?.query?.pageSize
  if (typeof queryPageSize === 'number' && queryPageSize > 0) {
    return queryPageSize
  }

  const seriesPageSize = (webChart as any)?.series?.[0]?.query?.pageSize
  if (typeof seriesPageSize === 'number' && seriesPageSize > 0) {
    return seriesPageSize
  }

  const drilldownTopN = (options as any)?.drilldown?.topN
  if (typeof drilldownTopN === 'number' && drilldownTopN > 0) {
    return drilldownTopN
  }

  const titleText = (webChart as any)?.title?.content?.text
  if (titleText && typeof titleText === 'string') {
    const match = titleText.match(/(?:\bTop\s+|أعلى\s+)(\d+)/i)
    if (match && match[1]) {
      const num = parseInt(match[1], 10)
      if (num > 0) return num
    }
  }

  return fallbackCount
}

/**
 * True when the chart's value series is a SUM over an area field, i.e. when
 * 'المساحة (بالفدان)' is an accurate label for the value axis.
 * A COUNT series such as count_of_OBJECTID is a parcel count, not an area.
 */
export function isAreaSumValueSeries (chart?: any): boolean {
  const y = chart?.series?.[0]?.y
  if (!y || typeof y !== 'string') return false

  const stats = chart?.dataSource?.query?.outStatistics
  if (Array.isArray(stats)) {
    const stat = stats.find((s: any) => String(s?.outStatisticFieldName || '').toLowerCase() === y.toLowerCase())
    if (stat) {
      if (String(stat.statisticType || '').toLowerCase() !== 'sum') return false
      return /(?:area|مساحة|فدان|feddan)/i.test(String(stat.onStatisticField || ''))
    }
  }

  if (/^count_of_/i.test(y)) return false
  return /(?:area|مساحة|فدان|feddan)/i.test(y)
}

/**
 * Makes the value axis title visible. Keeps whatever title is configured, and
 * only supplies the Arabic area label when the series really is an area sum.
 */
export function applyValueAxisTitle<T> (chart: T): T {
  const axes = (chart as any)?.axes
  if (!axes || axes.length <= 1) return chart

  const valAxis = axes[1]
  const currentTitle = valAxis?.title?.content?.text?.trim()
  if (valAxis?.title?.visible && currentTitle) return chart
  if (!currentTitle && !isAreaSumValueSeries(chart)) return chart

  return (chart as any)
    .setIn(['axes', '1', 'title', 'visible'], true)
    .setIn(['axes', '1', 'title', 'content', 'text'], currentTitle || 'المساحة (بالفدان)')
    .setIn(['axes', '1', 'title', 'content', 'angle'], 270)
    .setIn(['axes', '1', 'title', 'content', 'verticalAlignment'], 'middle')
}

export function escapeHtml (str?: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatArabicArea (area: number): string {
  if (area == null || isNaN(area)) return '0 فدان'
  const formatted = Number.isInteger(area) ? area.toString() : Number(area.toFixed(2)).toString()
  return `${formatted} فدان`
}

export function formatArabicParcelCount (count?: number): string {
  if (count == null || isNaN(count) || count <= 0) return '–'
  if (count === 1) return 'قطعة واحدة'
  if (count === 2) return 'قطعتان'
  if (count >= 3 && count <= 10) return `${count} قطع`
  return `${count} قطعة`
}

export interface PersonStat {
  count: number
  area?: number
  fullName: string
}

export function resolvePersonDetails (
  xValue: string,
  statValue: number,
  personStats: Record<string, PersonStat>
): { displayName: string, parcelCount?: number } {
  if (!xValue && xValue !== '') {
    return { displayName: '', parcelCount: undefined }
  }

  const rawX = String(xValue).trim()
  const cleanSnippet = rawX.replace(/^[\s.…]+|[\s.…]+$/g, '').trim()

  if (personStats && personStats[rawX]) {
    return { displayName: personStats[rawX].fullName, parcelCount: personStats[rawX].count }
  }
  const lowerX = rawX.toLowerCase()
  if (personStats && personStats[lowerX]) {
    return { displayName: personStats[lowerX].fullName, parcelCount: personStats[lowerX].count }
  }

  if (cleanSnippet && personStats) {
    const lowerClean = cleanSnippet.toLowerCase()
    const candidates = Object.values(personStats).filter(p => {
      const name = p.fullName.toLowerCase()
      return name.startsWith(lowerClean) || name.endsWith(lowerClean) || name.includes(lowerClean)
    })

    if (candidates.length === 1) {
      return { displayName: candidates[0].fullName, parcelCount: candidates[0].count }
    } else if (candidates.length > 1 && statValue != null) {
      const best = candidates.find(c => c.area != null && Math.abs(c.area - statValue) < 0.1)
      if (best) {
        return { displayName: best.fullName, parcelCount: best.count }
      }
      return { displayName: candidates[0].fullName, parcelCount: candidates[0].count }
    }
  }

  return { displayName: cleanSnippet || rawX, parcelCount: undefined }
}

export function buildArabicTooltipHTML (
  displayName: string,
  statValue: number,
  parcelCount?: number,
  isPersonView: boolean = true
): string {
  const formattedArea = formatArabicArea(statValue)

  if (!isPersonView) {
    return `<div style="direction: rtl; text-align: right; font-family: 'Avenir Next', 'Segoe UI', Tahoma, sans-serif; font-size: 13px; line-height: 1.6; padding: 4px 6px;">` +
      `<div><span style="font-weight: bold; color: #555;">المطار:</span> <span style="font-weight: 600; color: #111;">${escapeHtml(displayName)}</span></div>` +
      `<div><span style="font-weight: bold; color: #555;">المساحة:</span> <span style="color: #111;">${escapeHtml(formattedArea)}</span></div>` +
      `</div>`
  }

  const formattedCount = formatArabicParcelCount(parcelCount)

  return `<div style="direction: rtl; text-align: right; font-family: 'Avenir Next', 'Segoe UI', Tahoma, sans-serif; font-size: 13px; line-height: 1.6; padding: 4px 6px;">` +
    `<div><span style="font-weight: bold; color: #555;">الاسم:</span> <span style="font-weight: 600; color: #111;">${escapeHtml(displayName)}</span></div>` +
    `<div><span style="font-weight: bold; color: #555;">المساحة:</span> <span style="color: #111;">${escapeHtml(formattedArea)}</span></div>` +
    `<div><span style="font-weight: bold; color: #555;">عدد القطع:</span> <span style="color: #111;">${escapeHtml(formattedCount)}</span></div>` +
    `</div>`
}

interface RechartContainerProps {
  widgetId: string
  tools: ImmutableObject<ChartTools>
  options?: ChartComponentProps
  webChart: ImmutableObject<IWebChart>
  useDataSource: ImmutableObject<UseDataSource>
  enableDataAction: boolean
  onInitDragHandler: WidgetInitDragCallback
  defaultTemplateType: TemplateType
  outputDataSourceId: string
  rechartConfig?: ImmutableObject<RechartConfig>
}

export const RechartContainer = (props: RechartContainerProps): React.ReactElement => {
  const {
    widgetId,
    tools,
    options,
    webChart,
    useDataSource,
    enableDataAction,
    onInitDragHandler,
    defaultTemplateType,
    outputDataSourceId,
    rechartConfig
  } = props

  const rechartEnabled = !!rechartConfig?.enabled && !!rechartConfig?.webChart
  const rechartWebChart = rechartConfig?.webChart
  const rechartTools = rechartConfig?.tools || tools
  const rechartOptions = rechartConfig?.options || options
  const rechartTemplateType = rechartConfig?._templateType || 'column'

  const primaryCategoryField = React.useMemo(() => {
    return (webChart?.dataSource?.query?.groupByFieldsForStatistics?.[0]) || (webChart?.series?.[0] as any)?.x
  }, [webChart])

  const triggerField = rechartConfig?.filterField || primaryCategoryField

  const dataSourceId = useDataSource?.dataSourceId
  const mainDataSourceId = React.useMemo(() => {
    if (!dataSourceId) return ''
    try {
      const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
      return (ds as any)?.getMainDataSource?.()?.id ?? dataSourceId
    } catch {
      return dataSourceId
    }
  }, [dataSourceId])

  const dsInfo = ReactRedux.useSelector((state: IMState) => state.dataSourcesInfo?.[dataSourceId])
  const mainDsInfo = ReactRedux.useSelector((state: IMState) => state.dataSourcesInfo?.[mainDataSourceId])

  const isSingleValue = React.useMemo(() => {
    if (!rechartEnabled || !dataSourceId) return false
    const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
    if (!ds) return false

    const where = (ds as QueriableDataSource)?.getCurrentQueryParams?.()?.where
    if (isFieldFilteredToSingleValue(where, triggerField)) {
      return true
    }

    const selectedRecordIds = (ds as QueriableDataSource)?.getSelectedRecordIds?.() || dsInfo?.selectedIds || mainDsInfo?.selectedIds || []
    if (selectedRecordIds.length === 1) {
      return true
    }

    const selectedRecords = (ds as QueriableDataSource)?.getSelectedRecords?.() ?? []
    if (selectedRecords.length === 1) {
      return true
    }

    return false
  }, [
    rechartEnabled,
    dataSourceId,
    triggerField,
    dsInfo?.filterVersion,
    dsInfo?.sourceVersion,
    dsInfo?.gdbVersion,
    dsInfo?.selectedIds,
    mainDsInfo?.filterVersion,
    mainDsInfo?.sourceVersion,
    mainDsInfo?.gdbVersion,
    mainDsInfo?.selectedIds
  ])

  const [dbAirportName, setDbAirportName] = React.useState<string>('')

  React.useEffect(() => {
    if (!isSingleValue || !dataSourceId) {
      setDbAirportName('')
      return
    }

    let active = true
    const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
    if (!ds) return

    const where = (ds as QueriableDataSource)?.getCurrentQueryParams?.()?.where
    const rawVal = extractSingleFilterValue(where, triggerField) || extractSingleFilterValue(where)

    // 1. If rawVal from filter is already an actual airport name (non-numeric), use it directly!
    if (rawVal && !/^\d+$/.test(rawVal.trim())) {
      setDbAirportName(rawVal.trim())
      return
    }

    // 2. If rawVal is a numeric domain code (e.g. 5), look up the domain label immediately!
    if (rawVal && /^\d+$/.test(rawVal.trim())) {
      const domainName = lookupDomainName(triggerField, rawVal, ds)
      if (domainName) {
        setDbAirportName(domainName)
        return
      }
    }

    // If JSAPI layer is not yet loaded, load it and resolve domain when ready
    if ((ds as any).layer && !(ds as any).layer.loaded && typeof (ds as any).layer.load === 'function') {
      (ds as any).layer.load().then(() => {
        if (!active) return
        if (rawVal) {
          const domainName = lookupDomainName(triggerField, rawVal, ds)
          if (domainName) {
            setDbAirportName(domainName)
          }
        }
      }).catch(() => {})
    }

    const ownDsIsAirport = isAirportDataSource(ds, dataSourceId)

    const checkRecordForAirportName = (rec: any, allowTitleFallback: boolean = ownDsIsAirport): string | undefined => {
      if (!rec) return undefined
      const data = rec.getData?.() || {}

      // A. Direct attribute string (non-numeric)
      const nameFromData = findAirportNameInAttributes(data)
      if (nameFromData) return nameFromData

      // B. Jimu formatted field value (which automatically evaluates coded value domains)
      if (typeof rec.getFormattedFieldValue === 'function') {
        const candidateKeys = Object.keys(data).filter(k =>
          /(?:airport|مطار)/i.test(k) || (triggerField && k.toLowerCase() === triggerField.toLowerCase())
        )
        for (const k of candidateKeys) {
          try {
            const formatted = rec.getFormattedFieldValue(k, null)
            if (formatted && !/^\d+$/.test(String(formatted).trim())) {
              return String(formatted).trim()
            }
          } catch (e) {}
        }
      }

      // C. Look up domain for any airport field with numeric code
      const candidateKeys = Object.keys(data).filter(k =>
        /(?:airport|مطار)/i.test(k) || (triggerField && k.toLowerCase() === triggerField.toLowerCase())
      )
      for (const k of candidateKeys) {
        const val = data[k]
        if (val != null) {
          const resolved = lookupDomainName(k, val, ds)
          if (resolved) return resolved
        }
      }

      // D. Record title, but only when the record really comes from an airport layer.
      // On a parcel layer getTitle() returns the display field, which is the owner
      // name, and that would leak into the chart title.
      if (allowTitleFallback && typeof rec.getTitle === 'function') {
        const t = rec.getTitle()
        if (t && !/^\d+$/.test(String(t).trim())) return String(t).trim()
      }

      return undefined
    }

    const checkLoadedRecords = () => {
      const selectedRecords = (ds as QueriableDataSource)?.getSelectedRecords?.() ?? []
      for (const rec of selectedRecords) {
        const name = checkRecordForAirportName(rec)
        if (name) return name
      }

      const allRecords = (ds as QueriableDataSource)?.getRecords?.() ?? []
      for (const rec of allRecords) {
        const data = rec.getData?.() || {}
        if (rawVal && triggerField && data[triggerField] != null) {
          if (String(data[triggerField]).toLowerCase() !== String(rawVal).toLowerCase()) {
            continue
          }
        }
        const name = checkRecordForAirportName(rec)
        if (name) return name
      }
      return undefined
    }

    const loadedName = checkLoadedRecords()
    if (loadedName) {
      setDbAirportName(loadedName)
      return
    }

    const crossDsName = findAirportNameFromAllDataSources()
    if (crossDsName) {
      setDbAirportName(crossDsName)
      return
    }

    const queriableDs = ds as QueriableDataSource
    if (typeof queriableDs?.query === 'function') {
      queriableDs.query({
        where: where || '1=1',
        outFields: ['*'],
        pageSize: 5,
        returnGeometry: false
      }).then((result) => {
        if (!active) return
        const recs = result?.records ?? []
        for (const r of recs) {
          const name = checkRecordForAirportName(r)
          if (name) {
            setDbAirportName(name)
            return
          }
        }

        const allDataSources = DataSourceManager.getInstance().getDataSources() || {}
        for (const otherId of Object.keys(allDataSources)) {
          if (otherId === dataSourceId) continue
          const otherDs = allDataSources[otherId] as QueriableDataSource
          const isAirportDs = isAirportDataSource(otherDs, otherId)

          if (isAirportDs && typeof otherDs?.query === 'function') {
            const idField = (otherDs as any).getIdField?.() || 'OBJECTID'
            const otherWhere = rawVal && /^\d+$/.test(String(rawVal).trim())
              ? `${idField} = ${rawVal} OR Airport_ID = ${rawVal} OR Airport = ${rawVal} OR AirportName = ${rawVal}`
              : (where || '1=1')

            otherDs.query({
              where: otherWhere,
              outFields: ['*'],
              pageSize: 1,
              returnGeometry: false
            }).then(otherRes => {
              if (!active) return
              const aRecs = otherRes?.records ?? []
              if (aRecs[0]) {
                // This data source was already confirmed to be airport-related,
                // so its record title is a trustworthy airport name.
                const aName = checkRecordForAirportName(aRecs[0], true)
                if (aName) {
                  setDbAirportName(aName)
                }
              }
            }).catch(() => {
              // Fallback to general query if combined clause fails on unknown fields
              if (otherWhere !== (where || '1=1')) {
                otherDs.query({
                  where: where || '1=1',
                  outFields: ['*'],
                  pageSize: 1,
                  returnGeometry: false
                }).then(fbRes => {
                  if (!active) return
                  const fbRecs = fbRes?.records ?? []
                  if (fbRecs[0]) {
                    const aName = checkRecordForAirportName(fbRecs[0], true)
                    if (aName) {
                      setDbAirportName(aName)
                    }
                  }
                }).catch(() => {})
              }
            })
          }
        }
      }).catch(() => {})
    }

    return () => {
      active = false
    }
  }, [isSingleValue, dataSourceId, triggerField, dsInfo?.filterVersion, dsInfo?.selectedIds, mainDsInfo?.selectedIds])

  const [personStats, setPersonStats] = React.useState<Record<string, PersonStat>>({})

  React.useEffect(() => {
    if (!isSingleValue || !dataSourceId) {
      setPersonStats({})
      return
    }

    let active = true
    const ds = DataSourceManager.getInstance().getDataSource(dataSourceId) as QueriableDataSource
    if (!ds || typeof ds.query !== 'function') return

    const where = ds.getCurrentQueryParams?.()?.where || '1=1'
    const idField = (ds as any).getIdField?.() || 'OBJECTID'
    const clientField = (rechartWebChart as any)?.series?.[0]?.x ||
      (rechartWebChart as any)?.dataSource?.query?.groupByFieldsForStatistics?.[0] ||
      'Client'

    const queryFallback = () => {
      ds.query({
        where,
        outFields: [clientField, idField, 'AreaF'],
        pageSize: 2000,
        returnGeometry: false
      }).then(result => {
        if (!active) return
        const recs = result?.records ?? []
        const counts: Record<string, { count: number, area: number, fullName: string }> = {}
        for (const rec of recs) {
          const data = rec.getData?.() || (rec as any).attributes || {}
          const cVal = data[clientField] ?? data[clientField.toLowerCase()]
          if (cVal != null) {
            const fullName = String(cVal).trim()
            const areaVal = Number(data.AreaF ?? data.areaf ?? 0)
            const k = fullName.toLowerCase()
            if (!counts[k]) {
              counts[k] = { count: 0, area: 0, fullName }
            }
            counts[k].count += 1
            counts[k].area += (!isNaN(areaVal) ? areaVal : 0)
          }
        }
        const statsMap: Record<string, PersonStat> = {}
        for (const k of Object.keys(counts)) {
          const item = counts[k]
          statsMap[item.fullName] = item
          statsMap[k] = item
        }
        setPersonStats(statsMap)
      }).catch(() => {})
    }

    // First attempt: Grouped statistics query directly on the layer
    ds.query({
      where,
      groupByFieldsForStatistics: [clientField],
      outStatistics: [
        {
          statisticType: 'count',
          onStatisticField: idField,
          outStatisticFieldName: 'parcel_count'
        },
        {
          statisticType: 'sum',
          onStatisticField: 'AreaF',
          outStatisticFieldName: 'sum_area'
        }
      ],
      pageSize: 1000,
      returnGeometry: false
    }).then(result => {
      if (!active) return
      const recs = result?.records ?? []
      if (recs.length > 0) {
        const statsMap: Record<string, PersonStat> = {}
        for (const rec of recs) {
          const data = rec.getData?.() || (rec as any).attributes || {}
          const cVal = data[clientField] ?? data[clientField.toLowerCase()]
          if (cVal != null) {
            const fullName = String(cVal).trim()
            const count = Number(data.parcel_count ?? data.PARCEL_COUNT ?? data.count ?? 1)
            const area = data.sum_area != null ? Number(data.sum_area) : undefined
            statsMap[fullName] = { count, area, fullName }
            statsMap[fullName.toLowerCase()] = { count, area, fullName }
          }
        }
        setPersonStats(statsMap)
        return
      }
      queryFallback()
    }).catch(() => {
      if (!active) return
      queryFallback()
    })

    return () => {
      active = false
    }
  }, [isSingleValue, dataSourceId, triggerField, dsInfo?.filterVersion, dsInfo?.selectedIds, mainDsInfo?.selectedIds, rechartWebChart])

  const selectedAirportName = React.useMemo(() => {
    if (!isSingleValue) return ''

    if (dbAirportName && !/^\d+$/.test(dbAirportName.trim())) {
      return dbAirportName.trim()
    }

    if (dataSourceId) {
      const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
      const where = (ds as QueriableDataSource)?.getCurrentQueryParams?.()?.where
      const fromWhere = extractSingleFilterValue(where, triggerField) || extractSingleFilterValue(where)

      if (fromWhere) {
        if (!/^\d+$/.test(fromWhere.trim())) {
          return fromWhere.trim()
        }
        // If fromWhere is a numeric domain code (e.g. 5), look up the domain label immediately
        const domainName = lookupDomainName(triggerField, fromWhere, ds)
        if (domainName) {
          return domainName
        }
      }
    }

    if (dataSourceId) {
      const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
      if (ds) {
        const selectedRecords = (ds as QueriableDataSource)?.getSelectedRecords?.() ?? []
        for (const rec of selectedRecords) {
          const data = rec.getData?.() || {}
          const name = findAirportNameInAttributes(data)
          if (name) return name

          const candidateKeys = Object.keys(data).filter(k =>
            /(?:airport|مطار)/i.test(k) || (triggerField && k.toLowerCase() === triggerField.toLowerCase())
          )
          for (const k of candidateKeys) {
            const val = data[k]
            if (val != null) {
              const resolved = lookupDomainName(k, val, ds)
              if (resolved) return resolved
            }
          }
        }
      }
    }

    return ''
  }, [isSingleValue, dbAirportName, dataSourceId, triggerField])

  const configuredCount = React.useMemo(() => {
    const rechartCount = getConfiguredPeopleCount(rechartWebChart, rechartOptions, 0)
    if (rechartCount > 0) return rechartCount

    const mainCount = getConfiguredPeopleCount(webChart, options, 0)
    if (mainCount > 0) return mainCount

    return 15
  }, [rechartWebChart, webChart, rechartOptions, options])

  // Dynamically update the title when an airport is selected/filtered, preserving object reference stability
  const activeWebChart = React.useMemo(() => {
    let baseChart = isSingleValue ? rechartWebChart : webChart
    if (!baseChart) return baseChart

    if (isSingleValue) {
      const baseTitleText = baseChart?.title?.content?.text ?? ''
      const airportToDisplay = selectedAirportName || 'اسم المطار'
      const dynamicTitleText = formatDynamicChartTitle(airportToDisplay, configuredCount, baseTitleText)

      if (configuredCount && baseChart.dataSource?.query?.pageSize !== configuredCount) {
        baseChart = baseChart.setIn(['dataSource', 'query', 'pageSize'], configuredCount)
      }

      baseChart = applyValueAxisTitle(baseChart)

      if (baseChart.title?.content?.text === dynamicTitleText && baseChart.title?.visible) {
        return baseChart
      }

      if (baseChart.title) {
        return baseChart
          .setIn(['title', 'content', 'text'], dynamicTitleText)
          .setIn(['title', 'visible'], true)
      } else {
        const newTitle = Immutable(getChartText(dynamicTitleText, true, DefaultTitleSize, DefaultTitleColor))
        return baseChart.set('title', newTitle)
      }
    }

    baseChart = applyValueAxisTitle(baseChart)

    return baseChart
  }, [isSingleValue, rechartWebChart, webChart, selectedAirportName, configuredCount])

  const personStatsRef = React.useRef(personStats)
  personStatsRef.current = personStats

  const isSingleValueRef = React.useRef(isSingleValue)
  isSingleValueRef.current = isSingleValue

  const handleTooltipFormat = React.useCallback((params: any) => {
    if (!params) return ''
    const xVal = params.xValue ?? ''
    const statVal = typeof params.statValue === 'number' ? params.statValue : Number(params.statValue ?? 0)
    const isSingle = isSingleValueRef.current
    const stats = personStatsRef.current || {}

    const { displayName, parcelCount } = resolvePersonDetails(xVal, statVal, stats)
    return buildArabicTooltipHTML(displayName, statVal, parcelCount, isSingle)
  }, [])

  const activeTools = isSingleValue ? rechartTools : tools
  const activeOptions = React.useMemo(() => {
    const baseOptions = isSingleValue ? rechartOptions : options
    // The outer chart aggregates many features into one data point, so its pop-up would
    // describe an arbitrary one of them. Only the drilled-down chart gets a pop-up.
    const openSelectionPopup = isSingleValue
    if (baseOptions && ((baseOptions as any)._isImmutable || typeof (baseOptions as any).set === 'function')) {
      return (baseOptions as any)
        .set('tooltipFormatter', handleTooltipFormat)
        .set('openSelectionPopup', openSelectionPopup)
    }
    return {
      ...(baseOptions || {}),
      tooltipFormatter: handleTooltipFormat,
      openSelectionPopup
    }
  }, [isSingleValue, rechartOptions, options, handleTooltipFormat])
  const activeTemplateType = isSingleValue ? rechartTemplateType : defaultTemplateType

  return (
    <div className='w-100 h-100 position-relative' style={{ transition: 'opacity 0.15s ease-in-out' }}>
      <ChartRuntimeStateProvider>
        <Chart
          widgetId={widgetId}
          tools={activeTools}
          options={activeOptions}
          webChart={activeWebChart}
          useDataSource={useDataSource}
          enableDataAction={enableDataAction}
          onInitDragHandler={onInitDragHandler}
          defaultTemplateType={activeTemplateType}
          outputDataSourceId={outputDataSourceId}
        />
      </ChartRuntimeStateProvider>
    </div>
  )
}

export default RechartContainer
