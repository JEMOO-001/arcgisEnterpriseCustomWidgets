import { React, DataSourceComponent, Immutable, type ImmutableObject, type UseDataSource, DataSourceStatus, type FeatureLayerDataSource, type SceneLayerDataSource, DataSourceManager, dataSourceUtils, hooks, getAppStore, lodash, type IMDataSourceSchema, type DataSource } from 'jimu-core'
import { useChartRuntimeDispatch, useChartRuntimeState } from '../../state'
import { type IWebChart } from '../../../config'
import { getSeriesType } from 'jimu-ui/advanced/chart'
import { getDataSourceSchema } from '../../../utils/common'
import { useMemoizedQuery, isDataSourceValid, updateDataSourceJson } from './utils'

interface OutputSourceManagerProps {
  widgetId: string
  originalDataSourceId: string
  dataSourceId: string
  webChart: ImmutableObject<IWebChart>
  onCreated?: (dataSource: DataSource) => void
  onSchemaChange?: (schema: IMDataSourceSchema) => void
}

const OutputSourceManager = (props: OutputSourceManagerProps) => {
  const {
    widgetId,
    dataSourceId,
    webChart,
    onCreated,
    onSchemaChange
  } = props

  const { current: isInBuilder } = React.useRef(getAppStore().getState().appContext.isInBuilder)
  const { dataSource, outputDataSource, records } = useChartRuntimeState()
  const query = useMemoizedQuery(webChart?.dataSource?.query)

  const seriesRef = hooks.useLatest(webChart?.series)

  hooks.useUpdateEffect(() => {
    if (dataSource && outputDataSource && query && !query.where) { //Update schema for non-split-by
      const outputDataSourceId = outputDataSource.id
      const originalDataSourceId = dataSource.id
      const seriesType = getSeriesType(seriesRef.current as any)
      const schema = getDataSourceSchema(outputDataSource, originalDataSourceId, query, seriesType)
      let dsJson = getAppStore().getState()?.appConfig.dataSources?.[outputDataSourceId]
      if (!dsJson) {
        console.error(`The output data source of ${outputDataSourceId} does not exist`)
        return null
      }
      if (lodash.isDeepEqual(schema, dsJson.schema.asMutable({ deep: true }))) return
      dsJson = dsJson.set('schema', schema)
      updateDataSourceJson(outputDataSourceId, dsJson)
    }
  }, [dataSource, outputDataSource, query])

  const dispatch = useChartRuntimeDispatch()

  React.useEffect(() => {
    if (!isDataSourceValid(outputDataSource) || !records) return
    outputDataSource.setSourceRecords(records)
    if (outputDataSource.getStatus() !== DataSourceStatus.Unloaded) {
      outputDataSource.setStatus(DataSourceStatus.Unloaded)
      outputDataSource.setCountStatus(DataSourceStatus.Unloaded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputDataSource, records])

  const useDataSource: ImmutableObject<UseDataSource> = React.useMemo(() => {
    if (dataSourceId) {
      return Immutable({
        dataSourceId: dataSourceId,
        mainDataSourceId: dataSourceId
      })
    }
  }, [dataSourceId])

  const handleCreated = (outputDataSource: FeatureLayerDataSource | SceneLayerDataSource) => {
    syncOriginDsInfo(outputDataSource)
    dispatch({ type: 'SET_OUTPUT_DATA_SOURCE', value: outputDataSource })
    onCreated?.(outputDataSource)
  }

  const handleSchemaChange = (schema: IMDataSourceSchema) => {
    if (!outputDataSource) return
    onSchemaChange?.(schema)
    syncOriginDsInfo(outputDataSource as FeatureLayerDataSource)
    if (!isInBuilder) return
    //Only in the builder, when the schema changes, the status of the output data source is set to not ready.
    if (outputDataSource.getStatus() !== DataSourceStatus.NotReady) {
      outputDataSource.setStatus(DataSourceStatus.NotReady)
      outputDataSource.setCountStatus(DataSourceStatus.NotReady)
    }
  }

  const syncOriginDsInfo = (outputDataSource: FeatureLayerDataSource | SceneLayerDataSource) => {
    const originDs = DataSourceManager.getInstance().getDataSource(outputDataSource?.getDataSourceJson()?.originDataSources?.[0]?.dataSourceId) as FeatureLayerDataSource | SceneLayerDataSource
    if (!outputDataSource || !originDs) {
      console.error('Failed to sync origin data source info to chart output data source.')
      return
    }
    outputDataSource.setLayerDefinition({ ...dataSourceUtils.getLayerDefinitionIntersection(originDs.getLayerDefinition(), outputDataSource), timeInfo: null })
  }

  return <DataSourceComponent
    widgetId={widgetId}
    useDataSource={useDataSource}
    onDataSourceCreated={handleCreated}
    onDataSourceSchemaChange={handleSchemaChange}
  />
}

export default OutputSourceManager
