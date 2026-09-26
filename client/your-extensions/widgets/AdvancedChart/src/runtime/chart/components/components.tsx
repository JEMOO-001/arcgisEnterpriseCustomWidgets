import { React, type ImmutableObject, hooks } from 'jimu-core'
import type FeatureLayer from 'esri/layers/FeatureLayer'
import {
  Gauge,
  BarChart,
  LineChart,
  PieChart,
  Histogram,
  ScatterPlot,
  getSeriesType,
  type ActionMode,
  type BarAndLineDataLabelFormatCallback,
  type BarAndLineTooltipFormatCallback,
  type ChartComponentEventCallbacks,
  type ChartElementLimit,
  type HistogramLabelFormatCallback,
  type InlineData,
  type PieChartLabelFormatCallback,
  type PieChartLegendValueLabelFormatCallback,
  type ScatterPlotLabelFormatCallback,
  type SelectionData,
  type SelectionTheme,
  type UnprivilegedChart,
  type WebChartDataFilters,
  type WebChartDataSources,
  type WebChartLegendPositions,
  type WebMapWebChart,
  type PreRenderCallback,
  type WebMapWebGaugeChart
} from 'jimu-ui/advanced/chart'

export interface ChartComponentsProps extends ChartComponentEventCallbacks {
  /**
   * Defines the class names added to the component.
   */
  className?: string
  /**
   * When the version number changes, force the chart data to be updated once.
   */
  version?: number
  /**
   * Used by `@arcgis/charts-components` package, both mutable and immutable are supported.
   */
  webMapWebChart: WebMapWebChart | ImmutableObject<WebMapWebChart> | WebMapWebGaugeChart | ImmutableObject<WebMapWebGaugeChart>
  /**
   * Property representing the datasource. Can be Feature layer or vanilla POJOs.
   */
  dataSource?: WebChartDataSources
  /**
  * Used to apply runtime filters to the chart's data while in Feature Layer mode.
  */
  runtimeDataFilters?: WebChartDataFilters
  /**
   * A property representing the selection to apply on the chart.
   * The properties are considered in the following order:
   * - selectionData.selectionOIDs: an array of Object Ids (for Feature Layer) representing a selection to apply to the chart.
   * - selectionData.selectionItems: an array of data items representing a selection to apply to the chart.
   */
  selectionData?: SelectionData
  /**
   * Used to provide a customized theme for the selected and non selected elements.
   * If no style is provided for the selected elements, a default selection is applied.
   * If no style is provided for the non selected elements, the chart's style is applied.
   */
  selectionTheme?: SelectionTheme
  /**
   * Used to customize the chart's limits, especially the maximum number of bars to be displayed.
   */
  chartLimits?: Partial<ChartElementLimit>
  /**
   * Used to build/update inline data source of the chart
   */
  inlineData?: InlineData<any>
  /**
   * used to perform queries or client-side queries (if the view is provided)
   */
  layer?: FeatureLayer
  /**
   * Set the chart's mode (zoom, selection, none)
   * - zoom: allows to zoom on the chart. All selection is disabled
   * - mono-selection: the selection is enabled but only one element can be selected. Zoom is disabled
   * - multi-selection: the selection is enabled and allows selecting multiple elements. Zoom is disabled
   * - multi-selection-with-ctrl-key: the selection is enabled and allows selecting multiple elements when the ctrl/cmd key is pressed. Zoom is disabled
   * - none: the zoom and selection features are disabled
   */
  actionMode?: ActionMode
  /**
   * optional create message to be displayed in the chart container.
   */
  placeholder?: string
  /**
   * Can be used when creating or updating a chart compatible with time binning. If this option is `true`, the series properties
   * `timeIntervalUnits` and `timeIntervalSize` become optional and will be automatically set to values that fit the data set.
   * @default false
   * Note: Only valid for `lineSeries`.
   */
  setTimeBinningInfoWhenNotProvided?: boolean
  /**
   * Used to customize the way the tooltips are rendered. The callback function can return an HTML string and the tags will
   * be interpreted properly.
   */
  tooltipFormatter?:
  | PieChartLabelFormatCallback
  | HistogramLabelFormatCallback
  | ScatterPlotLabelFormatCallback
  | BarAndLineTooltipFormatCallback
  dataLabelFormatter?:
  | PieChartLabelFormatCallback
  | HistogramLabelFormatCallback
  | ScatterPlotLabelFormatCallback
  | BarAndLineDataLabelFormatCallback
  /**
   * Used by the legend position change action.
   */
  legendPosition?: WebChartLegendPositions
  /**
   * A callback function used to format the legend value labels. If the returned string contains HTML tags they will be interpreted as such.
   * If provided, the formatter will be used if at least `WebChartPieChartLegend.displayNumericValue` or `WebChartPieChartLegend.displayPercentage` is true.
   * Note: Only valid for `pieSeries`.
   */
  legendValueLabelFormatter?: PieChartLegendValueLabelFormatCallback
  /**
   * Can be used to disable the default setting that uses debounce functions to handle the visibility of markers that are outside of the plotting area
   * when the min/max bound changes and/or when a zoom action is performed (via chart cursor or scrollbar), to increase performance.
   * This property will be set when the chart is created and cannot be updated after that. It's recommended that this property should only be set to true for small datasets.
   * @default false
   * Note: Only valid for `lineSeries` and `scatterSeries`.
   */
  ignoreSmoothRenderingLimit?: boolean
  /**
   * Used by the legend visibility change action.
   */
  legendVisibility?: boolean
  /**
   * enable filter by selection
   */
  filterBySelection?: boolean
  /**
   * used to disable all interactions on the chart (legend hit, selection, zoom...)
   */
  disableInteractions?: boolean
  /**
   * To enable the responsive features.
   * @default false
   */
  enableResponsiveFeatures?: boolean
  /**
   * To auto-dispose a chart if a new one is created in the same container.
   * @default true
   */
  autoDisposeChart?: boolean
  /**
   * To ensure that charts are built one by one.
   * @default true
   */
  queueChartCreation?: boolean
  /**
   * To activate the animations on the chart.
   * @default false
   */
  useAnimatedCharts?: boolean
  /**
   * To hide the licence watermark.
   * @default true
   */
  hideLicenceWatermark?: boolean
  /**
    * Used to hide the loader animation (curtain and spinner), showed by default at every update.
    * @default false
    */
  hideLoaderAnimation?: boolean
  /**
    * Indicates if the selection indexes need to be computed whenever a selection is made on or passed to the chart.
    * @default true
    */
  returnSelectionIndexes?: boolean
  /**
    * Indicates if the object ids need to be computed whenever a selection is made on or passed to the chart. Only considered for a data source using a feature layer.
    * @default false
    */
  returnSelectionOIDs?: boolean
  /**
    * Lifecycle function executed after the data has been processed and before the chart renders. Can be used to alter the config.series[0].slices property from instance.
    * Note: only valid for pie chart.
    */
  chartWillRender?: PreRenderCallback
  /**
    * Used to set a custom time zone for the chart.
    */
  timeZone?: __esri.MapView['timeZone']

