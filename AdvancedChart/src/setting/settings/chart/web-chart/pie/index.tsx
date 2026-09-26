import { React, type ImmutableArray, type UseDataSource, type ImmutableObject, type IMFeatureLayerQueryParams, hooks, DataSourceManager } from 'jimu-core'
import { SettingSection, SettingRow, SettingCollapse } from 'jimu-ui/advanced/setting-components'
import { type IWebChart, type WebChartSeries } from '../../../../../config'
import { defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { defaultMessages as jimuBuilderDefaultMessage } from 'jimu-for-builder'
import defaultMessages from '../../../../translations/default'
import { ChartSettingSection } from '../../type'
import { AppearanceSetting } from '../common-sections/appearance'
import { PieGeneralSetting } from '../common-sections/genaral'
import { PieSeriesSetting } from '../common-sections/series'
import { StatisticsDataSetting } from '../common-sections/data'
import { type ChartTypes } from 'jimu-ui/advanced/chart'
import { type SeriesRelatedProps } from '../common-sections/data'
import { whetherUseInlineDataSource } from '../../../../../utils/common'

interface PieSettingProps {
  type: ChartTypes
  section: ChartSettingSection
  webChart: ImmutableObject<IWebChart>
  useDataSources: ImmutableArray<UseDataSource>
  onSectionChange: (section: ChartSettingSection) => void
  onWebChartChange: (webChart: ImmutableObject<IWebChart>, query?: IMFeatureLayerQueryParams) => void
}

const PieSetting = (props: PieSettingProps): React.ReactElement => {
  const {
    type,
    section,
    webChart: propWebChart,
    onSectionChange,
    useDataSources,
    onWebChartChange
  } = props

  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage, jimuBuilderDefaultMessage)

  const dataSourceId = useDataSources?.[0]?.dataSourceId
  const dataSource = React.useMemo(() => { return DataSourceManager.getInstance().getDataSource(dataSourceId) }, [dataSourceId])
  const useFeatureLayerDataSource = !whetherUseInlineDataSource(propWebChart, dataSource)

  const handleSeriesStatisticsChange = (series: ImmutableArray<WebChartSeries>, seriesRelatedProps: SeriesRelatedProps) => {
    const chartDataSource = seriesRelatedProps.chartDataSource
    const query = seriesRelatedProps.query
    const webChart = propWebChart.set('series', series).set('dataSource', chartDataSource)
    onWebChartChange?.(webChart, query)
  }

  const handleSeiesChange = (series: ImmutableArray<WebChartSeries>) => {
    onWebChartChange?.(propWebChart.set('series', series))
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
          label={translate('slices')}
          aria-label={translate('slices')}
          isOpen={section === ChartSettingSection.Series}
          onRequestOpen={() => { onSectionChange(ChartSettingSection.Series) }}
          onRequestClose={() => { onSectionChange(ChartSettingSection.None) }}
        >
          <SettingRow flow='wrap'>
            <PieSeriesSetting
              useDataSources={useDataSources}
              useFeatureLayerDataSource={useFeatureLayerDataSource}
              chartDataSource={propWebChart.dataSource}
              series={propWebChart?.series}
              onChange={handleSeiesChange}
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
            <PieGeneralSetting
              value={propWebChart}
              onChange={onWebChartChange}
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

export default PieSetting
