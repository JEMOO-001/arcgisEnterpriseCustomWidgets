import {
  type ImmutableObject,
  type ImmutableArray,
  type IMFeatureLayerQueryParams,
  JimuFieldType,
  Immutable,
  type FeatureLayerQueryParams,
  type DataSource,
  type IMFieldSchema,
  DataSourceManager,
  type StatisticDefinition
} from 'jimu-core'
import { utils } from 'jimu-theme'
import { GaugeDisplayValueField, SplitByOtherSeriesName, SplitByOtherSeriesValue } from '../../constants'
import { type ISimpleFillSymbol, type ISimpleLineSymbol } from '@esri/arcgis-rest-types'
import { type CategoryFormatOptions, type DateTimeFormatOptions, getDefaultCategoryFormat, type WebChartLineChartSeries, WebChartStackedKinds, getSplitByValue, WebChartSortOrderKinds, getSeriesType, type WebChartPieChartSeries, WebChartTimeIntervalUnits, getSplitByField, type WebChartBarChartSeries, type WebChartScatterPlotSeries, type WebChartHistogramSeries, WebChartTimeAggregationTypes, WebChartNullPolicyTypes, type WebChartGaugeSeries, type ChartTypes } from 'jimu-ui/advanced/chart'
import { type SeriesColorProps, SeriesColors, getColorInOrder, getDefaultBarChartSeries, getDefaultDateFormat, getDefaultHistogramSeries, getDefaultLineChartSeries, getDefaultPieChartSeries, getDefaultScatterPlotChartSeries, getNonRepeatingColor, isSerialSeries, getDefaultGaugeSeries, DefaultSplitByOtherSeriesColor } from '../default'
import { CategoryType, type IWebChart, type ChartStatisticType, type WebChartSeries, type ChartType, type TemplateType } from '../../config'

export interface SelectedOption {
  name: string
  value: string
}

const cacheFieldSchema = {}
/**
 * Get the schema of a single field
 * @param jimuFieldName
 * @param dataSourceId
 */
export const getFieldSchema = (
  jimuFieldName: string,
  dataSourceId: string
): IMFieldSchema | undefined => {
  if (!dataSourceId) return
  if (cacheFieldSchema[jimuFieldName] != null) return cacheFieldSchema[jimuFieldName]
  const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
  const dsSchema = ds?.getSchema()
  const fieldSchema = dsSchema?.fields?.[jimuFieldName]
  cacheFieldSchema[jimuFieldName] = fieldSchema
  return fieldSchema
}

const cacheFieldsSchema = {}

/**
 * Get all the field schema in a data source
 * @param dataSourceId
 */
export const getFieldsSchema = (
  dataSourceId: string
): { [jimuName: string]: IMFieldSchema } | undefined => {
  if (cacheFieldsSchema[dataSourceId] != null) return cacheFieldsSchema[dataSourceId]
  const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
  const dsSchema = ds?.getSchema()
  const fieldsSchema = dsSchema?.fields
  cacheFieldsSchema[dataSourceId] = fieldsSchema
  return fieldsSchema
}

const cacheObjectIdField = {}
/**
 * get objectid
 * @param dataSourceId
 */
export const getObjectIdField = (dataSourceId: string): string | undefined => {
  if (cacheObjectIdField[dataSourceId] != null) return cacheObjectIdField[dataSourceId]
  const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)
  if (ds == null) {
    console.error(`Invalid data source id: ${dataSourceId}`)
    return
  }
  const objectId = ds.getIdField()
  cacheObjectIdField[dataSourceId] = objectId
  return objectId
}

/**
 * Get the field type.
 * @param jimuFieldName
 * @param dataSourceId
 */
export const getFieldType = (
  jimuFieldName: string,
  dataSourceId: string
): JimuFieldType => {
  const fieldSchema = getFieldSchema(jimuFieldName, dataSourceId)
  return fieldSchema?.type
}

/**
 * Get the template type of the current series.
 * @param series
 * @param fallbackType
 */
