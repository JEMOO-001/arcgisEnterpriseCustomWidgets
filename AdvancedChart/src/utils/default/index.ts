import {
  type ISimpleMarkerSymbol,
  type IFont,
  type ITextSymbol,
  type ISimpleLineSymbol,
  type ISimpleFillSymbol
} from '@esri/arcgis-rest-types'
import {
  type IMFieldSchema,
  type ImmutableArray,
  JimuFieldType,
  utils
} from 'jimu-core'

import {
  RESTSymbolType,
  RESTHorizontalAlignment,
  type WebChartAxis,
  RESTSimpleMarkerSymbolStyle,
  WebChartTypes,
  getDefaultCategoryFormat,
  type WebChartOverlay,
  RESTVerticalAlignment,
  WebChartLegendPositions,
  getSeriesType,
  RESTFontStyle,
  RESTFontWeight,
  RESTFontDecoration,
  RESTSimpleLineSymbolStyle,
  RESTSimpleFillSymbolStyle,
  type WebChartText,
  WebChartColoringPatterns,
  WebChartStackedKinds,
  type WebChartLegend,
  type ScatterPlotOverlays,
  type ChartTypes,
  type HistogramOverlays,
  WebChartDataTransformations,
  type WebChartGuide,
  type NumberFormatOptions,
  type DateTimeFormatOptions,
  type WebChartPieChartLegend,
  type WebChartGaugeSeries,
  type WebChartGaugeAxis,
  type WebChartNeedle,
  type WebChartGaugeAxisTick,
  type WebChartAxisScrollBar
} from 'jimu-ui/advanced/chart'

import { type HistogramOverlaysType, type WebChartSeries } from '../../config'
import { PieSliceGroupingSliceId } from '../../constants'

export const DefaultColor = 'var(--dark)'
export const DefaultTextColor = 'var(--dark)'
export const DefaultBgColor = 'var(--white)'
export const DefaultLineColor = 'var(--light-900)'
export const DefaultFillColor = 'var(--primary)'
export const DefaultTextSize = 14
export const DefaultCircleMarkerSize = 10
export const DefaultFontWeight = 400

// title
export const DefaultTitleColor = 'var(--black)'
export const DefaultTitleWeight = 500
export const DefaultTitleSize = 24

// footer
export const DefaultFooterSize = 14
export const DefaultFooterColor = 'var(--dark-800)'

// series
export const DefaultSeriesLabelSize = 10
export const DefaultValueLabelColor = 'var(--dark-600)'

// axes
export const DefaultAxisColor = 'var(--light-800)'
export const DefaultAxisLabelColor = 'var(--dark-500)'
export const DefaultAxisTitleColor = 'var(--dark-800)'
export const DefaultAxisTitleSize = 20
export const DefaultAxisLabelSize = 14
export const DefaultAxisScrollbarColor = 'var(--light-500)'
export const DefaultAxisScrollbarWidth = 10
export const DefaultAxisScrollbarGridSize = 20
export const DefaultAxisScrollbarMargin = 20

// guide
export const DefaultGuideFillColor = '#67b7dc'
export const DefaultGuideLineColor = '#67b7dc'
export const DefaultGuideLabelSize = 12

// legend
export const DefaultLegendTitleSize = 20
export const DefaultLegendLabelSize = 14
export const DefaultLegendTitleColor = 'var(--dark-800)'
export const DefaultLegendLabelColor = 'var(--dark-800)'
export const DefaultPieLegendLabelMaxWidth = 200
// grid
export const DefaultGridColor = 'var(--light-300)'
//color by slices
export const DefaultColorBySlicesOtherColor = '#D6D6D6'
//marker simbol
export const defaultMarkerSize = 20

export const DefaultSplitByOtherSeriesColor = '#D6D6D6'

//gauge
export const DefaultGaugeAxisLabelSize = 13
export const DefaultGaugeAxisInnerLabelSize = 24
export const DefaultGaugeAxisColor = 'var(--light-500)'
export const DefaultGaugeAxisInnerLabelColor = 'var(--dark-800)'
export const DefaultGaugeNeedleColor = 'var(--primary)'
export const DefaultGaugeNeedleOutlineColor = 'var(--light-900)'

export const getDefaultColor = (): string => {
  return DefaultColor
}

export const getDefaultTextColor = (): string => {
  return DefaultTextColor
}

