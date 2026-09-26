import { type ImmutableObject, React, type UseDataSource, type WidgetInitDragCallback } from 'jimu-core'
import { InlineDataSourceManager } from './data-source'
import WebInlineDataChart from './inline-data-chart'
import WebFeatureLayerChart from './feature-layer-chart'
import { type ChartComponentProps, type ChartTools, type IWebChart, type TemplateType } from '../../config'
import { ChartLimits } from '../../constants'
import { useChartRuntimeState } from '../state'
import { whetherUseInlineDataSource } from '../../utils/common'

interface Props {
  className?: string
  widgetId: string
  webChart: ImmutableObject<IWebChart>
  tools: ImmutableObject<ChartTools>
  options?: ChartComponentProps
  enableDataAction: boolean
  outputDataSourceId: string
  useDataSource: ImmutableObject<UseDataSource>
  defaultTemplateType: TemplateType
  onInitDragHandler: WidgetInitDragCallback
}

const Chart = (props: Props): React.ReactElement => {
  const { outputDataSourceId, useDataSource, tools, options, webChart, widgetId, defaultTemplateType, enableDataAction, onInitDragHandler } = props

  const { dataSource } = useChartRuntimeState()
  const useInlineData = whetherUseInlineDataSource(webChart, dataSource)

  return (
    <>
      {useInlineData && (
        <>
          <InlineDataSourceManager
            widgetId={widgetId}
            webChart={webChart}
            outputDataSourceId={outputDataSourceId}
            useDataSource={useDataSource}
            chartLimits={ChartLimits}
          />
          <WebInlineDataChart
            widgetId={widgetId}
            tools={tools}
            options={options}
            webChart={webChart}
            chartLimits={ChartLimits}
            useDataSource={useDataSource}
            enableDataAction={enableDataAction}
            onInitDragHandler={onInitDragHandler}
            defaultTemplateType={defaultTemplateType}
          />
        </>
      )}
      {!useInlineData && (<WebFeatureLayerChart
        widgetId={widgetId}
        tools={tools}
        webChart={webChart}
        options={options}
        chartLimits={ChartLimits}
        useDataSource={useDataSource}
        outputDataSourceId={outputDataSourceId}
        enableDataAction={enableDataAction}
        onInitDragHandler={onInitDragHandler}
        defaultTemplateType={defaultTemplateType}
      />)}
    </>
  )
}
export default Chart
