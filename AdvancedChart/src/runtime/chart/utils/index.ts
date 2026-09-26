import { type ChartElementLimit, LimitBehavior, getSeriesType } from 'jimu-ui/advanced/chart'
import normalizeSeries from './normalize-series'
import useSelection from './use-selection'
import convertDataItemsFromUpperCase from './convert-data-items-from-uppercase'

const getMinSafeValue = (v1, v2) => {
  if (v1 == null && v2 == null) return
  if (v1 == null && v2 != null) return v2
  if (v1 != null && v2 == null) return v1
  return Math.min(v1, v2)
}

const getChartLimits = (series: any, defaultChartLimits: Partial<ChartElementLimit>, num?: number) => {
  const chartLimits: Partial<ChartElementLimit> = {}
  const seriesLength = series?.length
  if (!seriesLength) return defaultChartLimits
  const seriesType = getSeriesType(series)

  let behaviorAfterLimit: LimitBehavior = LimitBehavior.Reject

  if (seriesType === 'scatterSeries') {
    chartLimits.maxScatterPointsBeforeAggregation = defaultChartLimits.maxScatterPointsBeforeAggregation
    chartLimits.maxScatterPointsAfterAggregation = defaultChartLimits.maxScatterPointsAfterAggregation
  }

  let limitKey = ''
  let limitNum = -1

  if (seriesType === 'barSeries') {
    chartLimits.maxBarChartSeriesCount = defaultChartLimits.maxBarChartSeriesCount
    if (series.length === 1) {
      limitKey = 'maxBarUniqueSeriesCountTotal'
    } else if (series.length === 2) {
      chartLimits.maxBarTwoSeriesCountTotal = defaultChartLimits.maxBarTwoSeriesCountTotal
      limitKey = 'maxBarTwoSeriesCountPerSeries'
    } else if (series.length > 2) {
      chartLimits.maxBarThreePlusSeriesCountTotal = defaultChartLimits.maxBarThreePlusSeriesCountTotal
      limitKey = 'maxBarThreePlusSeriesCountPerSeries'
    }
  } else if (seriesType === 'lineSeries') {
    chartLimits.maxLineChartSeriesCount = defaultChartLimits.maxLineChartSeriesCount
    if (series.length === 1) {
      limitKey = 'maxLineUniqueSeriesCountTotal'
    } else if (series.length === 2) {
      chartLimits.maxLineTwoSeriesCountTotal = defaultChartLimits.maxLineTwoSeriesCountTotal
      limitKey = 'maxLineTwoSeriesCountPerSeries'
    } else if (series.length > 2) {
      chartLimits.maxLineThreePlusSeriesCountTotal = defaultChartLimits.maxLineThreePlusSeriesCountTotal
      limitKey = 'maxLineThreePlusSeriesCountPerSeries'
    }
  } else if (seriesType === 'pieSeries') {
    limitKey = 'maxPieChartSliceCountTotal'
  }
  const defaultLimitNum = defaultChartLimits[limitKey]
  if (num && num <= defaultLimitNum) {
    limitNum = num
    behaviorAfterLimit = LimitBehavior.RenderUpToTheLimit
  } else {
    limitNum = defaultLimitNum
  }
  if (limitKey) {
    chartLimits[limitKey] = limitNum
  }
  chartLimits.behaviorAfterLimit = behaviorAfterLimit
  return chartLimits
}

const getDataItemsWithMixedValue = (dataItems, mixedValue: { [key: string]: any }) => {
  if (!mixedValue || !dataItems) return dataItems
  return dataItems.map((item) => {
    return { ...item, ...mixedValue }
  })
}

export { normalizeSeries, getDataItemsWithMixedValue, useSelection, getMinSafeValue, getChartLimits, convertDataItemsFromUpperCase }