export const getDefaultBgColor = (): string => {
  return DefaultBgColor
}

export const getDefaultTitleColor = (): string => {
  return DefaultTitleColor
}

export const getDefaultFooterColor = (): string => {
  return DefaultFooterColor
}

export const getDefaultAxisLabelColor = (): string => {
  return DefaultAxisLabelColor
}

export const getDefaultAxisTitleColor = (): string => {
  return DefaultAxisTitleColor
}

export const getDefaultLegendTitleColor = (): string => {
  return DefaultAxisTitleColor
}

export const getDefaultLegendLabelColor = (): string => {
  return DefaultAxisTitleColor
}

export const getDefaultValueLabelColor = (): string => {
  return DefaultValueLabelColor
}

export const getDefaultGaugeValueLabelColor = (): string => {
  return DefaultValueLabelColor
}

export const getDefaultLineColor = () => {
  return DefaultLineColor
}

export const getDefaultAxisColor = (): string => {
  return DefaultAxisColor
}

export const getDefaultGridColor = (): string => {
  return DefaultGridColor
}

export const SeriesColors = [
  '#5E8FD0',
  '#77B484',
  '#DF6B35',
  '#DBCF4E',
  '#41546D',
  '#8257C2',
  '#D6558B'
]

export const DefaultSeriesOutlineColor = 'var(--light-900)'
export const DefaultPieSeriesOutlineColor = 'var(--light-100)'
export const DefaultScatterPlotTrandLineColor = SeriesColors[2]

const defaultHistomgramMeanColor = '#A6CEE3'
const defaultHistomgramMedianColor = '#33A02C'
const defaultHistomgramStdColor = '#B2DF8A'
const defaultHistomgramCodColor = '#E31A1C'

export const getDefaultHistomgramOverlayColor = (type: HistogramOverlaysType) => {
  if (type === 'mean') {
    return defaultHistomgramMeanColor
  } else if (type === 'median') {
    return defaultHistomgramMedianColor
  } else if (type === 'standardDeviation') {
    return defaultHistomgramStdColor
  } else if (type === 'comparisonDistribution') {
    return defaultHistomgramCodColor
  }
}

export const getDefaultSeriesOutlineColor = (type: ChartTypes = 'barSeries') => {
  if (isXYChart(type)) {
    return DefaultSeriesOutlineColor
  } else if (type === 'pieSeries') {
    return DefaultPieSeriesOutlineColor
  } else {
    return DefaultSeriesOutlineColor
  }
}

export const getDefaultSeriesFillColor = (): string => {
  return SeriesColors[0]
}

export const getDefaultNumberFormat = (): NumberFormatOptions => {
  return {
    type: WebChartTypes.NumberAxisFormat,
    intlOptions: {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }
  }
}

export const getDefaultPercentNumberFormat = (): NumberFormatOptions => {
  return {
    type: WebChartTypes.NumberAxisFormat,
    intlOptions: {
      style: 'percent',
      notation: 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }
  }
}

export const getDefaultDateFormat = (): DateTimeFormatOptions => {
  return {
    type: WebChartTypes.DateAxisFormat,
    intlOptions: {}
  }
}

/**
 * Get colors in order
 */
export const getColorInOrder = (colors: string[], index: number = 0): string => {
  const length = colors?.length ?? 0
  if (length < 0) return
  index = index % length
  if (index < 0) index = 0
  return colors[index]
}

/**
 * Get color in order, but not repeat the previous one.
 * @param index
 * @param preSerieColor
 * @returns
 */
export const getNonRepeatingColor = (colors: string[], index: number = 0, preSerieColor: string): string => {
  let color = getColorInOrder(colors, index)
  if (color === preSerieColor) {
    color = getColorInOrder(colors, index + 1)
  }
  return color
}

/**
 * Get series fill colors in order
 */
export const getSeriesFillColor = (index: number = 0): string => {
  return getColorInOrder(SeriesColors, index)
}

/**
 * Get series fill colors in order, but not repeat the previous one.
 * @param index
 * @param preSerieColor
 * @returns
 */
export const getNonRepeatingSeriesFillColor = (index: number = 0, preSerieColor: string): string => {
  return getNonRepeatingColor(SeriesColors, index, preSerieColor)
}

export const DefaultFont: IFont = {
  family: 'Avenir Next',
  size: DefaultTextSize,
  style: RESTFontStyle.Normal,
  weight: RESTFontWeight.Normal,
  decoration: RESTFontDecoration.None
}

