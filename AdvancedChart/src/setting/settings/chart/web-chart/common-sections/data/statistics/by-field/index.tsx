import { React, type ImmutableArray, type UseDataSource, Immutable, type ImmutableObject, hooks } from 'jimu-core'
import { defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { type ChartDataSource, type WebChartSeries } from '../../../../../../../../config'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { FieldSelector, SorteSetting, StatisticsSelector } from '../../../../components'
import defaultMessages from '../../../../../../../translations/default'
import { getByFieldOrderFields } from './utils'
import { ByFieldSeriesX, ByFieldSeriesY } from '../../../../../../../../constants'
import { createByFieldQuery, createByFieldSeries, normalizeStatisticFieldLabel } from '../../../../../../../../utils/common'
import { type SeriesRelatedProps } from '../type'

export interface ByFieldDataProps {
  series: ImmutableArray<WebChartSeries>
  chartDataSource: ImmutableObject<ChartDataSource>
  useDataSources: ImmutableArray<UseDataSource>
  supportPercentile?: boolean
  onChange?: (series: ImmutableArray<WebChartSeries>, seriesRelatedProps: SeriesRelatedProps) => void
}

const defaultChartDataSource = Immutable({}) as ImmutableObject<ChartDataSource>

export const ByFieldData = (props: ByFieldDataProps): React.ReactElement => {
  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)
  const {
    chartDataSource: propChartDataSource = defaultChartDataSource,
    useDataSources,
    series: propSeries,
    supportPercentile,
    onChange
  } = props

  const x = ByFieldSeriesX
  const y = ByFieldSeriesY

  const query = propChartDataSource.query
  const outStatistics = query?.outStatistics
  const numericFields = React.useMemo(() => {
    const nFields = outStatistics?.map((outStatistic) => outStatistic.onStatisticField).filter(field => !!field)
    return nFields || Immutable([])
  }, [outStatistics])

  const statisticType: any = outStatistics?.[0]?.statisticType ?? 'sum'
  const orderByFields = query?.orderByFields ?? [`${x} ASC`]

  const seriesName = React.useMemo(() => normalizeStatisticFieldLabel(statisticType, translate('value'), translate), [statisticType, translate])

  const orderFields = React.useMemo(() => getByFieldOrderFields(propSeries, translate), [translate, propSeries])

  const handleStatisticTypeChange = (statisticType): void => {
    const seriesName = normalizeStatisticFieldLabel(statisticType, translate('value'), translate)
    const series = createByFieldSeries({ x, y, name: seriesName, propSeries })
    const query = createByFieldQuery({ statisticType, numericFields }, orderByFields)
    const chartDataSource = propChartDataSource.set('query', query)
    onChange(Immutable(series), { chartDataSource, query: chartDataSource.query })
  }

  const handleNumericFieldsChange = (numericFields: string[]): void => {
    const series = createByFieldSeries({ x, y, name: seriesName, propSeries })
    const query = createByFieldQuery({ statisticType, numericFields }, orderByFields)
    const chartDataSource = propChartDataSource.set('query', query)
    onChange(Immutable(series), { chartDataSource, query: chartDataSource.query })
  }

  const handleOrderChanged = (value: string): void => {
    const query = createByFieldQuery({ statisticType, numericFields }, [value])
    const chartDataSource = propChartDataSource.set('query', query)
    onChange(propSeries, { chartDataSource })
  }

  return (
    <>
      <SettingRow label={translate('statistics')} flow='wrap'>
        <StatisticsSelector
          aria-label={translate('statistics')}
          hideCount={true}
          hideNoAggregation={true}
          hidePercentileCount={!supportPercentile}
          value={statisticType}
          onChange={handleStatisticTypeChange}
          disabled={!numericFields?.length}
        />
      </SettingRow>

      <SettingRow label={translate('numberFields')} flow='wrap'>
        <FieldSelector
          aria-label={translate('numberFields')}
          className='numeric-fields-selector'
          type='numeric'
          isMultiple={true}
          useDataSources={useDataSources}
          defaultFields={numericFields}
          debounce={true}
          onChange={handleNumericFieldsChange}
        />
      </SettingRow>

      <SettingRow label={translate('sortBy')} flow='wrap'>
        <SorteSetting
          aria-label={translate('sortBy')}
          value={orderByFields?.[0]}
          fields={orderFields}
          onChange={handleOrderChanged}
        />
      </SettingRow>
    </>
  )
}