export const getTemplateType = (webChart: IWebChart | ImmutableObject<IWebChart>): [ChartType, TemplateType] => {
  const series = webChart?.series
  const seriesType = getSeriesType(series as any) ?? 'barSeries'

  const serie = series?.[0]
  let type: ChartType
  let subType: TemplateType
  if (!serie) return [] as any
  if (seriesType === 'barSeries') {
    const stackedType = (serie as WebChartBarChartSeries).stackedType
    const rotated = webChart?.rotated ?? false
    const suffix = rotated ? 'bar' : 'column'
    const prefix = stackedType === 'sideBySide' ? '' : stackedType
    type = suffix
    subType = (prefix ? `${prefix}-${suffix}` : suffix) as TemplateType
  } else if (seriesType === 'lineSeries') {
    const showArea = getSeriaLlineShowArea(series)
    const lineSmoothed = getSeriaLlineSmoothed(series)

    const suffix = showArea ? 'area' : 'line'
    let prefix = ''
    if (lineSmoothed) {
      prefix = 'smooth'
    }
    type = suffix
    subType = (prefix ? `${prefix}-${suffix}` : suffix) as TemplateType
  } else if (seriesType === 'pieSeries') {
    type = 'pie'
    const innerRadius = (serie as WebChartPieChartSeries)?.innerRadius ?? 0
    subType = innerRadius > 0 ? 'donut' : 'pie'
  } else if (seriesType === 'scatterSeries') {
    type = 'scatter'
    subType = 'scatter'
  } else if (seriesType === 'histogramSeries') {
    type = 'histogram'
    subType = 'histogram'
  } else if (seriesType === 'gaugeSeries') {
    type = 'gauge'
    subType = 'gauge'
  }

  return [type, subType]
}

/**
 * Capitalize the first letter of a string.
 * @param str
 * @returns {string}
 */
