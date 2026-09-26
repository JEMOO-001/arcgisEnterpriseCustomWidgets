import { React, type ImmutableObject, type UseDataSource, DataSourceStatus } from 'jimu-core'
import { type ChartElementLimit, getSeriesType } from 'jimu-ui/advanced/chart'
import { CategoryType, type IWebChart } from '../../../config'
import { ChartLimits } from '../../../constants'
import { getCategoryType } from '../../../utils/common'
import { isSerialSeries } from '../../../utils/default'
import { useChartRuntimeDispatch, useChartRuntimeState } from '../../state'
import OriginDataSourceManager from './original'
import OutputSourceManager from './output'
import useFetchRecords from './use-fetch-records'
import { convertByFieldRecords, getInlineRecordslimited, isDataSourceValid } from './utils'

interface InlineDataSourceManagerProps {
  widgetId: string
  webChart: ImmutableObject<IWebChart>
  outputDataSourceId: string
  useDataSource: ImmutableObject<UseDataSource>
  chartLimits?: Partial<ChartElementLimit>
}

const InlineDataSourceManager = (props: InlineDataSourceManagerProps) => {
  const {
    widgetId,
    webChart,
    outputDataSourceId,
    useDataSource,
    chartLimits = ChartLimits
  } = props

  const type = getSeriesType(webChart?.series as any)
  const query = webChart?.dataSource?.query
  const recordsLimited = getInlineRecordslimited(webChart?.series, chartLimits)

  const dispatch = useChartRuntimeDispatch()
  const { queryVersion, outputDataSource } = useChartRuntimeState()

  const categoryType = getCategoryType(query)
  const callback = React.useMemo(() => {
    if (categoryType !== CategoryType.ByField || (!isSerialSeries(type) && type !== 'pieSeries')) return null
    return convertByFieldRecords
  }, [categoryType, type])

  useFetchRecords(type, query, queryVersion, recordsLimited, callback)

  const handleDataSourceStatusChange = (status: DataSourceStatus, preStatus?: DataSourceStatus) => {
    if (isDataSourceValid(outputDataSource)) {
      if (status === DataSourceStatus.NotReady && status !== preStatus) {
        outputDataSource.setStatus(DataSourceStatus.NotReady)
        outputDataSource.setCountStatus(DataSourceStatus.NotReady)
        dispatch({ type: 'SET_RECORDS', value: undefined })
        dispatch({ type: 'SET_RECORDS_STATUS', value: 'none' })
      }
      if (status === DataSourceStatus.Unloaded && preStatus === DataSourceStatus.NotReady) {
        dispatch({ type: 'SET_QUERY_VERSION', value: queryVersion + 1 })
      }
    }
  }

  return (
    <>
      <OriginDataSourceManager
        widgetId={widgetId}
        useDataSource={useDataSource}
        onDataSourceStatusChange={handleDataSourceStatusChange}
      />
      <OutputSourceManager
        webChart={webChart}
        widgetId={widgetId}
        dataSourceId={outputDataSourceId}
        originalDataSourceId={useDataSource?.dataSourceId} />
    </>
  )
}

export default InlineDataSourceManager
