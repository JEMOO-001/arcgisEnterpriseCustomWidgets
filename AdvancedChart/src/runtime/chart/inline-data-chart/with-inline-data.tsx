import { React, type ImmutableObject, useIntl, hooks, type WidgetInitDragCallback } from 'jimu-core'
import {
  type ChartElementLimit,
  type WebMapWebChart,
  type UnprivilegedChart,
  type PreRenderCallback,
  type WebChartPieChartSeries,
  type WebChart,
  getSeriesType
} from 'jimu-ui/advanced/chart'
import { useChartRuntimeDispatch, useChartRuntimeState } from '../../state'
import { CategoryType, type ChartComponentProps, type IWebChart } from '../../../config'
import convertRecordsToInlineData from './convert-utils'
import { defaultMessages as jimuUiMessages } from 'jimu-ui'
import defaultMessages from '../../translations/default'
import { normalizePieSlices, normalizeSeriesName } from './utils'
import { ChartComponents } from '../components'
import { useSelection } from '../utils'
import { ObjectIdField, WebChartCurrentVersion } from '../../../constants'
import { getCategoryField, getCategoryType } from '../../../utils/common'

interface WithInlineDataChartProps {
  className?: string
  widgetId: string
  options?: ChartComponentProps
  webChart: ImmutableObject<IWebChart>
  chartLimits?: Partial<ChartElementLimit>
  onInitDragHandler: WidgetInitDragCallback
}

const background = [0, 0, 0, 0] as any

function WithInlineDataChart (
  props: WithInlineDataChartProps
): React.ReactElement {
  const { className, widgetId, webChart: propWebChart, options, chartLimits, onInitDragHandler } = props
  const { outputDataSource, dataSource, records, recordsStatus } = useChartRuntimeState()
  const dispatch = useChartRuntimeDispatch()

  const chartRef = React.useRef<UnprivilegedChart>(null)
  const id = widgetId + '-' + (propWebChart?.id ?? 'chart')
  const intl = useIntl()
  const translate = hooks.useTranslation(defaultMessages, jimuUiMessages)
  const webMapWebChartRef = React.useRef<ImmutableObject<WebMapWebChart>>(null)
  let webChart = React.useMemo(() => propWebChart.set('version', WebChartCurrentVersion).without('dataSource').set('id', id).set('background', background) as unknown as ImmutableObject<WebMapWebChart>, [id, propWebChart])

  const type = getSeriesType(propWebChart.series as any)
  const query = propWebChart?.dataSource?.query
  const categoryType = getCategoryType(query)
  const categoryField = getCategoryField(query)

  const numberFields = React.useMemo(() => {
    if (categoryType === CategoryType.ByField) {
      return []
    }
    const schemaFields = outputDataSource ? Object.keys(outputDataSource.getSchema().fields) : []
    if (schemaFields.length) {
      return schemaFields.filter((field) => field !== categoryField && field !== ObjectIdField)
    }
  }, [categoryType, outputDataSource, categoryField])

  const [inlineData, dataItems] = React.useMemo(() => convertChartDataToRecords(type, records, query, propWebChart?.series, intl), [type, records, query, propWebChart?.series, intl])

  let propSeries = React.useMemo(() => getDataItemsWithMixedValue(propWebChart?.series, query, dataItems), [dataItems, query, propWebChart?.series])
  propSeries = React.useMemo(() => setSeriesName(propSeries, query, translate), [propSeries, query, translate])
  webChart = React.useMemo(() => webChart.set('series', propSeries), [webChart, propSeries])

  const chartReadyWebChart = React.useMemo(() => {
    if (recordsStatus !== 'loaded') {
      return webMapWebChartRef.current
    } else {
      webMapWebChartRef.current = webChart
      return webChart
    }
  }, [recordsStatus, webChart])

  const hanldleCreated = React.useCallback(
    (chart: UnprivilegedChart) => {
      chartRef.current = chart
      dispatch({ type: 'SET_CHART', value: chart })
    },
    [dispatch]
  )

  const [selectionData, handleSelectionChange] = useSelection(
    widgetId,
    outputDataSource,
    propSeries,
    numberFields,
    categoryField,
    dataSource,
    categoryField,
    options?.autoZoomToParcel ?? true,
    options?.openSelectionPopup ?? true
  )

  const chartWillRender: PreRenderCallback = React.useCallback(async (props) => {
    const { chartConfig, slices: usedSlices } = props
    let slices = (chartConfig?.series?.[0] as WebChartPieChartSeries)?.slices
    let alteredConfig: WebChart = chartConfig as WebChart
    if (slices?.length) {
      slices = slices.map((slice) => {
        const id = slice.sliceId
        const usedSliceId = usedSlices?.find((usedSlice) => usedSlice.originalLabel === id)?.sliceId
        if (usedSliceId) {
          return {
            ...slice,
            sliceId: usedSliceId
          }
        }
        return slice
      })
      alteredConfig = {
        ...chartConfig,
        series: [{
          ...chartConfig.series[0],
          slices
        }] as WebChartPieChartSeries[]
      } as WebChart
    }
    return alteredConfig
  }, [])

  hooks.useEffectOnce(() => {
    onInitDragHandler?.(null, null, () => {
      if (!chartRef.current) return
      chartRef.current.refresh()
    })
  })

  return (
    <>
      {webMapWebChart && <ChartComponents
        ref={hanldleCreated}
        className={className}
        {...options}
        webMapWebChart={webMapWebChart}
        inlineData={inlineData}
        chartWillRender={chartWillRender}
        hideLoaderAnimation={true}
        chartLimits={chartLimits}
        selectionData={selectionData}
        arcgisChartsSelectionComplete={handleSelectionChange}
      />}
    </>
  )
}

export default WithInlineDataChart