export const capitalizeString = (str: string) => {
  if (typeof str === 'string') {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  return null
}

export const whetherUseIdFieldForNonCount = (query: ImmutableObject<FeatureLayerQueryParams>, series: ImmutableArray<WebChartSeries>, dataSource: DataSource) => {
  if (!dataSource) return false
  const statysticsType = query?.outStatistics?.[0]?.statisticType
  if (statysticsType === 'count') return false

  const usedFields = series?.map((serie) => serie.id)
  if (!usedFields?.length) return false
  const idFIeld = dataSource.getIdField()
  return usedFields.includes(idFIeld)
}

export const whetherUseInlineDataSource = (webChart: ImmutableObject<IWebChart>, dataSource: DataSource) => {
  const seriesType = getSeriesType(webChart?.series as any)
  const isPieOrSerialChart = isSerialSeries(seriesType) || seriesType === 'pieSeries'
  if (!isPieOrSerialChart) return false
  const categoryType = getCategoryType(webChart?.dataSource?.query)
  if (categoryType === CategoryType.ByField) return true

  const useIdFieldForNonCount = whetherUseIdFieldForNonCount(webChart?.dataSource?.query, webChart?.series, dataSource)
  return useIdFieldForNonCount
}

/**
 * Indicates whether a string field is empty (different from undefined, null and empty string).
 * The value is stringified before being trimmed to debunk edge cases like when the value is a numeric value.
 * @param value The value to test
 * @returns `true` if empty, `false` otherwise
 */
export function isEmptyStringField (value: string | undefined | null): boolean {
  return value === undefined || value === null || `${value}`.trim() === ''
}

/**
 * Get category type from chart query.
 * @param query
 */
export const getCategoryType = (
  query: IMFeatureLayerQueryParams
): CategoryType => {
  if (query?.groupByFieldsForStatistics != null) {
    return CategoryType.ByGroup
  } else if (query?.outStatistics != null) {
    return CategoryType.ByField
  }
}

/**
 * Get statistic type from chart query.
 * @param query
 */
export const getStatisticsType = (query: IMFeatureLayerQueryParams): ChartStatisticType => {
  if (query?.outFields?.length) {
    return 'no_aggregation'
  } else {
    return query?.outStatistics?.[0]?.statisticType
  }
}

/**
 * Get category field from chart query.
 * @param query
 */
export const getCategoryField = (
  query: IMFeatureLayerQueryParams
): string => {
  return query?.groupByFieldsForStatistics?.[0]
}

/**
 * Get category field type from chart query.
 * @param query
 */
export const getCategoryFieldType = (
  query: IMFeatureLayerQueryParams,
  dataSourceId: string
): JimuFieldType => {
  const categoryField = query?.groupByFieldsForStatistics?.[0]
  const fieldType = getFieldType(categoryField, dataSourceId)
  return fieldType
}

export const getSerialStackedType = (
  series: WebChartSeries[] | ImmutableArray<WebChartSeries>
): WebChartStackedKinds => {
  return (series?.[0] as WebChartBarChartSeries).stackedType
}

export const getSeriaLlineSmoothed = (
  series: WebChartSeries[] | ImmutableArray<WebChartSeries>
): boolean => {
  return (series?.[0] as WebChartLineChartSeries).lineSmoothed
}

export const getSeriaLlineShowArea = (
  series: WebChartSeries[] | ImmutableArray<WebChartSeries>
): boolean => {
  return (series?.[0] as WebChartLineChartSeries).showArea
}

const OrderSeparator = ' '
/**
 * Parse a query.orderByFields[i]
 * @param fieldOrder
 * normal: 'fieldname ASC'
 * with space in field: 'field name ASC'
 */
export const parseOrderByField = (fieldOrder: string): string[] => {
  if (!fieldOrder || !fieldOrder.includes(OrderSeparator)) return []
  const lastIndex = fieldOrder.lastIndexOf(OrderSeparator)
  const index = fieldOrder.indexOf(OrderSeparator)
  if (lastIndex !== index) {
    const field = fieldOrder.substring(0, lastIndex)
    const order = fieldOrder.substring(lastIndex + 1)
    return [field, order]
  } else {
    return fieldOrder.split(' ')
  }
}

//Using these special symbols as `outStatisticName` will cause some service statistics to fail.
const SpecialSymbolRegexp = /\(|\)|\[|\]|\%/gm

/**
 * Generate the `outStatisticName` for `query`, and it's always equal to `serie.y`
 * @param numericField
 * @param statisticType
 */
export const getOutStatisticName = (numericField: string, statisticType: ChartStatisticType) => {
  if (numericField?.match(SpecialSymbolRegexp)) {
    numericField = numericField.replace(SpecialSymbolRegexp, '__')
  }
  if (statisticType !== 'no_aggregation') {
    return `${statisticType}_of_${numericField}`
  } else {
    return numericField
  }
}

export const getOutStatisticAlias = (numericFieldAlias: string, statisticType: ChartStatisticType) => {
  if (statisticType !== 'no_aggregation') {
    return `${utils.uppercaseFirstLetter(statisticType)} of ${numericFieldAlias}`
  } else {
    return numericFieldAlias
  }
}

const StatisticsTranslations = {
  sum: 'sumOfField',
  avg: 'meanOfField',
  min: 'minOfField',
  max: 'maxOfField',
  count: 'count',
  percentile_cont: 'medianOfField'
}

/**
 * Normalize the label of statistic type.
 * @param field
 * @param statisticType
 * @param translate
 */
export const normalizeStatisticFieldLabel = (statisticType, field, translate) => {
  const normalized = translate(StatisticsTranslations[statisticType], { field })
  return normalized
}

/**
 * Get default value format based on field type.
 * Note: `NumberFormatOptions` is not supported for serial chart yet.
 * @param fieldType
 */
export const getDefaultValueFormat = (fieldType: JimuFieldType): CategoryFormatOptions | DateTimeFormatOptions => {
  if (fieldType === JimuFieldType.Date) {
    return getDefaultDateFormat()
  } else {
    return getDefaultCategoryFormat()
  }
}

export const getSplitOutStatisticName = (numericField: string, statisticType: ChartStatisticType, splitByValue: string | number) => {
  let outStatisticName = getOutStatisticName(numericField, statisticType)
  outStatisticName = `${outStatisticName}_of_${splitByValue}`
  return outStatisticName
}

export const getSplitOutStatisticAlias = (numericFieldAlias: string, statisticType: ChartStatisticType, splitByValue: string | number) => {
  let outStatisticAlias = getOutStatisticAlias(numericFieldAlias, statisticType)
  outStatisticAlias = `${outStatisticAlias} of ${splitByValue}`
  return outStatisticAlias
}

export const getSplitByFieldValues = (propSeries: ImmutableArray<WebChartSeries> | WebChartSeries[]): Array<number | string> => {
  if (!propSeries?.length) return []
  const series: WebChartSeries[] = (propSeries as ImmutableArray<WebChartSeries>).asMutable ? (propSeries as ImmutableArray<WebChartSeries>).asMutable({ deep: true }) : propSeries as WebChartSeries[]
  const values = series.map((serie) => {
    const where = serie.query.where
    const value = getSplitByValue({ where, normalize: true })
    return value
  })
  return values
}

export const ArcgisChartsSecretKeys = {
  defaultOutStatisticFieldName: 'arcgis_charts_outStatisticFieldName_default_key'
}

export const getFieldUniqueValuesParams = (field: string, pageSize?: number) => {
  const outFields = [field]
  const nullFilter = `${field} IS NOT NULL`
  const orderByFields = !isEmptyStringField(field) ? [`${field} ${WebChartSortOrderKinds.Ascending}`] : []
  const params: FeatureLayerQueryParams = {
    where: nullFilter,
    orderByFields,
    outFields,
    returnDistinctValues: true,
    returnGeometry: false,
    pageSize
  }
  return params
}

/**
 * Create the default by category type.
 * @param categoryType
 */
export const createDefaultQuery = (categoryType = CategoryType.ByGroup): FeatureLayerQueryParams => {
  if (categoryType === CategoryType.ByGroup) {
    return {
      groupByFieldsForStatistics: [],
      outStatistics: []
    }
  } else if (categoryType === CategoryType.ByField) {
    return {
      outStatistics: []
    }
  }
}

export const DefaultTimeBinningProps = {
  timeIntervalSize: 1,
  timeIntervalUnits: WebChartTimeIntervalUnits.Months,
  timeAggregationType: WebChartTimeAggregationTypes.Start,
  trimIncompleteTimeInterval: false,
  nullPolicy: WebChartNullPolicyTypes.Interpolate
}

/**
 * Create a default series based on the series properties.
 * @param seriesProps
 * @param index
 */
export const createDefaultSerie = (seriesProps: WebChartSeries, index = 0, colorProps?: SeriesColorProps): WebChartSeries => {
  if (!seriesProps) return null
  const { type = 'lineSeries', dataLabels, dataTooltipVisible } = seriesProps

  let serie = null
  if (type === 'barSeries') {
    const { fillSymbol, stackedType = WebChartStackedKinds.Side, hideOversizedStackedLabels = false } = seriesProps as WebChartBarChartSeries
    serie = getDefaultBarChartSeries(index, colorProps)
    serie.stackedType = stackedType
    serie.hideOversizedStackedLabels = hideOversizedStackedLabels

    if (fillSymbol) {
      if (!colorProps?.color && colorProps?.preSerieColor) {
        const color = getNonRepeatingColor(colorProps?.colors ?? SeriesColors, index, colorProps.preSerieColor)
        serie.fillSymbol = { ...fillSymbol, color }
      } else {
        serie.fillSymbol = fillSymbol
      }
    }
  } else if (type === 'lineSeries') {
    const {
      stackedType = WebChartStackedKinds.Side,
      lineSmoothed = false,
      showArea = false,
      markerVisible = false,
      lineSymbol,
      markerSymbol
    } = seriesProps as WebChartLineChartSeries

    serie = getDefaultLineChartSeries(index, colorProps)
    serie.stackedType = stackedType
    serie.lineSmoothed = lineSmoothed
    serie.showArea = showArea
    serie.markerVisible = markerVisible

    if (lineSymbol) {
      if (!colorProps?.color && colorProps?.preSerieColor) {
        const color = getNonRepeatingColor(colorProps?.colors ?? SeriesColors, index, colorProps.preSerieColor)
        serie.lineSymbol = { ...lineSymbol, color }
      } else {
        serie.lineSymbol = lineSymbol
      }
    }

    if (markerSymbol) {
      serie.markerSymbol = markerSymbol
    }
  } else if (type === 'pieSeries') {
    const { innerRadius = 0, startAngle = 0, endAngle = 360 } = seriesProps as WebChartPieChartSeries
    serie = getDefaultPieChartSeries()
    serie.innerRadius = innerRadius
    serie.startAngle = startAngle
    serie.endAngle = endAngle
  } else if (type === 'scatterSeries') {
    const { markerSymbol, overlays } = seriesProps as WebChartScatterPlotSeries
    serie = getDefaultScatterPlotChartSeries()
    if (markerSymbol) {
      serie.markerSymbol = markerSymbol
    }
    if (overlays) {
      serie.overlays = overlays
    }
  } else if (type === 'histogramSeries') {
    const { fillSymbol, binCount, overlays, dataTransformationType } = seriesProps as WebChartHistogramSeries
    serie = getDefaultHistogramSeries()
    serie.binCount = binCount
    if (overlays) {
      serie.overlays = overlays
    }
    if (fillSymbol) {
      serie.fillSymbol = fillSymbol
    }
    if (dataTransformationType) {
      serie.dataTransformationType = dataTransformationType
    }
  } else if (type === 'gaugeSeries') {
    const { valueConversion, featureIndex = 0 } = seriesProps as WebChartGaugeSeries
    serie = getDefaultGaugeSeries()
    serie.valueConversion = valueConversion
    serie.featureIndex = featureIndex
  }

  if (dataLabels && type !== 'gaugeSeries') {
    serie.dataLabels = dataLabels
  }

  if (dataTooltipVisible != null) {
    serie.dataTooltipVisible = dataTooltipVisible
  }

  return serie
}

/**
 * Get the used series by series id or index.
 * @param propSeries
 * @param id
 * @param index
 */
export const getUsedSeriesProps = (propSeries: WebChartSeries[], id: string, index: number = 0, colorProps?: SeriesColorProps): WebChartSeries => {
  let defaultSerie = propSeries.find((propSerie) => propSerie.id === id) as unknown as WebChartSeries
  if (!defaultSerie) {
    const template = propSeries[index] ?? propSeries[0]
    const { type, dataLabels, dataTooltipVisible } = template
    const { stackedType, hideOversizedStackedLabels } = template as WebChartBarChartSeries
    const { lineSmoothed, showArea, markerVisible, markerSymbol } = template as WebChartLineChartSeries
    const { innerRadius, startAngle, endAngle } = template as WebChartPieChartSeries
    defaultSerie = {
      type,
      dataLabels,
      dataTooltipVisible,
      hideOversizedStackedLabels,
      stackedType,
      lineSmoothed,
      showArea,
      markerVisible,
      markerSymbol,
      innerRadius,
      startAngle,
      endAngle
    } as unknown as WebChartSeries
  }
  const seriesProps = createDefaultSerie(defaultSerie, index, colorProps)
  return seriesProps
}

const getSeriesProps = (serie: ImmutableObject<WebChartSeries>, query: IMFeatureLayerQueryParams) => {
  const categoryField = query?.groupByFieldsForStatistics?.[0] ?? ''
  const outStatistics = query?.outStatistics
  const outFields = query?.outFields
  const where = query?.where
  const splitByField = getSplitByField(where, true)
  const statisticType = getStatisticsType(query) ?? 'count'

  const timeIntervalUnits = (serie as unknown as WebChartLineChartSeries)?.timeIntervalUnits

  const numericFields = outFields || outStatistics?.map((outStatistic) => outStatistic.onStatisticField)?.filter(field => !!field)

  return { splitByField, categoryField, numericFields, statisticType, timeIntervalUnits }
}

export interface SplitBySerieProps {
  propSeries
  name?: string
  categoryField: string
  numberField: string
  splitByField: string
  splitByFieldType: JimuFieldType
  splitByValue: string | number
  timeIntervalUnits?: WebChartTimeIntervalUnits
}

export const createSplitBySerie = (props: SplitBySerieProps, index: number, colorProps?: SeriesColorProps) => {
  const { propSeries, name, categoryField, numberField, timeIntervalUnits, splitByField, splitByFieldType, splitByValue } = props
  let serie = getUsedSeriesProps(propSeries, splitByValue as string, index, colorProps)
  const idAndName = `${splitByValue}`
  const y = numberField
  serie.id = idAndName
  serie.x = categoryField
  ; (serie as any).y = y
  serie.name = name || idAndName
  if (timeIntervalUnits) {
    serie = {
      ...serie,
      ...DefaultTimeBinningProps,
      timeIntervalUnits
    } as any
  }
  const where = `${splitByField}=${splitByFieldType === JimuFieldType.String ? `'${splitByValue}'` : splitByValue
    }`
  const query = { where }
  serie.query = query
  return serie
}

interface SeriesStyleProps extends SeriesColorProps {
  symbol?: ISimpleFillSymbol | ISimpleLineSymbol
}

export const createSplitBySerieFromSeries = (
  propSeries: ImmutableArray<WebChartSeries>,
  propQuery: IMFeatureLayerQueryParams,
  splitByFieldType: JimuFieldType,
  splitByValues: Array<string | number>,
  deletable: boolean = false,
  colorProps?: SeriesStyleProps
): ImmutableArray<WebChartSeries> => {
  const seriesProps = getSeriesProps(propSeries[0], propQuery)
  const { splitByField, categoryField, numericFields, timeIntervalUnits } =
    seriesProps
  const numberField = numericFields[0]
  let preSerieColor = colorProps?.preSerieColor ?? ''
  const seriesValues = splitByValues.map((splitByValue, index) => {
    let serie = propSeries.find((serie) => {
      const seriesSplitByValue = getSplitByValue({ where: serie.query.where, normalize: false })
      const rawSplitByValue = splitByFieldType === JimuFieldType.String ? `'${splitByValue}'` : splitByValue
      return seriesSplitByValue === rawSplitByValue
    })
    if (!serie) {
      const splitByProps = {
        propSeries,
        categoryField,
        numberField,
        timeIntervalUnits,
        splitByField,
        splitByFieldType,
        splitByValue
      }
      serie = createSplitBySerie(splitByProps, index, { ...colorProps, preSerieColor })
      serie.deletable = deletable
      preSerieColor =
        (serie as any).fillSymbol?.color ?? (serie as any).lineSymbol?.color
      if (colorProps.symbol) {
        if (serie.type === 'barSeries') {
          (serie as WebChartBarChartSeries).fillSymbol = colorProps.symbol as ISimpleFillSymbol
        } else if (serie.type === 'lineSeries') {
          (serie as WebChartLineChartSeries).lineSymbol = colorProps.symbol as ISimpleLineSymbol
        }
      }
    }
    return serie
  })
  const series = Immutable(seriesValues)
  return series
}

export const applySeriesColors = (propSeries: ImmutableArray<WebChartSeries>, colors: string[]): ImmutableArray<WebChartSeries> => {
  if (!colors) return
  const slices = propSeries?.map((serie, index) => {
    const color = getColorInOrder(colors, index)
    const type = serie.type
    if (type === 'barSeries') {
      serie = serie.setIn(['fillSymbol', 'color'], color)
    } else if (type === 'lineSeries') {
      serie = serie.setIn(['lineSymbol', 'color'], color)
    }
    return serie as any
  })
  return slices
}

export const createRuntimeSplitBySeries = (
  propSeries: ImmutableArray<WebChartSeries>,
  propQuery: IMFeatureLayerQueryParams,
  splitByFieldType: JimuFieldType,
  splitByValues: Array<string | number>
): ImmutableArray<WebChartSeries> => {
  const otherSerie = propSeries.find(serie => serie.id === SplitByOtherSeriesValue)
  const symbol = otherSerie.type === 'barSeries' ? (otherSerie as WebChartBarChartSeries).fillSymbol : (otherSerie as WebChartLineChartSeries).lineSymbol
  let series = createSplitBySerieFromSeries(propSeries, propQuery, splitByFieldType, splitByValues, false, { symbol })
  series = series.map((serie) => {
    if (serie.deletable) {
      serie = serie.without('deletable')
    }
    return serie as unknown as WebChartSeries
  })
  return series
}

export const normalizeRuntimeSplitBySeries = (propSeries: ImmutableArray<WebChartSeries>): ImmutableArray<WebChartSeries> => {
  const series = propSeries?.filter((serie) => {
    return !serie.deletable && serie.id !== SplitByOtherSeriesValue
  })
  return series
}

interface SeriesProps {
  categoryField: string
  statisticType: ChartStatisticType
  numericFields: string[]
  propSeries?: WebChartSeries[]
  timeIntervalUnits?: WebChartTimeIntervalUnits
  splitByField?: string
  splitByFieldType?: JimuFieldType
  splitByFieldValues?: Array<number | string>
}

export const createByGroupSeries = (props: SeriesProps, dataSourceId?: string): WebChartSeries[] => {
  const { splitByField, splitByFieldType, splitByFieldValues, categoryField, numericFields, statisticType, propSeries, timeIntervalUnits } = props

  let series: WebChartSeries[] = []
  if (splitByField && splitByFieldValues.length) {
    let preSerieColor = ''
    const numberField = numericFields[0]
    const seriesValues = splitByFieldValues.map((splitByValue, index) => {
      const splitByProps = { propSeries, categoryField, numberField, timeIntervalUnits, splitByField, splitByFieldType, splitByValue }
      const serie = createSplitBySerie(splitByProps, index, { preSerieColor })
      preSerieColor = (serie as any).fillSymbol?.color ?? (serie as any).lineSymbol?.color
      return serie
    })
    const otherSplitByProps = { propSeries, name: SplitByOtherSeriesName, categoryField, numberField, timeIntervalUnits, splitByField, splitByFieldType, splitByValue: SplitByOtherSeriesValue }
    const otherSerie = createSplitBySerie(otherSplitByProps, 0, { color: DefaultSplitByOtherSeriesColor })
    series = seriesValues.concat(otherSerie)
  } else {
    const numberFields = numericFields?.length ? numericFields : ['']
    let preSerieColor = ''
    series = numberFields.map((numericField, index) => {
      let serie = getUsedSeriesProps(propSeries, numericField, index, { preSerieColor })
      preSerieColor = (serie as any).fillSymbol?.color ?? (serie as any).lineSymbol?.color
      const y = numericField ? getOutStatisticName(numericField, statisticType) : ''
      const name = numericField ? (getFieldSchema(numericField, dataSourceId)?.alias || numericField) : ''
      serie.id = numericField
      serie.x = categoryField
      ; (serie as any).y = y
      serie.name = name
      if (timeIntervalUnits) {
        serie = {
          ...serie,
          ...DefaultTimeBinningProps,
          timeIntervalUnits
        } as any
      }
      return serie
    })
  }
  return series
}

export const createByGroupQuery = ({ categoryField, splitByField, statisticType, numericFields }: SeriesProps, orderByFields: string[], pageSize?: number): FeatureLayerQueryParams => {
  const groupByFieldsForStatistics = [categoryField]
  let where = ''
  if (splitByField) {
    where = `${splitByField}={value}`
  }
  if (statisticType === 'no_aggregation') {
    let outFields = numericFields as unknown as string[]
    if (!outFields.length) {
      outFields = ['']
    }
    return { groupByFieldsForStatistics, outFields, orderByFields, pageSize, where }
  } else {
    let outStatistics = numericFields.map((numericField) => {
      const outStatisticFieldName = getOutStatisticName(numericField, statisticType)

      const statistic: any = {
        statisticType,
        onStatisticField: numericField,
        outStatisticFieldName
      }
      if (statisticType === 'percentile_cont') {
        const statisticParameters = {
          value: 0.5
        }
        statistic.statisticParameters = statisticParameters
      }
      return statistic
    }) as unknown as any[]

    if (!outStatistics.length) {
      outStatistics = [{
        statisticType: statisticType ?? 'sum',
        onStatisticField: '',
        outStatisticFieldName: ''
      }]
    }
    return { groupByFieldsForStatistics, outStatistics, orderByFields, pageSize, where }
  }
}

export const createByFieldSeries = ({ x, y, name, propSeries }): WebChartSeries[] => {
  const seriesProps = propSeries[0]
  const serie = createDefaultSerie(seriesProps, 0)
  serie.x = x
  ;(serie as any).y = y
  serie.name = name
  serie.id = y
  return [serie]
}

export const createByFieldQuery = ({ statisticType, numericFields }, orderByFields): FeatureLayerQueryParams => {
  const outStatistics = numericFields.map((numericField) => {
    const statistic: any = {
      statisticType,
      onStatisticField: numericField,
      outStatisticFieldName: numericField
    }
    if (statisticType === 'percentile_cont') {
      const statisticParameters = {
        value: 0.5
      }
      statistic.statisticParameters = statisticParameters
    }
    return statistic
  })

  return { outStatistics, orderByFields }
}

export const createGaugeSeries = ({ numericField, propSeries }, dataSourceId): WebChartSeries[] => {
  const seriesProps = propSeries[0]
  const serie = createDefaultSerie(seriesProps, 0)
  const statName = GaugeDisplayValueField
  const name = numericField ? (getFieldSchema(numericField, dataSourceId)?.alias || numericField) : ''
  serie.id = numericField
  serie.x = statName
  serie.name = name
  return [serie]
}

export const createHistogramSeries = (x, propSeries, dataSourceId?: string): WebChartSeries[] => {
  const seriesProps = propSeries[0]
  const serie = createDefaultSerie(seriesProps, 0)
  serie.x = x
  const name = getFieldSchema(x, dataSourceId)?.alias || x
  serie.name = name
  serie.id = x
  return [serie]
}

export const createHistogramQuery = (x, orderByFields?: string[], pageSize?: number): FeatureLayerQueryParams => {
  const outFields = []
  if (x) {
    outFields[0] = x
  }
  const query: FeatureLayerQueryParams = { outFields }
  if (orderByFields) {
    query.orderByFields = orderByFields
  }
  if (pageSize) {
    query.pageSize = pageSize
  }
  return { outFields, orderByFields, pageSize }
}

export const createScatterPlotSeries = ({ x, y, propSeries }, dataSourceId?: string): WebChartSeries[] => {
  const seriesProps = propSeries[0]
  const serie = createDefaultSerie(seriesProps, 0)
  serie.x = x
  ;(serie as any).y = y
  const name = getFieldSchema(y, dataSourceId)?.alias || y
  serie.name = name
  serie.id = y
  return [serie]
}

export const createScatterPlotQuery = ({ x, y }, orderByFields?: string[], pageSize?: number): FeatureLayerQueryParams => {
  const outFields = []
  if (x) {
    outFields[0] = x
  }
  if (y) {
    outFields[1] = y
  }
  return { outFields, orderByFields, pageSize }
}

/**
 * Check whether the query in chart data source is valid.
 * @param dataSource
 */
export const isValidQuery = (
  type: ChartTypes,
  query: IMFeatureLayerQueryParams
): boolean => {
  if (isSerialSeries(type) || type === 'pieSeries') {
    if (query.outFields) {
      return !!(query?.outFields?.[0] && query?.groupByFieldsForStatistics?.[0])
    } else {
      if (query?.groupByFieldsForStatistics) {
        return (
          !!query?.groupByFieldsForStatistics?.[0] &&
          !!query?.outStatistics?.[0]?.onStatisticField
        )
      } else {
        return !!query?.outStatistics?.[0]?.onStatisticField
      }
    }
  } else if (type === 'scatterSeries') {
    return !!query?.outFields?.[1]
  } else if (type === 'histogramSeries') {
    return !!query?.outFields?.[0]
  } else if (type === 'gaugeSeries') {
    if (!query?.outStatistics?.[0]) return false
    return query.outStatistics.every((outStatistic, index: number) => {
      if (index !== 0 && !outStatistic) return true
      return !!outStatistic?.onStatisticField
    })
  }
}

export const createGaugeOutStatisticDefinition = ({ statisticType, numericField }): StatisticDefinition => {
  const outStatisticFieldName = GaugeDisplayValueField

  const statistic: StatisticDefinition = {
    statisticType,
    onStatisticField: numericField,
    outStatisticFieldName
  }
  if (statisticType === 'percentile_cont') {
    const statisticParameters = {
      value: 0.5
    }
    statistic.statisticParameters = statisticParameters
  }

  return statistic
}

export const createGaugeQuery = (valueStatistic, minimumStatistic, maximumStatistic): FeatureLayerQueryParams => {
  const outStatistics = [valueStatistic]
  if (minimumStatistic) {
    outStatistics[1] = minimumStatistic
  }
  if (maximumStatistic) {
    outStatistics[2] = maximumStatistic
  }
  return { outStatistics }
}
