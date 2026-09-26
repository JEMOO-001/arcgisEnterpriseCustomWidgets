import { React, type IMFeatureLayerQueryParams, type ImmutableArray, type ImmutableObject, type UseDataSource } from 'jimu-core'
import { type ChartTypes } from 'jimu-ui/advanced/chart'
import { isSerialSeries } from '../../../../utils/default'
import { type ChartSettingSection } from '../type'
import { type ChartComponentProps, type IWebChart } from '../../../../config'
import SerialSetting from './serial'
import PieSetting from './pie'
import ScatterPlotSetting from './scatter'
import HistogramSetting from './histogram'
import GaugeSetting from './gauge'

interface WebChartSettingProps {
  type: ChartTypes
  section: ChartSettingSection
  webChart: ImmutableObject<IWebChart>
  options: ImmutableObject<ChartComponentProps>
  useDataSources: ImmutableArray<UseDataSource>
  onOptionsChange: (options: ImmutableObject<ChartComponentProps>) => void
  onSectionChange: (section: ChartSettingSection) => void
  onWebChartChange: (
    webChart: ImmutableObject<IWebChart>,
    query?: IMFeatureLayerQueryParams
  ) => void
}

const WebChartSetting = (props: WebChartSettingProps) => {
  const {
    type,
    section,
    webChart,
    options,
    onSectionChange,
    useDataSources,
    onWebChartChange,
    onOptionsChange
  } = props

  return (
    <>
      {isSerialSeries(type) && (
        <SerialSetting
          type={type}
          section={section}
          options={options}
          webChart={webChart}
          onSectionChange={onSectionChange}
          useDataSources={useDataSources}
          onWebChartChange={onWebChartChange}
          onOptionsChange={onOptionsChange}
        />
      )}
      {type === 'pieSeries' && (
        <PieSetting
          type={type}
          section={section}
          webChart={webChart}
          onSectionChange={onSectionChange}
          useDataSources={useDataSources}
          onWebChartChange={onWebChartChange}
        />
      )}
      {type === 'scatterSeries' && (
        <ScatterPlotSetting
          section={section}
          webChart={webChart}
          onSectionChange={onSectionChange}
          useDataSources={useDataSources}
          onWebChartChange={onWebChartChange}
        />
      )}
      {type === 'histogramSeries' && (
        <HistogramSetting
          section={section}
          webChart={webChart}
          onSectionChange={onSectionChange}
          useDataSources={useDataSources}
          onWebChartChange={onWebChartChange}
        />
      )}
      {type === 'gaugeSeries' && (
        <GaugeSetting
          section={section}
          webChart={webChart}
          onSectionChange={onSectionChange}
          useDataSources={useDataSources}
          onWebChartChange={onWebChartChange}
        />
      )}
    </>
  )
}

export default WebChartSetting
