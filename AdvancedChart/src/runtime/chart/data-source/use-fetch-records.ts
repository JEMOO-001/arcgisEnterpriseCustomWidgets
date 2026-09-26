import { React, type QueriableDataSource, type IMFeatureLayerQueryParams, type DataRecord } from 'jimu-core'
import { type ChartTypes } from 'jimu-ui/advanced/chart'
import { getCategoryField, isValidQuery } from '../../../utils/common'
import { useChartRuntimeDispatch, useChartRuntimeState } from '../../state'
import { getSourceRecords, isDataSourceReady } from './utils'

const getDataSourceQuery = (
  type: ChartTypes,
  query: IMFeatureLayerQueryParams
) => {
  if (!isValidQuery(type, query)) return null
  // Remove `orderByField` for `by-field` mode of `serial` and `pie` chart
  if (query.outStatistics?.length && !query.groupByFieldsForStatistics) {
    return query.without('orderByFields')
  }
  return query
}

const useFetchRecords = (
  type: ChartTypes,
  query: IMFeatureLayerQueryParams,
  version: number,
  recordsLimited: number,
  callback?: (records: DataRecord[], query, dataSource) => DataRecord[]
) => {
  const { dataSource, outputDataSource } = useChartRuntimeState()
  const dispatch = useChartRuntimeDispatch()
  const categoryField = getCategoryField(query)
  const params = React.useMemo(() => getDataSourceQuery(type, query), [query, type])

  React.useEffect(() => {
    if (!isDataSourceReady(dataSource) || !outputDataSource || params == null) {
      return
    }
    dispatch({ type: 'SET_RECORDS_STATUS', value: 'loading' })
    ;(dataSource as QueriableDataSource).query(params).then(
      (result) => {
        let records = result.records
        if (callback) records = callback(records, query, dataSource) ?? []
        records = getSourceRecords(records, outputDataSource, categoryField)

        if (records.length > recordsLimited) {
          dispatch({ type: 'SET_RECORDS', value: undefined })
          dispatch({ type: 'SET_RECORDS_STATUS', value: 'exceed' })
          return
        }
        if (records.length === 0) {
          dispatch({ type: 'SET_RECORDS_STATUS', value: 'empty' })
          dispatch({ type: 'SET_RECORDS', value: records })
          return
        }

        dispatch({ type: 'SET_RECORDS_STATUS', value: 'loaded' })
        dispatch({ type: 'SET_RECORDS', value: records })
      },
      (error) => {
        console.error(error)
        dispatch({ type: 'SET_RECORDS', value: undefined })
        dispatch({ type: 'SET_RECORDS_STATUS', value: 'error' })
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, outputDataSource, params, version])
}

export default useFetchRecords
