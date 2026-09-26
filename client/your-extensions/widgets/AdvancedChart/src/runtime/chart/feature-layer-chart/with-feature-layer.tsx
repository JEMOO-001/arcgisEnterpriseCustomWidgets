import {
  React,
  ReactRedux,
  DataSourceStatus,
  DataSourceManager,
  type FeatureLayerDataSource,
  type IMState,
  type ImmutableObject,
  type UseDataSource,
  type DataSource,
  DataSourceTypes,
  type SceneLayerDataSource,
  type QueriableDataSource,
  type FeatureLayerQueryParams,
  dataSourceUtils,
  hooks,
  type WidgetInitDragCallback
} from 'jimu-core'
import { type ChartElementLimit, type UnprivilegedChart, type WebMapWebChart, getSeriesType, type WebChartDataFilters } from 'jimu-ui/advanced/chart'
import { useChartRuntimeDispatch, useChartRuntimeState } from '../../state'
import { useSelection, normalizeSeries, getMinSafeValue, getChartLimits, getDataItemsWithMixedValue, convertDataItemsFromUpperCase } from '../utils'
import { type ChartComponentProps, type IWebChart } from '../../../config'
import createRecordsFromChartData, { getDataItems } from './convert-chart-data-to-records'
import { ChartComponents } from '../components'
import { GaugeMaxValueField, GaugeMinValueField, WebChartCurrentVersion, ObjectIdField } from '../../../constants'
import normalizeAxes from '../utils/normalize-axes'
import { getCategoryField } from '../../../utils/common'
import { isFieldFilteredToSingleValue } from '../RechartContainer'

interface WithFeatureLayerChartProps {
  className?: string
  widgetId: string
  webChart: ImmutableObject<IWebChart>
  options?: ChartComponentProps
  useDataSource?: ImmutableObject<UseDataSource>
  schemaFields?: string[]
  chartLimits?: Partial<ChartElementLimit>
  onInitDragHandler: WidgetInitDragCallback
  onLayerStatusChange?: (status: 'loading' | 'loaded') => void
}

type SupportedLayer = __esri.FeatureLayer | __esri.ImageryLayer | __esri.OrientedImageryLayer

const useDataSourceFeatureLayer = (dataSourceId: string): SupportedLayer => {
  const cancelable = hooks.useCancelablePromiseMaker()
  const [layer, setLayer] = React.useState<SupportedLayer>(null)
  const sourceStatus = ReactRedux.useSelector(
    (state: IMState) => state.dataSourcesInfo?.[dataSourceId]?.instanceStatus
  )

  const mainDataSourceId = DataSourceManager.getInstance().getDataSource(dataSourceId)?.getMainDataSource().id ?? dataSourceId
  const mainSourceVersion = ReactRedux.useSelector((state: IMState) => state.dataSourcesInfo?.[mainDataSourceId]?.sourceVersion)
  const sourceVersion = ReactRedux.useSelector((state: IMState) => state.dataSourcesInfo?.[dataSourceId]?.sourceVersion)

  React.useEffect(() => {
    if (sourceStatus !== DataSourceStatus.Created) return
    let dataSource = DataSourceManager.getInstance().getDataSource(
      dataSourceId
    ) as FeatureLayerDataSource
    if (!dataSource) {
      console.error(`No data source founded for id: ${dataSourceId}`)
      return
    }
    if ((dataSource as DataSource).type === DataSourceTypes.SceneLayer || (dataSource as DataSource).type === DataSourceTypes.BuildingComponentSubLayer) {
      dataSource = (dataSource as unknown as SceneLayerDataSource).getAssociatedDataSource()
    }
    cancelable(dataSource.createJSAPILayerByDataSource()).then((layer: SupportedLayer) => {
      layer.definitionExpression = ''
      setLayer(layer)
    })
  }, [cancelable, dataSourceId, sourceStatus, mainSourceVersion, sourceVersion])

  return layer
}

const background = [0, 0, 0, 0] as any

