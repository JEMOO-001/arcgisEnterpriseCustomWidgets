import { type StatisticDefinition, type FeatureLayerQueryParams, type ImmutableObject, type SqlExpression } from 'jimu-core'
import {
  type WebMapWebChart,
  type WebMapWebGaugeChart,
  type WebChartSeries as _WebChartSeries,
  type WebChartConfigFields,
  type WebChartGaugeAxis,
  type WebChartAxis
} from 'jimu-ui/advanced/chart'

export type WebChartSeries = Omit<_WebChartSeries, 'query'> & {
  query?: FeatureLayerQueryParams
  //add for custom added split-by series, will be removed at runtime
  deletable?: boolean
}

export type HistogramOverlaysType = 'mean' | 'median' | 'standardDeviation' | 'comparisonDistribution'

export const ConfigFields = {
  fillColor: '_fillColor'
}

export interface ColorMatches {
  [value: string]: {
    _fillColor: any
  }
}

export interface ChartDataSource {
  query: FeatureLayerQueryParams
  /**
   * Use series.slices instead for pie chart
   * @deprecated
   */
  colorMatch?: {
    configFields?: WebChartConfigFields
    colorMatches: ColorMatches
  }
}

interface WebChart extends Omit<WebMapWebChart, 'axes'>, Omit<WebMapWebGaugeChart, 'axes'> {
  axes?: [WebChartAxis, WebChartAxis?] | [WebChartGaugeAxis]
}


export interface ChartComponentProps {
  /**
   * When `true`, the series is hidden in the legend if it doesn't have data (i.e. empty). For eg. after applying a filter by attribute or geometry (as when using the filter by extent)
   * @default false
   */
  hideEmptySeriesInLegend?: boolean

  /**
   * When a data point representing a person/entity is clicked, automatically zoom the map to their parcel(s).
   * @default true
   */
  autoZoomToParcel?: boolean

  /**
   * Whether clicking a data point opens the map pop-up for the features behind it.
   * A point on an aggregate chart stands for many features, so its pop-up would show
   * an arbitrary one of them; the container sets this to false for that case and true
   * once the chart has drilled down to individual records.
   * @default true
   */
  openSelectionPopup?: boolean

  /** NEW: drilldown / comparison panel settings */
  drilldown?: DrilldownOptions

  /** Custom tooltip formatter passed to chart components */
  tooltipFormatter?: (params: any) => string
}

export interface DrilldownOptions {
  /** Field used as the "client / person" grouping when an airport is selected. Default: 'Client' */
  clientField?: string
  /** Field used to identify the selected airport in the incoming filter. Default: 'AirportName' */
  airportField?: string
  /** Field used for the year-over-year comparison. Default: 'Year' */
  yearField?: string
  /** Field summed for area / statistics. Default: 'إجمالي المساحة بالفدان' */
  areaField?: string
  /** How many top clients (by area) to show once an airport is selected. Default: 20, range 5-30 */
  topN?: number
  /** Font family for the comparison summary text */
  fontFamily?: string
  /** Font size (px) for the comparison summary text */
  fontSize?: number
}

export interface IWebChart extends Omit<WebChart, 'background' | 'series'> {
  dataSource: ChartDataSource
  background?: string
  series: WebChartSeries[]
}

export enum CategoryType {
  ByGroup = 'BYGROUP',
  ByField = 'BYFIELD'
}

export interface ChartTools {
  filter?: SqlExpression
  cursorEnable?: boolean
}

export type ChartType = 'column' | 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'histogram' | 'gauge'

export type TemplateType = 'bar' | 'stacked-bar' | 'stacked100-bar'
| 'column' | 'stacked-column' | 'stacked100-column'
| 'line' | 'smooth-line'
| 'area' | 'smooth-area'
| 'pie' | 'donut'
| 'scatter'
| 'histogram'
| 'gauge'

export interface RechartConfig {
  enabled?: boolean
  template?: string
  _templateType?: TemplateType
  webChart?: IWebChart
  tools?: ChartTools
  options?: ChartComponentProps
  filterField?: string
}

export interface Config {
  //It is only used when configuring the app template
  _templateType?: TemplateType
  template: string
  webChart: IWebChart
  tools?: ChartTools
  options?: ChartComponentProps
  rechart?: RechartConfig
}

export type IMConfig = ImmutableObject<Config>

export type ChartStatisticType = Omit<StatisticDefinition['statisticType'], 'stddev' | 'var' | 'percentile_disc'> | 'no_aggregation'
