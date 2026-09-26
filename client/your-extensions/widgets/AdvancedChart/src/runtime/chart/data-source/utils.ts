import { React, type QueriableDataSource, type DataRecord, type DataSource, type IMFeatureLayerQueryParams, type ImmutableArray, DataSourceStatus, Immutable, getAppStore, type DataSourceJson, appActions, type ImmutableObject } from 'jimu-core'
import { type ChartElementLimit, getSeriesType, type WebChartDataItem, WebChartSortOrderKinds } from 'jimu-ui/advanced/chart'
import { ByFieldSeriesX, ByFieldSeriesY } from '../../../constants'
import { getFieldUniqueValuesParams, parseOrderByField, getFieldSchema } from '../../../utils/common'
import { isSerialSeries } from '../../../utils/default'

export const getSourceRecords = (records: DataRecord[], dataSource: DataSource, inputCategoryField?: string) => {
  const idField = dataSource.getIdField()
  const categoryField = inputCategoryField || ByFieldSeriesX
  // Filter out data with empty grouping field
  const filteredRecords = records?.filter(record => record?.getData()?.[categoryField] != null)
  const rs = filteredRecords?.map((record, i) => {
    if (dataSource && record.dataSource !== dataSource) {
      const attributes = record.getData()
      // If `idField` used as the category field, use its original value
      const objectid = categoryField === idField ? (attributes[idField] ?? i) : i
      const feature = { attributes: { ...attributes, [idField]: objectid } }
      return dataSource.buildRecord(feature)
    } else {
      return record
    }
  })?.filter(record => !!record)

  return rs
}

/**
 * Get the limited records count.
 * @param series
 */
export const getInlineRecordslimited = (series, chartLimits: Partial<ChartElementLimit>) => {
  let recordsLimited = 1000
  const seriesLength = series?.length

  if (!seriesLength) return recordsLimited

  const type = getSeriesType(series)
  if (isSerialSeries(type)) {
    if (seriesLength === 1) {
      recordsLimited = chartLimits.maxBarUniqueSeriesCountTotal
    } else if (seriesLength === 2) {
      recordsLimited = chartLimits.maxBarTwoSeriesCountPerSeries
    } else if (seriesLength > 2) {
      recordsLimited = chartLimits.maxBarThreePlusSeriesCountPerSeries
    }
  } else if (type === 'pieSeries') {
    recordsLimited = chartLimits.maxPieChartSliceCountTotal
  }

  return recordsLimited
}

/**
 * Convert to formatted data for `by-field` mode.
 * In order for the series to know which data is to used in the global chart array (through valueY), need to convert the data,
 * transforming data into web chart data for `ByField` mode.
 *
 * In case of non-aggregated type bar chart, we rename the category names by adding a suffix, in order
 * to avoid multiple identical values (they are switched back to their original value when displayed).
 */
export const convertByFieldRecords = (inputRecords: DataRecord[], query: IMFeatureLayerQueryParams, dataSource: DataSource) => {
  const inputRecord = inputRecords?.[0]
  if (!inputRecord || !query?.outStatistics?.length) return

  const orderByFields = query.orderByFields
  const outStatistics = query.outStatistics
  const numericFields = outStatistics
    ?.map((statics) => statics.onStatisticField)
    ?.filter((field) => !!field)?.asMutable()

  const x = ByFieldSeriesX
  const y = ByFieldSeriesY

  const data =
    numericFields?.map((field) => {
      const value = inputRecord.getFieldValue(field)
      const item = {
        [x]: field,
        [y]: value ?? 0
      }
      const alias = getFieldSchema(field, dataSource.id)?.alias ?? field
      if (alias !== field) {
        item[x] = alias
        item[x + '_original'] = field
      }

      return item
    }) ?? []

  sortWebChartData(data, orderByFields)
  const records = data?.map((item, i) => {
    const feature = { attributes: item }
    return dataSource.buildRecord(feature)
  })
  return records
}

/**
 * Sorting an array WebChartDataItem following the orderByFields instructions.
 */
