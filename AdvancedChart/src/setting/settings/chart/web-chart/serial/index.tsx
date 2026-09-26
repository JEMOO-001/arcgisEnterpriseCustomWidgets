import { React, type ImmutableArray, type UseDataSource, type ImmutableObject, type IMFeatureLayerQueryParams, hooks } from 'jimu-core'
import { SettingSection, SettingRow, SettingCollapse } from 'jimu-ui/advanced/setting-components'
import { type ChartComponentProps, type IWebChart, type WebChartSeries } from '../../../../../config'
import { StatisticsDataSetting } from '../common-sections/data'
import { defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { defaultMessages as jimuBuilderDefaultMessage } from 'jimu-for-builder'
import { type ChartTypes, type WebChartAxis } from 'jimu-ui/advanced/chart'
import defaultMessages from '../../../../translations/default'
import { ChartSettingSection } from '../../type'
import { AppearanceSetting } from '../common-sections/appearance'
import { AxesSetting } from '../common-sections/axes'
import { XYGeneralSetting } from '../common-sections/genaral'
import { SerialSeriesSetting } from '../common-sections/series'
import { type SeriesRelatedProps } from '../common-sections/data'

interface SerialSettingProps {
  type: ChartTypes
  section: ChartSettingSection
  webChart: ImmutableObject<IWebChart>
  options: ImmutableObject<ChartComponentProps>
  useDataSources: ImmutableArray<UseDataSource>
  onOptionsChange: (options: ImmutableObject<ChartComponentProps>) => void
  onSectionChange: (section: ChartSettingSection) => void
  onWebChartChange: (webChart: ImmutableObject<IWebChart>, query?: IMFeatureLayerQueryParams) => void
}

const SerialSetting = (props: SerialSettingProps): React.ReactElement => {
  const {
    type,
    section,
    options,
    webChart: propWebChart,
    useDataSources,
    onSectionChange,
    onWebChartChange,
    onOptionsChange
  } = props

  const rotated = propWebChart?.rotated ?? false
  const legendValid = propWebChart?.series != null && propWebChart?.series?.length > 1

  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage, jimuBuilderDefaultMessage)

  const handleSeriesStatisticsChange = (series: ImmutableArray<WebChartSeries>, seriesRelatedProps: SeriesRelatedProps) => {
    const chartDataSource = seriesRelatedProps.chartDataSource
    const query = seriesRelatedProps.query
    const valueFormat = seriesRelatedProps.valueFormat
    let webChart = propWebChart.set('series', series).set('dataSource', chartDataSource)
    if (valueFormat) {
      webChart = webChart.setIn(['axes', '0', 'valueFormat'], valueFormat)
    }
    onWebChartChange?.(webChart, query)
  }

  const handleSeriesChange = (series: ImmutableArray<WebChartSeries>, seriesRelatedProps?: { valueFormat: any }) => {
    const valueFormat = seriesRelatedProps?.valueFormat
    let webChart = propWebChart.set('series', series)
    if (valueFormat) {
      webChart = webChart.setIn(['axes', '0', 'valueFormat'], valueFormat)
    }
    onWebChartChange?.(webChart)
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
          <SettingRow flow='wrap' aria-label={translate('data')} role='group'>
            <StatisticsDataSetting
              type={type}
              chartDataSource={propWebChart?.dataSource}
              useDataSources={useDataSources}
              series={propWebChart?.series}
              onChange={handleSeriesStatisticsChange}
            />
          </SettingRow>
        </SettingCollapse>
      </SettingSection>
      <SettingSection>
        <SettingCollapse
          aria-label={translate('series')}
          label={translate('series')}
          isOpen={section === ChartSettingSection.Series}
          onRequestOpen={() => { onSectionChange(ChartSettingSection.Series) }}
          onRequestClose={() => { onSectionChange(ChartSettingSection.None) }}
        >
          <SettingRow flow='wrap'>
            <SerialSeriesSetting
              rotated={rotated}
              series={propWebChart?.series}
              useDataSources={useDataSources}
              query={propWebChart?.dataSource?.query}
              onChange={handleSeriesChange}
            />
          </SettingRow>
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
              rotatable={true}
              options={options}
              legendValid={legendValid}
              onChange={onWebChartChange}
              onOptionsChange={onOptionsChange}
              hideLegendForEmptySeriesVisibility={true}
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

export default SerialSetting
