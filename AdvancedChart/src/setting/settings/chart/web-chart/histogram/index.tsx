import {
  React,
  type ImmutableArray,
  type UseDataSource,
  type ImmutableObject,
  type IMFeatureLayerQueryParams,
  hooks
} from 'jimu-core'
import {
  SettingSection,
  SettingRow,
  SettingCollapse
} from 'jimu-ui/advanced/setting-components'
import {
  type IWebChart,
  type WebChartSeries,
  type ChartDataSource
} from '../../../../../config'
import { defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { defaultMessages as jimuBuilderDefaultMessage } from 'jimu-for-builder'
import { type WebChartAxis } from 'jimu-ui/advanced/chart'
import defaultMessages from '../../../../translations/default'
import { ChartSettingSection } from '../../type'
import HistogramData, { isOverlaysCreated } from './data'
import { AppearanceSetting } from '../common-sections/appearance'
import { AxesSetting } from '../common-sections/axes'
import { XYGeneralSetting } from '../common-sections/genaral'

interface HistogramSettingProps {
  section: ChartSettingSection
  webChart: ImmutableObject<IWebChart>
  useDataSources: ImmutableArray<UseDataSource>
  onSectionChange: (section: ChartSettingSection) => void
  onWebChartChange: (
    webChart: ImmutableObject<IWebChart>,
    query?: IMFeatureLayerQueryParams
  ) => void
}

const HistogramSetting = (
  props: HistogramSettingProps
): React.ReactElement => {
  const {
    section,
    webChart: propWebChart,
    useDataSources,
    onSectionChange,
    onWebChartChange
  } = props

  const translate = hooks.useTranslation(
    defaultMessages,
    jimuiDefaultMessage,
    jimuBuilderDefaultMessage
  )
  const rotated = propWebChart?.rotated ?? false
  const legendValid = isOverlaysCreated(propWebChart.series)
  const handleSeriesChange = (
    series: ImmutableArray<WebChartSeries>,
    chartDataSource?: ImmutableObject<ChartDataSource>,
    overlaysCreated?: boolean
  ) => {
    let webChart
    let query
    if (chartDataSource) {
      webChart = propWebChart
        .set('dataSource', chartDataSource)
        .set('series', series)
      if (chartDataSource.query !== propWebChart?.dataSource?.query) {
        query = chartDataSource?.query
      }
    } else {
      webChart = propWebChart.set('series', series)
    }
    if (typeof overlaysCreated !== 'undefined') {
      webChart = webChart.setIn(['legend', 'visible'], overlaysCreated)
    }
    onWebChartChange?.(webChart, query)
  }

  const handleAxesChange = (axes: ImmutableArray<WebChartAxis>): void => {
    onWebChartChange?.(propWebChart.set('axes', axes))
  }

  return (
    <>
      <SettingSection>
        <SettingCollapse
          label={translate('data')}
          aria-label={translate('data')}
          isOpen={section === ChartSettingSection.Data}
          onRequestOpen={() => { onSectionChange(ChartSettingSection.Data) }}
          onRequestClose={() => { onSectionChange(ChartSettingSection.None) }}
        >
          <HistogramData
            chartDataSource={propWebChart?.dataSource}
            useDataSources={useDataSources}
            series={propWebChart?.series}
            onChange={handleSeriesChange}
          />
        </SettingCollapse>
      </SettingSection>
      <SettingSection>
        <SettingCollapse
          label={translate('axes')}
          aria-label={translate('axes')}
          isOpen={section === ChartSettingSection.Axes}
          onRequestOpen={() => { onSectionChange(ChartSettingSection.Axes) }}
          onRequestClose={() => { onSectionChange(ChartSettingSection.None) }}
        >
          <SettingRow flow='wrap'>
            <AxesSetting
              rotated={rotated}
              axes={propWebChart?.axes}
              showLogarithmicScale={false}
              showFirstValueRange={false}
              showFirstIntegerOnly={false}
              onChange={handleAxesChange}
            />
          </SettingRow>
        </SettingCollapse>
      </SettingSection>
      <SettingSection>
        <SettingCollapse
          label={translate('general')}
          aria-label={translate('general')}
          isOpen={section === ChartSettingSection.General}
          onRequestOpen={() => { onSectionChange(ChartSettingSection.General) }}
          onRequestClose={() => { onSectionChange(ChartSettingSection.None) }}
        >
          <SettingRow flow='wrap'>
            <XYGeneralSetting
              value={propWebChart}
              legendValid={legendValid}
              rotatable={false}
              onChange={onWebChartChange}
              hideLegendForEmptySeriesVisibility={false}
            />
          </SettingRow>
        </SettingCollapse>
      </SettingSection>
      <SettingSection>
        <SettingCollapse
          label={translate('appearance')}
          aria-label={translate('appearance')}
          isOpen={section === ChartSettingSection.Appearance}
          onRequestOpen={() => { onSectionChange(ChartSettingSection.Appearance) }}
          onRequestClose={() => { onSectionChange(ChartSettingSection.None) }}
        >
          <SettingRow flow='wrap'>
            <AppearanceSetting
              webChart={propWebChart}
              onChange={onWebChartChange}
            />
          </SettingRow>
        </SettingCollapse>
      </SettingSection>
    </>
  )
}

export default HistogramSetting
