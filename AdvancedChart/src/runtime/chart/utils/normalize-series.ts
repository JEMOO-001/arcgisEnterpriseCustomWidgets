import { type FeatureLayerQueryParams, type ImmutableArray, type ImmutableObject } from 'jimu-core'
import { isSerialSeries } from '../../../utils/default'
import { CategoryType, type WebChartSeries } from '../../../config'
import { getSeriesType, getSplitByValue } from 'jimu-ui/advanced/chart'
import { getCategoryType, getSplitOutStatisticName } from '../../../utils/common'

const getSingleQueryForByGroup = (serie: ImmutableObject<WebChartSeries>, queries: ImmutableObject<FeatureLayerQueryParams>): ImmutableObject<WebChartSeries> => {
  const y = (serie as any).y
  const outStatistics = queries?.outStatistics ? queries.outStatistics.filter((s) => s.outStatisticFieldName === y) : []
  const { groupByFieldsForStatistics, orderByFields, pageSize } = queries ?? {}
  const query = { groupByFieldsForStatistics, outStatistics, orderByFields, num: pageSize }
  return serie.set('query', query)
}

const getSingleQueryForGauge = (serie: ImmutableObject<WebChartSeries>, queries: ImmutableObject<FeatureLayerQueryParams>): ImmutableObject<WebChartSeries> => {
  const { outStatistics, pageSize } = queries ?? {}
  const query = { outStatistics: outStatistics?.[0] ? [outStatistics[0]] : [], num: pageSize }
  return serie.set('query', query)
}

const getSingleQueryForNoAggregation = (serie: ImmutableObject<WebChartSeries>, queries: ImmutableObject<FeatureLayerQueryParams>): ImmutableObject<WebChartSeries> => {
  const { orderByFields, pageSize, groupByFieldsForStatistics = [], outFields: _outFields = [] } = queries
  const outFields = groupByFieldsForStatistics.concat(_outFields)
  const query = { orderByFields, num: pageSize, outFields }
  return serie.set('query', query)
}

const getSingleQueryForSplitBy = (serie: ImmutableObject<WebChartSeries>, queries: ImmutableObject<FeatureLayerQueryParams>): ImmutableObject<WebChartSeries> => {
  const where = serie?.query?.where ?? queries?.where ?? ''
  const splitByValue = getSplitByValue({ where, normalize: true })
  if (queries?.outFields?.length) { //no aggregation
    const { orderByFields, pageSize } = queries
    const query = { where, orderByFields, num: pageSize }
    return serie.set('query', query)
  } else {
    const onStatisticField = queries?.outStatistics?.[0]?.onStatisticField
    const statisticType = queries?.outStatistics?.[0]?.statisticType
    const outStatisticFieldName = getSplitOutStatisticName(onStatisticField, statisticType, splitByValue)
    const outStatistics = [{
      ...queries?.outStatistics?.[0],
      outStatisticFieldName
    }]
    const { groupByFieldsForStatistics, orderByFields, pageSize } = queries
    const query = { where, groupByFieldsForStatistics, outStatistics, orderByFields, num: pageSize }
    return serie.set('query', query).set('y', outStatisticFieldName)
  }
}

const normalizeSeries = (series: ImmutableArray<WebChartSeries>, query: ImmutableObject<FeatureLayerQueryParams>) => {
  let callback = null
  const type = getSeriesType(series as any)
  const useSplitBy = !!query?.where && !!series?.some(s => !!s?.query?.where)
  if (useSplitBy) {
    callback = getSingleQueryForSplitBy
  } else {
    if (isSerialSeries(type) || type === 'pieSeries') {
      const outFields = query?.outFields
      if (outFields?.length) { //no aggregation
        callback = getSingleQueryForNoAggregation
      } else {
        const categoryType = getCategoryType(query)
        if (categoryType === CategoryType.ByGroup) {
          callback = getSingleQueryForByGroup
        }
      }
    } else if (type === 'gaugeSeries') {
      callback = getSingleQueryForGauge
    }
  }
  if (callback) {
    return series?.map((serie) => callback(serie, query))
  }
  return series
}

export default normalizeSeries