export const DefaultTextSymbol: ITextSymbol = {
  type: RESTSymbolType.TS,
  color: DefaultTextColor as any,
  font: DefaultFont,
  horizontalAlignment: RESTHorizontalAlignment.Center
}

export const DefaultLineSymbol: ISimpleLineSymbol = {
  type: RESTSymbolType.SLS,
  style: RESTSimpleLineSymbolStyle.Solid,
  color: DefaultLineColor as any,
  width: 1
}

export const DefaultFillSymbol: ISimpleFillSymbol = {
  type: RESTSymbolType.SFS,
  style: RESTSimpleFillSymbolStyle.Solid,
  color: DefaultFillColor as any,
  outline: DefaultLineSymbol
}

export const DefaultCircleMarkerSymbol: ISimpleMarkerSymbol = {
  type: RESTSymbolType.SMS,
  style: RESTSimpleMarkerSymbolStyle.Circle,
  color: DefaultFillColor as any,
  size: DefaultCircleMarkerSize,
  outline: DefaultLineSymbol
}

export const getFont = (size = DefaultTextSize): IFont => {
  return {
    ...DefaultFont,
    size
  }
}

/**
 * Get the default text symbol
 * @param text
 * @param size
 */
export const getTextSymbol = (
  text = '',
  size = DefaultTextSize,
  color = DefaultTextColor as any
): ITextSymbol => {
  return {
    ...DefaultTextSymbol,
    text,
    color,
    font: getFont(size)
  }
}

/**
 * Get the default line symbol
 * @param useRandomColor Whether to randomly generate colors
 * @param width
 */
export const getLineSymbol = (
  width: number = 1,
  color = DefaultLineColor as any,
  style: RESTSimpleLineSymbolStyle = RESTSimpleLineSymbolStyle.Solid
): ISimpleLineSymbol => {
  return {
    ...DefaultLineSymbol,
    width,
    color,
    style
  }
}

/**
 * Get the default fill symbol.
 */
export const getFillSymbol = (
  color: string = DefaultColor,
  outlineWidth: number = 1,
  outlineColor = DefaultLineColor
): ISimpleFillSymbol => {
  return {
    ...DefaultFillSymbol,
    color: color as any,
    outline: getLineSymbol(outlineWidth, outlineColor)
  }
}

/**
 * Get the default circle marker symbol
 */
export const getCircleMarkerSymbol = (
  color: any = DefaultFillColor,
  outlineWidth: number = 0,
  markerSize: number = DefaultCircleMarkerSize
): ISimpleMarkerSymbol => {
  return {
    ...DefaultCircleMarkerSymbol,
    color,
    size: markerSize,
    outline: getLineSymbol(outlineWidth)
  }
}

export function getDefaultGuide (name: string, label: string = '', isHorizontal?: boolean): WebChartGuide {
  const horizontalAlignment = isHorizontal ? 'center' : 'right'
  const verticalAlignment = isHorizontal ? 'top' : 'middle'
  const labelText = getTextSymbol(label, DefaultGuideLabelSize, DefaultTextColor as any)
  labelText.horizontalAlignment = horizontalAlignment
  labelText.verticalAlignment = verticalAlignment

  return {
    type: WebChartTypes.Guide,
    start: undefined,
    style: getLineSymbol(2, DefaultGuideLineColor as any),
    name,
    label: labelText,
    visible: true,
    above: false
  }
}

export function getDefaultOverlay (color?: string): WebChartOverlay {
  return {
    type: WebChartTypes.Overlay,
    visible: false,
    created: false,
    symbol: getLineSymbol(1, color)
  }
}

export function getScatterPlotOverlays (
  color: any = SeriesColors[2],
  width: number = 3
): ScatterPlotOverlays {
  return {
    type: WebChartTypes.Overlays,
    trendLine: {
      type: WebChartTypes.Overlay,
      created: true,
      visible: true,
      symbol: {
        type: 'esriSLS',
        color,
        width
      }
    }
  }
}

/**
 * Generate a default chart text
 * @param visible
 */
export const getChartText = (
  text = '',
  visible: boolean = true,
  size?: number,
  color = DefaultTextColor as any
): WebChartText => {
  return {
    type: WebChartTypes.Text,
    visible,
    content: getTextSymbol(text, size, color)
  }
}