export function sortWebChartData (
  data: WebChartDataItem[],
  orderByFields: ImmutableArray<string>,
  forceAscendingOrder: boolean = false
): void {
  if (data == null || orderByFields == null) return
  data.sort(
    (dataItemA: WebChartDataItem, dataItemB: WebChartDataItem): number => {
      // Default sort decision = 0 (equal values)
      let sortDecision = 0

      // Using all the fields from orderByFields to proceed to the comparison
      for (let idx = 0; idx < orderByFields.length; idx += 1) {
        //`orderByField` must has `ASC` or `DESC` in it, e.g. 'field ASC', 'field name DESC'
        const [field, sortOrder] = parseOrderByField(orderByFields[idx])

        const descOrder: boolean =
          sortOrder === WebChartSortOrderKinds.Descending &&
          !forceAscendingOrder
        /**
         * We set the sortDecision only if one of the values is greater than the other one.
         * Otherwise it continues to the next value in the `orderByFields` array.
         */
        const firstEntry = dataItemA[field]
        const secondEntry = dataItemB[field]

        // In case of string values, we perform a natural sort using the native `localeCompare`
        if (typeof firstEntry === 'string' && typeof secondEntry === 'string') {
          sortDecision = firstEntry.localeCompare(secondEntry, undefined, {
            numeric: true
          })
          if (descOrder) sortDecision *= -1
        } else if (firstEntry === undefined || firstEntry === null) {
          sortDecision = !descOrder ? 1 : -1
        } else if (secondEntry === undefined || secondEntry === null) {
          sortDecision = !descOrder ? -1 : 1
        } else if (firstEntry > secondEntry) {
          sortDecision = !descOrder ? 1 : -1
          break
        } else if (firstEntry < secondEntry) {
          sortDecision = !descOrder ? -1 : 1
          break
        }
      }

      return sortDecision
    }
  )
}

/**
 * Check whether a data source instance is valid (whether the corresponding data source is deleted)
 * @param dataSource
 */
export const isDataSourceValid = (dataSource: DataSource): boolean => {
  if (!dataSource) return false
  const info = dataSource.getInfo()
  return info && Object.keys(info).length > 0
}

/**
 * Check whether a data source instance can be used to load data
 * @param dataSource
 */
export const isDataSourceReady = (dataSource: DataSource): boolean => {
  if (!isDataSourceValid(dataSource)) return false
  const status = dataSource.getStatus()
  //The dats source is ready to use
  return status && status !== DataSourceStatus.NotReady
}

export const queryFieldUniqueValues = async (dataSource: QueriableDataSource, field: string): Promise<Array<number | string>> => {
  const params = getFieldUniqueValuesParams(field, 101)
  const result = await dataSource.query(params)
  const values: Array<number | string> = result.records
    .map((record): string | number => record.getFieldValue(field))
    .filter((value) => value !== undefined)
  return values
}

const DefaultQuery = Immutable({}) as IMFeatureLayerQueryParams
export const useMemoizedQuery = (inputQuery: IMFeatureLayerQueryParams = DefaultQuery) => {
  const { groupByFieldsForStatistics, outFields, outStatistics, where } = inputQuery
  const query = React.useMemo(() => {
    let query: IMFeatureLayerQueryParams = Immutable({})
    if (where) {
      query = query.set('where', where)
    }
    if (groupByFieldsForStatistics) {
      query = query.set('groupByFieldsForStatistics', groupByFieldsForStatistics)
    }
    if (outFields) {
      query = query.set('outFields', outFields)
    }
    if (outStatistics) {
      query = query.set('outStatistics', outStatistics)
    }
    return Object.keys(query).length > 0 ? query : null
  }, [groupByFieldsForStatistics, outFields, outStatistics, where])
  return query
}

export const updateDataSourceJson = (dsId: string, dsJson: ImmutableObject<DataSourceJson>) => {
  const oldAppConfig = getAppStore().getState().appConfig
  const appConfig = oldAppConfig.setIn(['dataSources', dsId], dsJson)
  getAppStore().dispatch(appActions.appConfigChanged(appConfig))
}
