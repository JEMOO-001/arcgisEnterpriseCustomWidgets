import { React, type ImmutableObject, type UseDataSource, hooks, type QueriableDataSource, getAppStore, DataSourceStatus, lodash, type IMDataSourceSchema, type DataSource } from 'jimu-core'
import OriginDataSourceManager from './original'
import OutputSourceManager from './output'
import { type IWebChart } from '../../../config'
import { isDataSourceReady, isDataSourceValid, queryFieldUniqueValues, updateDataSourceJson, useMemoizedQuery } from './utils'
import { getSplitByField } from 'jimu-ui/advanced/chart'
import { useChartRuntimeDispatch, useChartRuntimeState } from '../../state'
import { getDataSourceSchemaForSplitBy } from '../../../utils/common'

interface FeatureLayerDataSourceManagerPorps {
  widgetId: string
  webChart: ImmutableObject<IWebChart>
  outputDataSourceId: string
  useDataSource: ImmutableObject<UseDataSource>
  onSplitValuesChange?: (values: { [field: string]: Array<string | number> }) => void
  onSchemaChange?: (schema: IMDataSourceSchema) => void
}

const FeatureLayerDataSourceManager = (props: FeatureLayerDataSourceManagerPorps) => {
  const {
    widgetId,
    useDataSource,
    outputDataSourceId,
    webChart,
    onSplitValuesChange,
    onSchemaChange
  } = props

  const dispatch = useChartRuntimeDispatch()
  const { queryVersion, dataSource, outputDataSource } = useChartRuntimeState()
  const [splitByValues, setSplitByValues] = React.useState<{ [field: string]: Array<string | number> }>()

  const dataSourceId = useDataSource?.dataSourceId
  const splitByField = getSplitByField(webChart?.dataSource?.query?.where, true)
  const seriesCount = webChart?.series?.length
  const seriesRef = hooks.useLatest(webChart?.series)
  const splitByFieldRef = hooks.useLatest(splitByField)
  const onSplitValuesChangeRef = hooks.useLatest(onSplitValuesChange)

  const query = useMemoizedQuery(webChart?.dataSource?.query)

  React.useEffect(() => {
    if (splitByField && isDataSourceReady(dataSource)) {
      queryFieldUniqueValues(dataSource as QueriableDataSource, splitByField).then((values) => {
        setSplitByValues({ [splitByField]: values })
      })
    }
  }, [dataSource, splitByField, queryVersion, onSplitValuesChangeRef])

  hooks.useUpdateEffect(() => {
    if (dataSource && outputDataSource && splitByValues?.[splitByFieldRef.current]) { //Update schema for split-by
      const dataSourceId = dataSource.id
      const outputDataSourceId = outputDataSource.id
      const schema = getDataSourceSchemaForSplitBy(outputDataSource, dataSourceId, query, seriesRef.current, splitByValues[splitByFieldRef.current])
      let dsJson = getAppStore().getState()?.appConfig.dataSources?.[outputDataSourceId]
      if (!dsJson) {
        console.error(`The output data source of ${dataSourceId} does not exist`)
        return null
      }
      if (lodash.isDeepEqual(schema, dsJson.schema.asMutable({ deep: true }))) return
      dsJson = dsJson.set('schema', schema)
      updateDataSourceJson(outputDataSourceId, dsJson)
      onSplitValuesChangeRef.current(splitByValues)
    }
  }, [dataSource, outputDataSource, splitByValues, query, seriesCount])

  const handleDataSourceStatusChange = (status: DataSourceStatus, preStatus?: DataSourceStatus) => {
    if (isDataSourceValid(outputDataSource)) {
      if (status === DataSourceStatus.NotReady && status !== preStatus) {
        outputDataSource.setStatus(DataSourceStatus.NotReady)
        outputDataSource.setCountStatus(DataSourceStatus.NotReady)
        dispatch({ type: 'SET_RECORDS', value: undefined })
        dispatch({ type: 'SET_RECORDS_STATUS', value: 'none' })
      }
    }
  }

  const handleOutDataSourceCreated = (dataSource: DataSource) => {
    const schema = dataSource.getSchema()
    onSchemaChange?.(schema)
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
        originalDataSourceId={dataSourceId}
        onCreated={handleOutDataSourceCreated}
        onSchemaChange={onSchemaChange}
      />
    </>
  )
}

export default FeatureLayerDataSourceManager