export const getAxisScrollbar = (
  visible: boolean = false,
  color = DefaultAxisScrollbarColor as any
): WebChartAxisScrollBar => {
  return {
    visible,
    width: DefaultAxisScrollbarWidth,
    color,
    gripSize: DefaultAxisScrollbarGridSize,
    margin: DefaultAxisScrollbarMargin
  }
}

export const getCategoryAxis = (text = '', showLabels = false): WebChartAxis => {
  const title = getChartText(text, false, DefaultAxisTitleSize, DefaultAxisTitleColor)
  title.content.horizontalAlignment = RESTHorizontalAlignment.Center
  return {
    type: WebChartTypes.Axis,
    visible: true,
    title,
    labels: getChartText('', showLabels, DefaultAxisLabelSize, DefaultAxisLabelColor),
    valueFormat: getDefaultCategoryFormat(),
    lineSymbol: getLineSymbol(1, DefaultAxisColor)
  }
}

export const getValueAxis = (
  text = '',
  isYAxis?: boolean,
  showLabels = false,
  labelSize = DefaultAxisLabelSize,
  axisColor = DefaultAxisColor
): WebChartAxis => {
  const title = getChartText(text, false, DefaultAxisTitleSize, DefaultAxisTitleColor)
  if (isYAxis) {
    title.content.horizontalAlignment = undefined
    title.content.verticalAlignment = RESTVerticalAlignment.Middle
    title.content.angle = 270
  } else {
    title.content.horizontalAlignment = RESTHorizontalAlignment.Center
  }
  return {
    type: WebChartTypes.Axis,
    visible: true,
    title,
    labels: getChartText('', showLabels, labelSize, DefaultAxisLabelColor),
    valueFormat: getDefaultNumberFormat(),
    lineSymbol: getLineSymbol(1, axisColor)
  }
}

function getGaugeNeedle (color = DefaultGaugeNeedleColor): WebChartNeedle {
  return {
    type: 'gaugeNeedle',
    visible: true,
    startWidth: 20,
    endWidth: 2,
    innerRadius: 25,
    displayPin: false,
    symbol: {
      type: 'esriSFS',
      color: color as any,
      outline: {
        type: 'esriSLS',
        style: 'esriSLSSolid',
        color: DefaultGaugeNeedleOutlineColor as any,
        width: 0
      }
    }
  }
}

function getGaugeTikes (): WebChartGaugeAxisTick {
  return {
    type: 'gaugeAxisTick',
    visible: true
  }
}

/**
 * Returns the gauge axis
 */
export function getGaugeAxis (showLabels: boolean = false): WebChartGaugeAxis {
  let axis = getValueAxis('', false, showLabels, DefaultGaugeAxisLabelSize, DefaultGaugeAxisColor) as WebChartGaugeAxis

  const innerLabel = getChartText('', false, DefaultGaugeAxisInnerLabelSize, DefaultGaugeAxisInnerLabelColor)
  innerLabel.content.verticalAlignment = 'bottom'
  const needle = getGaugeNeedle()
  const ticks = getGaugeTikes()
  axis = {
    ...axis,
    innerLabel,
    needle,
    ticks
  }
  return axis
}

/**
 * Returns default axes based on chart type as per the WebChart Specification
 * @param chartType The type of WebChart which is of type WebChartTypes.BarSeries | WebChartTypes.HistogramSeries | WebChartTypes.ScatterSeries
 *
 */