  /**
    * When `true`, the series is hidden in the legend if it doesn't have data (i.e. empty).
    * For eg. after applying a filter by attribute or geometry (as when using the filter by extent)
    * @default false
    */
  hideEmptySeriesInLegend?: boolean
}

export const ChartComponents = React.forwardRef(
  (
    props: ChartComponentsProps,
    ref: React.Ref<UnprivilegedChart>
  ): React.ReactElement => {
    const {
      version,
      tooltipFormatter,
      dataLabelFormatter,
      enableResponsiveFeatures = false,
      autoDisposeChart = false,
      queueChartCreation = true,
      useAnimatedCharts = false,
      hideLicenceWatermark = true,
      ignoreSmoothRenderingLimit = false,
      legendValueLabelFormatter,
      setTimeBinningInfoWhenNotProvided,
      returnSelectionIndexes = true,
      returnSelectionOIDs = false,
      chartWillRender,
      hideEmptySeriesInLegend = false,
      webMapWebChart,
      ...others
    } = props

    const chartRef = React.useRef<UnprivilegedChart>(null)
    const handleRef = hooks.useForkRef(ref, chartRef)

    const seriesType = getSeriesType(props.webMapWebChart?.series as any)

    const globalOptions = {
      autoDisposeChart,
      enableResponsiveFeatures,
      queueChartCreation,
      useAnimatedCharts,
      hideLicenceWatermark,
      returnSelectionIndexes,
      returnSelectionOIDs
    }

    hooks.useUpdateEffect(() => {
      if (chartRef.current) {
        chartRef.current.refresh()
      }
    }, [version])

    return (
      <>
        {seriesType === 'barSeries' && (
          <BarChart
            ref={handleRef}
            webMapWebChart={webMapWebChart}
            {...others}
            dataLabelFormatter={
              dataLabelFormatter as BarAndLineDataLabelFormatCallback
            }
            tooltipFormatter={
              tooltipFormatter as BarAndLineTooltipFormatCallback
            }
            {...globalOptions}
            hideEmptySeriesInLegend={hideEmptySeriesInLegend}
          />
        )}
        {seriesType === 'lineSeries' && (
          <LineChart
            ref={handleRef}
            webMapWebChart={webMapWebChart}
            {...others}
            dataLabelFormatter={
              dataLabelFormatter as BarAndLineDataLabelFormatCallback
            }
            tooltipFormatter={
              tooltipFormatter as BarAndLineTooltipFormatCallback
            }
            ignoreSmoothRenderingLimit={ignoreSmoothRenderingLimit}
            setTimeBinningInfoWhenNotProvided={
              setTimeBinningInfoWhenNotProvided
            }
            {...globalOptions}
            hideEmptySeriesInLegend={hideEmptySeriesInLegend}
          />
        )}
        {seriesType === 'pieSeries' && (
          <PieChart
            ref={handleRef}
            webMapWebChart={webMapWebChart}
            {...others}
            dataLabelFormatter={
              dataLabelFormatter as PieChartLabelFormatCallback
            }
            tooltipFormatter={tooltipFormatter as PieChartLabelFormatCallback}
            legendValueLabelFormatter={legendValueLabelFormatter}
            chartWillRender={chartWillRender}
            {...globalOptions}
          />
        )}
        {seriesType === 'scatterSeries' && (
          <ScatterPlot
            ref={handleRef}
            webMapWebChart={webMapWebChart}
            {...others}
            dataLabelFormatter={
              dataLabelFormatter as ScatterPlotLabelFormatCallback
            }
            tooltipFormatter={
              tooltipFormatter as ScatterPlotLabelFormatCallback
            }
            ignoreSmoothRenderingLimit={ignoreSmoothRenderingLimit}
            {...globalOptions}
          />
        )}
        {seriesType === 'histogramSeries' && (
          <Histogram
            ref={handleRef}
            webMapWebChart={webMapWebChart}
            {...others}
            dataLabelFormatter={
              dataLabelFormatter as HistogramLabelFormatCallback
            }
            tooltipFormatter={tooltipFormatter as HistogramLabelFormatCallback}
            {...globalOptions}
          />
        )}
        {seriesType === 'gaugeSeries' && (
          <Gauge
            ref={handleRef}
            webMapWebChart={webMapWebChart as ImmutableObject<WebMapWebGaugeChart>}
            {...others}
            {...globalOptions}
          />
        )}
      </>
    )
  }
)
