import { React, type ImmutableObject, type UseDataSource, type IMState, ReactRedux, DataSourceStatus, type DataRecord, type WidgetInitDragCallback } from 'jimu-core'
import { type ChartElementLimit, getSeriesType } from 'jimu-ui/advanced/chart'
import { type ChartComponentProps, type ChartTools, type IWebChart, type TemplateType } from '../../../config'
import Tools from '../tools'
import WithInlineDataChart from './with-inline-data'
import { ChartRoot, isWebChartValid, useWarningMessage } from '../components'
import { useChartRuntimeState } from '../../state'
import { getTemplateType } from '../../../utils/common'

interface WebInlineDataChartPorps {
  className?: string
  widgetId: string
  webChart: ImmutableObject<IWebChart>
  tools: ImmutableObject<ChartTools>
  options?: ChartComponentProps
  enableDataAction: boolean
  chartLimits?: Partial<ChartElementLimit>
  useDataSource: ImmutableObject<UseDataSource>
  defaultTemplateType: TemplateType
  onInitDragHandler: WidgetInitDragCallback
}

const useChartRendered = (dataSourceId: string, webChart: ImmutableObject<IWebChart>, records: DataRecord[]) => {
  const status = ReactRedux.useSelector((state: IMState) => state.dataSourcesInfo?.[dataSourceId]?.status)
  const valid = React.useMemo(() => isWebChartValid(webChart), [webChart])
  const render = (status && status !== DataSourceStatus.NotReady) && valid && !!records?.length
  return { valid, render }
}

const WebInlineDataChart = (props: WebInlineDataChartPorps) => {
  const {
    widgetId,
    tools: propTools,
    options,
    enableDataAction = true,
    webChart,
    chartLimits,
    useDataSource,
    defaultTemplateType,
    onInitDragHandler
  } = props

  const { recordsStatus, records } = useChartRuntimeState()
  const type = getSeriesType(webChart?.series as any)
  const showTools = propTools?.cursorEnable || !!propTools?.filter || enableDataAction
  const { valid, render } = useChartRendered(
    useDataSource?.dataSourceId,
    webChart,
    records
  )

  const templateType =
    getTemplateType(webChart)?.[1] || defaultTemplateType || 'column'
  const [messageType, message] = useWarningMessage(
    type,
    valid,
    useDataSource,
    recordsStatus,
    webChart?.series?.length ?? 0
  )

  const tools = showTools
    ? (
    <Tools
      type={type}
      tools={propTools}
      widgetId={widgetId}
      enableDataAction={enableDataAction}
    />
      )
    : null

  return (
    <ChartRoot
      templateType={templateType}
      messageType={messageType}
      message={message}
      showLoading={recordsStatus === 'loading'}
      background={webChart?.background}
      className='web-inlie-data-chart'
      showPlaceholder={!render}
      tools={tools}
    >
      <WithInlineDataChart
        className='web-chart'
        options={options}
        widgetId={widgetId}
        webChart={webChart}
        chartLimits={chartLimits}
        onInitDragHandler={onInitDragHandler}
      />
    </ChartRoot>
  )
}

export default WebInlineDataChart