export function getDefaultAxes (
  chartType:
    typeof WebChartTypes.BarSeries
  | typeof WebChartTypes.LineSeries
  | typeof WebChartTypes.HistogramSeries
  | typeof WebChartTypes.ScatterSeries
  | typeof WebChartTypes.GaugeSeries,
  showLabels?: boolean
): WebChartAxis[] {
  const defaultAxes: WebChartAxis[] = []
  const xAxisTitle = ''
  const yAxisTitle = ''
  const yAxis = getValueAxis(yAxisTitle, true, showLabels)
  const defaultGridLine = getLineSymbol(
    1,
    DefaultGridColor,
    RESTSimpleLineSymbolStyle.Dash
  )
  switch (chartType) {
    case WebChartTypes.BarSeries: {
      // Setting Line Chart baseline to 0.
      yAxis.minimum = 0
      yAxis.grid = defaultGridLine
      defaultAxes.push(getCategoryAxis(xAxisTitle, showLabels), yAxis)
      break
    }
    case WebChartTypes.LineSeries: {
      // Setting Bar Chart baseline to 0.
      yAxis.minimum = 0
      yAxis.grid = defaultGridLine
      defaultAxes.push(getCategoryAxis(xAxisTitle, showLabels), yAxis)
      break
    }
    case WebChartTypes.ScatterSeries: {
      const xAxis = getValueAxis(xAxisTitle, false, showLabels, DefaultAxisLabelSize, DefaultAxisColor)
      xAxis.grid = defaultGridLine
      yAxis.grid = defaultGridLine
      defaultAxes.push(xAxis, yAxis)
      break
    }
    case WebChartTypes.HistogramSeries: {
      yAxis.grid = defaultGridLine
      defaultAxes.push(getValueAxis(xAxisTitle, false, showLabels), yAxis)
      break
    }
    case WebChartTypes.GaugeSeries: {
      defaultAxes.push(getGaugeAxis(showLabels))
      break
    }
    default:
      break
  }
  return defaultAxes
}

export interface SeriesColorProps {
  color?: string
  preSerieColor?: string
  colors?: string[]
}

/**
 * Returns a default BarChartSeries object as per the WebChart Specification
 */
export function getDefaultBarChartSeries (index: number = 0, colorProps?: SeriesColorProps): WebChartSeries {
  const color = !colorProps?.color ? getNonRepeatingColor(colorProps?.colors ?? SeriesColors, index, colorProps?.preSerieColor) : colorProps?.color
  return {
    type: WebChartTypes.BarSeries,
    id: '',
    name: '',
    x: '',
    y: '',
    colorType: WebChartColoringPatterns.Single,
    stackedType: WebChartStackedKinds.Side,
    fillSymbol: getFillSymbol(color, 0),
    dataLabels: getChartText('', false, DefaultSeriesLabelSize, DefaultValueLabelColor),
    rotated: false
  } as WebChartSeries
}

/**
 * Returns a default LineChartSeries object as per the WebChart Specification
 */
export function getDefaultLineChartSeries (index: number = 0, colorProps?: SeriesColorProps): WebChartSeries {
  const color = !colorProps?.color ? getNonRepeatingColor(colorProps?.colors ?? SeriesColors, index, colorProps?.preSerieColor) : colorProps?.color
  return {
    type: WebChartTypes.LineSeries,
    id: '',
    name: '',
    x: '',
    y: '',
    colorType: WebChartColoringPatterns.Single,
    stackedType: WebChartStackedKinds.Side,
    lineSymbol: getLineSymbol(2, color),
    dataLabels: getChartText('', false, DefaultSeriesLabelSize, DefaultValueLabelColor),
    rotated: false
  } as WebChartSeries
}

/**
 * Returns a default PieChartSeries object as per the WebChart Specification
 */
export function getDefaultPieChartSeries (innerRadius: number = 0): WebChartSeries {
  const color = getSeriesFillColor(0)
  return {
    type: WebChartTypes.PieSeries,
    colorType: WebChartColoringPatterns.Single,
    id: '',
    name: '',
    x: '',
    y: '',
    innerRadius,
    startAngle: 0,
    endAngle: 360,
    displayNumericValueOnDataLabel: true,
    displayPercentageOnDataLabel: false,
    displayNumericValueOnTooltip: true,
    displayPercentageOnTooltip: true,
    dataLabelsOffset: 0,
    sliceGrouping: {
      sliceId: PieSliceGroupingSliceId,
      percentageThreshold: 0,
      label: 'Other'
    },
    numericValueFormat: getDefaultNumberFormat(),
    percentValueFormat: getDefaultPercentNumberFormat(),
    fillSymbol: getFillSymbol(color, 1, 'var(--light-100)'),
    dataLabels: getChartText('', false, DefaultSeriesLabelSize, DefaultValueLabelColor)
  } as WebChartSeries
}

/**
 * Returns a default ScatterPlotChartSeries object as per the WebChart Specification
 */
export function getDefaultScatterPlotChartSeries (): WebChartSeries {
  const color = getSeriesFillColor(0)
  return {
    type: WebChartTypes.ScatterSeries,
    colorType: WebChartColoringPatterns.Single,
    id: '',
    name: '',
    x: '',
    y: '',
    markerSymbol: getCircleMarkerSymbol(color, 0, defaultMarkerSize),
    overlays: getScatterPlotOverlays()
  } as WebChartSeries
}