function WithFeatureLayerChart (props: WithFeatureLayerChartProps): React.ReactElement {
  const {
    className,
    widgetId,
    webChart: propWebChart,
    useDataSource,
    schemaFields,
    chartLimits: defaultChartLimit,
    options,
    onInitDragHandler,
    onLayerStatusChange
  } = props

  const chartRef = React.useRef<UnprivilegedChart>(null)
  const type = getSeriesType(propWebChart?.series as any)
  const query = propWebChart?.dataSource?.query
  const categoryField = getCategoryField(query)
  const id = widgetId + '-' + (propWebChart?.id ?? 'chart')
  const dispatch = useChartRuntimeDispatch()
  const { outputDataSource, dataSource, queryVersion, records } = useChartRuntimeState()
  const dataSourceId = useDataSource?.dataSourceId
  const layer = useDataSourceFeatureLayer(dataSourceId)
  const [version, setVersion] = React.useState(0)
  const onLayerStatusChangeRef = hooks.useLatest(onLayerStatusChange)
  const recordsRef = hooks.useLatest(records)

  const numberFields = React.useMemo(() => {
    if (type === 'barSeries' || type === 'lineSeries' || type === 'pieSeries') {
      return schemaFields.filter((field) => field !== categoryField && field !== ObjectIdField)
    }
  }, [type, schemaFields, categoryField])

  const minimumRef = React.useRef<number>()
  const maximumRef = React.useRef<number>()

  const layerLoadedRef = React.useRef(false)
  React.useEffect(() => {
    if (!layerLoadedRef.current) {
      onLayerStatusChangeRef.current?.(layer ? 'loaded' : 'loading')
    }
    layerLoadedRef.current = !!layer
  }, [layer, onLayerStatusChangeRef])

  const queryParams: FeatureLayerQueryParams = React.useMemo(() => {
    const queryParams = (dataSource as QueriableDataSource)?.getCurrentQueryParams() ?? {}
    const pageSize = (dataSource as QueriableDataSource)?.getMaxRecordCount()
    queryParams.pageSize = pageSize
    return queryParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, queryVersion])

  const timeZone = React.useMemo(() => {
    let timeZone = (dataSource as FeatureLayerDataSource)?.getTimezone()
    if (timeZone) {
      timeZone = dataSourceUtils.getTimezoneAPIFromRuntime(timeZone)
    }
    return timeZone
  }, [dataSource])

  const { where, geometry, gdbVersion, time, distance, units, pageSize } = queryParams

  const num = getMinSafeValue(pageSize, propWebChart.dataSource?.query?.pageSize)
  const chartLimits = React.useMemo(() => getChartLimits(propWebChart?.series, defaultChartLimit, num), [defaultChartLimit, num, propWebChart?.series])

  const webMapWebChart = React.useMemo(
    () => {
      let query = propWebChart.dataSource?.query
      if (query) {
        query = query.set('pageSize', num)
      }
      const series = normalizeSeries(propWebChart.series, query)
      const axes = normalizeAxes(propWebChart.series, propWebChart.axes, query)
      return propWebChart.set('version', WebChartCurrentVersion).without('dataSource').set('series', series).set('axes', axes).set('id', id).set('background', background) as unknown as ImmutableObject<WebMapWebChart>
    }, [id, propWebChart, num]
  )

  const runtimeDataFilters = React.useMemo(() => {
    const runtimeDataFilters: WebChartDataFilters = {}
    if (where) {
      runtimeDataFilters.where = where
    }
    // Do not restrict chart query by the map's zoom geometry when zooming to a parcel or when filtered to an airport.
    // This preserves the full list of names for the selected airport respecting the configured number of displayed names.
    const shouldIgnoreGeometry = options?.autoZoomToParcel !== false || isFieldFilteredToSingleValue(where)
    if (geometry && !shouldIgnoreGeometry) {
      runtimeDataFilters.geometry = geometry as any
      if (distance && units) {
        runtimeDataFilters.distance = distance
        runtimeDataFilters.units = units as any
      }
    }
    return Object.keys(runtimeDataFilters).length ? runtimeDataFilters : undefined
  }, [where, geometry, distance, units, options?.autoZoomToParcel])

  hooks.useUpdateEffect(() => {
    if (!chartRef.current || !layer) return
    if (gdbVersion) {
      (layer as __esri.FeatureLayer).gdbVersion = gdbVersion
    }
    if (time) {
      (layer as __esri.FeatureLayer).timeExtent = dataSourceUtils.changeJimuTimeToJSAPITimeExtent(time)
    }
    setVersion((v) => v + 1)
  }, [layer, gdbVersion, time])

  hooks.useEffectOnce(() => {
    onInitDragHandler?.(null, null, () => {
      if (!chartRef.current) return
      chartRef.current.refresh(false, false)
    })
  })

  const hanldleCreated = React.useCallback(
    (chart: UnprivilegedChart) => {
      chartRef.current = chart
      dispatch({ type: 'SET_CHART', value: chart })
    },
    [dispatch]
  )

  const handleDataProcessComplete = hooks.useEventCallback((e) => {
    let dataItems = getDataItems(type, e.detail)
    dataItems = convertDataItemsFromUpperCase(dataItems, numberFields)
    const records = createRecordsFromChartData(dataItems, outputDataSource)
    minimumRef.current = undefined
    maximumRef.current = undefined
    dispatch({ type: 'SET_RECORDS', value: records })
  })

  const handleAxesMinMaxChange = hooks.useEventCallback((e) => {
    if (type !== 'gaugeSeries' || !recordsRef.current || !e.detail[0]) return

    const { minimum, maximum } = e.detail[0]
    if (minimum === minimumRef.current && maximum === maximumRef.current) return
    minimumRef.current = minimum
    maximumRef.current = maximum

    const mixedValue = { [GaugeMinValueField]: minimum, [GaugeMaxValueField]: maximum }
    let dataItems = recordsRef.current.map(record => record.getData())
    dataItems = getDataItemsWithMixedValue(dataItems, mixedValue)
    const records = createRecordsFromChartData(dataItems, outputDataSource)
    dispatch({ type: 'SET_RECORDS', value: records })
  })

  const handleDataProcessError = hooks.useEventCallback((e) => {
    dispatch({ type: 'SET_RECORDS', value: undefined })
    dispatch({ type: 'SET_RECORDS_STATUS', value: 'error' })
  })

  const [selectionData, handleSelectionChange] = useSelection(
    widgetId,
    outputDataSource,
    propWebChart.series,
    numberFields,
    undefined,
    dataSource,
    categoryField,
    options?.autoZoomToParcel ?? true,
    options?.openSelectionPopup ?? true
  )

  return (
    <>
      {layer && <ChartComponents
        className={className}
        timeZone={timeZone}
        version={version}
        {...options}
        runtimeDataFilters={runtimeDataFilters}
        webMapWebChart={webMapWebChart}
        layer={layer as __esri.FeatureLayer}
        chartLimits={chartLimits}
        ref={hanldleCreated}
        selectionData={selectionData}
        arcgisChartsSelectionComplete={handleSelectionChange}
        arcgisChartsDataProcessComplete={handleDataProcessComplete}
        arcgisChartsDataProcessError={handleDataProcessError}
        arcgisChartsAxesMinMaxChange={handleAxesMinMaxChange}
      />}
    </>
  )
}

export default WithFeatureLayerChart
