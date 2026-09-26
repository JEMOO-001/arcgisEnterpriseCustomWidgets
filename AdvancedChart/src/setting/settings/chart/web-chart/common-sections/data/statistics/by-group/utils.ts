import { type IMFeatureLayerQueryParams, Immutable, type ImmutableArray, DataSourceManager, type FeatureLayerDataSource, CONSTANTS, type DataSource, type ImmutableObject, type FeatureLayerQueryParams } from 'jimu-core'
import { whetherUseIdFieldForNonCount } from '../../../../../../../../utils/common'
import { ArcgisChartsSecretKeys, type SelectedOption, parseOrderByField } from '../../../../../../../../utils/common'
import { type WebChartSeries } from '../../../../../../../../config'
import { type WebChartTimeIntervalUnits, getSeriesType } from 'jimu-ui/advanced/chart'
import { UnitSelectorDateWeekUnits, UnitSelectorTimeUnits } from 'jimu-ui/advanced/style-setting-components'
import { DateTimeUnitsMap } from '../../../../components'

export const getByGroupOrderFields = (query: IMFeatureLayerQueryParams, translate): ImmutableArray<SelectedOption> => {
  let fields: ImmutableArray<SelectedOption> = Immutable([])
  if (!query) return fields

  const categoryField = query.groupByFieldsForStatistics?.[0]
  const outFields = query.outFields
  const outStatistics = query.outStatistics
  const isSplitBy = query.where?.includes('=')
  let valueField = outFields?.[0] || outStatistics?.[0]?.outStatisticFieldName
  if (isSplitBy && outStatistics?.length) {
    valueField = ArcgisChartsSecretKeys.defaultOutStatisticFieldName
  }
  if (!categoryField && !valueField) return fields

  const xAxisLabel = translate('category')
  if (categoryField !== '') {
    fields = fields.concat([{
      name: xAxisLabel,
      value: categoryField
    }])
  }
  const yAxisLabel = translate('value')
  if (valueField !== '') {
    fields = fields.concat([{
      name: yAxisLabel,
      value: valueField
    }])
  }
  return fields
}

export const getParsedOrderByField = (orderByField: string, orderFields: ImmutableArray<SelectedOption>): string => {
  if (!orderByField) return
  let [field, order] = parseOrderByField(orderByField)
  if (!field) return
  const orderField = orderFields.find((orderField) => orderField.value === field)
  if (!orderField) {
    field = orderFields[1].value
  }
  return `${field} ${order}`
}

const getClosestDistance = (a, b, c) => {
  const distanceToA = Math.abs(c - a)
  const distanceToB = Math.abs(c - b)

  if (distanceToA < distanceToB) {
    return distanceToA
  } else {
    return distanceToB
  }
}

/**
 * Get appropriate time unit for time binning.
 */
export const getAppropriateTimeUnit = (startTime: number, endTime: number, minPeriod = 3, maxPeriod = 50): WebChartTimeIntervalUnits => {
  const units = [...UnitSelectorDateWeekUnits, ...UnitSelectorTimeUnits]
  const valuesInSeconds = [31536000, 2592000, 604800, 86400, 3600, 60, 1]

  const durationInSeconds = (endTime - startTime) / 1000

  const candidates = []

  for (let i = 0; i < units.length; i++) {
    const count = Math.floor(durationInSeconds / valuesInSeconds[i])
    candidates.push({
      unit: units[i],
      count: count
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      unit: 'second',
      count: Math.floor(durationInSeconds)
    })
  }

  candidates.sort((c1, c2) => getClosestDistance(minPeriod, maxPeriod, c1.count) - getClosestDistance(minPeriod, maxPeriod, c2.count))

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    if (candidate.count >= minPeriod && candidate.count <= maxPeriod) {
      return DateTimeUnitsMap[candidate.unit] as WebChartTimeIntervalUnits
    }
  }

  return DateTimeUnitsMap[candidates[0].unit] as WebChartTimeIntervalUnits
}

export const fetchFieldRange = async (field: string, dataSourceId: string): Promise<[number, number, number]> => {
  return new Promise((resolve, reject) => {
    const dataSource = DataSourceManager.getInstance().getDataSource(
      dataSourceId
    ) as FeatureLayerDataSource
    if (!dataSource || !field) reject('No required field or dataSource')
    const idField = dataSource.getIdField()
    const query = {
      outStatistics: [
        {
          onStatisticField: field,
          outStatisticFieldName: 'MIN',
          statisticType: 'min'
        },
        {
          onStatisticField: field,
          outStatisticFieldName: 'MAX',
          statisticType: 'max'
        },
        {
          onStatisticField: idField,
          outStatisticFieldName: 'COUNT',
          statisticType: 'count'
        }
      ] as any,
      returnGeometry: false
    }
    dataSource.query(query).then((res) => {
      const attributes = res?.records?.[0].getData()
      const MIN = attributes?.MIN
      const MAX = attributes?.MAX
      const COUNT = attributes?.COUNT
      resolve([MIN, MAX, COUNT])
    }).catch((error) => {
      reject(error)
    })
  })
}

const isDataSourceSupportSplitBy = (dataSource: DataSource) => {
  if (!dataSource) return false
  const isOutput = dataSource.getDataSourceJson().isOutputFromWidget
  const isSelectDs = dataSource.dataViewId === CONSTANTS.SELECTION_DATA_VIEW_ID
  return !isOutput && !isSelectDs
}

export const isSupportSplitBy = (dataSourceId: string, query: ImmutableObject<FeatureLayerQueryParams>, series: ImmutableArray<WebChartSeries>) => {
  const dataSource = DataSourceManager.getInstance().getDataSource(dataSourceId)
  const dsSupported = isDataSourceSupportSplitBy(dataSource)
  const useIdFieldForNonCount = whetherUseIdFieldForNonCount(query, series, dataSource)
  const seriesType = getSeriesType(series as any)
  return dsSupported && !useIdFieldForNonCount && seriesType !== 'pieSeries'
}