/**
 * Returns a default HistogramChartSeries object as per the WebChart Specification
 */
export function getDefaultHistogramSeries (dataTransformationType: WebChartDataTransformations = WebChartDataTransformations.None): WebChartSeries {
  const color = getSeriesFillColor(0)
  return {
    type: WebChartTypes.HistogramSeries,
    colorType: WebChartColoringPatterns.Single,
    id: '',
    name: '',
    x: '',
    binCount: 15,
    overlays: getDefaultHistogramOverlays(),
    dataTransformationType,
    fillSymbol: getFillSymbol(color, 1, 'var(--light-100)'),
    dataLabels: getChartText('', false, DefaultSeriesLabelSize, DefaultValueLabelColor),
    rotated: false
  } as WebChartSeries
}

/**
 * Returns a default GaugeSeries object as per the WebChart Specification
 */
export function getDefaultGaugeSeries (): WebChartGaugeSeries {
  return {
    type: WebChartTypes.GaugeSeries,
    id: '',
    name: '',
    x: ''
  }
}

export function getDefaultHistogramOverlays (): HistogramOverlays {
  return {
    type: WebChartTypes.Overlays,
    mean: getDefaultOverlay(getDefaultHistomgramOverlayColor('mean')),
    median: getDefaultOverlay(getDefaultHistomgramOverlayColor('median')),
    standardDeviation: getDefaultOverlay(getDefaultHistomgramOverlayColor('standardDeviation')),
    comparisonDistribution: getDefaultOverlay(getDefaultHistomgramOverlayColor('comparisonDistribution'))
  }
}

export const getDefaultLegend = (visible = true, isPie: boolean = false): WebChartLegend => {
  let legend: WebChartLegend = {
    type: WebChartTypes.Legend,
    visible,
    title: getChartText('', true, DefaultLegendTitleSize, DefaultLegendTitleColor),
    body: getTextSymbol('', DefaultLegendLabelSize, DefaultLegendLabelColor),
    position: WebChartLegendPositions.Right
  }
  if (isPie) {
    legend = {
      ...legend,
      labelMaxWidth: DefaultPieLegendLabelMaxWidth
    } as WebChartPieChartLegend
  }
  return legend
}

/**
 * Generate a `FormatOptions` of ac-spec by a field schema
 * @param fieldSchema
 * @param characterLimit
 */
export const getValueFormat = (
  fieldSchema: IMFieldSchema,
  characterLimit: number = 11
): any => {
  if (fieldSchema.type === JimuFieldType.Date) {
    const intlOptions = utils.getIntlOption(fieldSchema) ?? {}
    return {
      type: 'date',
      intlOptions
    }
  } else if (fieldSchema.type === JimuFieldType.String) {
    return {
      type: 'category',
      characterLimit
    }
  } else if (fieldSchema.type === JimuFieldType.Number) {
    const intlOptions = utils.getIntlOption(fieldSchema) ?? {}
    return {
      type: 'number',
      intlOptions
    }
  }
}

export const isSerialSeries = (
  value?: string | WebChartSeries[] | ImmutableArray<WebChartSeries>
): boolean => {
  if (value == null || (value as string) === '') return
  const seriesType = typeof value === 'string' ? value as ChartTypes : getSeriesType(value as any) as string
  return seriesType === WebChartTypes.BarSeries || seriesType === WebChartTypes.LineSeries
}

/**
 * Check if the chart is a XY chart.
 * @param series
 * @returns {boolean}
 */
export const isXYChart = (value: string | WebChartSeries[] | ImmutableArray<WebChartSeries>): boolean => {
  if (value == null || (value as string) === '') return false
  const seriesType = typeof value === 'string' ? value : getSeriesType(value as any) as string
  return seriesType === WebChartTypes.BarSeries || seriesType === WebChartTypes.LineSeries ||
    seriesType === WebChartTypes.ScatterSeries || seriesType === WebChartTypes.HistogramSeries
}

export const isGaugeChart = (value: string | WebChartSeries[] | ImmutableArray<WebChartSeries>): boolean => {
  if (value == null || (value as string) === '') return false
  const seriesType = typeof value === 'string' ? value : getSeriesType(value as any) as string
  return seriesType === WebChartTypes.GaugeSeries
}
