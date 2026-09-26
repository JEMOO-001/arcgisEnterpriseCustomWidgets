import { React, type ImmutableArray, type UseDataSource, Immutable, type ImmutableObject, hooks, JimuFieldType } from 'jimu-core'
import { defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { type ChartStatisticType, type ChartDataSource, type WebChartSeries } from '../../../../../../../../config'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { FieldSelector, SorteSetting, StatisticsSelector } from '../../../../components'
import defaultMessages from '../../../../../../../translations/default'
import { fetchFieldRange, getByGroupOrderFields, getAppropriateTimeUnit, getParsedOrderByField, isSupportSplitBy } from './utils'
import { getSeriesType, type ChartTypes, type WebChartLineChartSeries, type WebChartTimeIntervalUnits, type WebChartTimeAggregationTypes, type WebChartNullPolicyTypes, getSplitByField } from 'jimu-ui/advanced/chart'
import { isSerialSeries } from '../../../../../../../../utils/default'
import { createByGroupQuery, createByGroupSeries, getDefaultValueFormat, getSplitByFieldValues, getStatisticsType, getFieldType, getObjectIdField } from '../../../../../../../../utils/common'
import { TimeBinning } from './time-binning'
import { type SeriesRelatedProps } from '../type'
import { SplitByField } from './split-by-field'

export interface ByGroupDataProps {
  type: ChartTypes
  series: ImmutableArray<WebChartSeries>
  chartDataSource: ImmutableObject<ChartDataSource>
  useDataSources: ImmutableArray<UseDataSource>
  supportPercentile?: boolean
  onChange?: (series: ImmutableArray<WebChartSeries>, seriesRelatedProps: SeriesRelatedProps) => void
}

const defaultChartDataSource = Immutable({}) as ImmutableObject<ChartDataSource>

export const ByGroupData = (props: ByGroupDataProps): React.ReactElement => {
  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)
  const {
    type = 'barSeries',
    chartDataSource: propChartDataSource = defaultChartDataSource,
    useDataSources,
    series: propSeries,
    supportPercentile,
    onChange
  } = props

  const [loadingDate, setLoadingDate] = React.useState(false)
  const dataSourceId = useDataSources?.[0]?.dataSourceId
  const objectidField = React.useMemo(() => getObjectIdField(dataSourceId), [dataSourceId])
  const seriesType = getSeriesType(propSeries as any)
  const propQuery = propChartDataSource.query
  const categoryField = propQuery?.groupByFieldsForStatistics?.[0] ?? ''
  const outStatistics = propQuery?.outStatistics
  const outFields = propQuery?.outFields
  const where = propQuery?.where
  const splitByField = getSplitByField(where)
  const splitByFieldType = React.useMemo(() => getFieldType(splitByField, dataSourceId), [dataSourceId, splitByField])

  const splitByFieldValues = React.useMemo(() => {
    return splitByField ? getSplitByFieldValues(propSeries) : []
  }, [propSeries, splitByField])

  const categoryFieldType = getFieldType(categoryField, dataSourceId)
  const statisticType = getStatisticsType(propQuery) ?? 'count'
  const isTimeBinning = categoryFieldType === JimuFieldType.Date && seriesType === 'lineSeries' && statisticType !== 'no_aggregation'

  const timeIntervalSize = (propSeries?.[0] as unknown as WebChartLineChartSeries)?.timeIntervalSize
  const timeIntervalUnits = (propSeries?.[0] as unknown as WebChartLineChartSeries)?.timeIntervalUnits
  const timeAggregationType = (propSeries?.[0] as unknown as WebChartLineChartSeries)?.timeAggregationType
  const nullPolicy = (propSeries?.[0] as unknown as WebChartLineChartSeries)?.nullPolicy
  const trimIncompleteTimeInterval = (propSeries?.[0] as unknown as WebChartLineChartSeries)?.trimIncompleteTimeInterval

  const categoryFields = React.useMemo(() => {
    return categoryField ? Immutable([categoryField]) : Immutable([])
  }, [categoryField])

  const numericFields = React.useMemo(() => {
    const oFields = outFields || outStatistics?.map((outStatistic) => outStatistic.onStatisticField)?.filter(field => !!field)
    let fields = oFields?.asMutable({ deep: true })
    if (!fields?.length && !categoryField) {
      fields = [objectidField]
    }
    return fields || []
  }, [categoryField, objectidField, outFields, outStatistics])

  const defaultNumericFields = React.useMemo(() => Immutable(numericFields), [numericFields])

  const pageSize = !isTimeBinning ? propQuery?.pageSize : undefined

  const orderFields = React.useMemo(() => getByGroupOrderFields(propQuery, translate), [propQuery, translate])
  const orderByFields = propQuery?.orderByFields
  const orderByField = React.useMemo(() => getParsedOrderByField(orderByFields?.[0], orderFields), [orderByFields, orderFields])

  const hideNumericFields = numericFields?.length === 1 && statisticType === 'count'
  const isNumericFieldsMultiple = isSerialSeries(type)

  const supportSplitBy = React.useMemo(() => isSupportSplitBy(dataSourceId, propQuery, propSeries), [dataSourceId, propSeries, propQuery])

  const handleCategoryFieldChange = async (fields: string[]): Promise<void> => {
    const categoryField = fields?.[0]
    const categoryFieldType: JimuFieldType = getFieldType(categoryField, dataSourceId)
    const isDateType = categoryFieldType === JimuFieldType.Date
    const useTimeBinning = isDateType && seriesType === 'lineSeries' && statisticType !== 'no_aggregation'
    const orderByFields = [`${categoryField} ASC`]
    if (useTimeBinning) {
      try {
        setLoadingDate(true)
        const [startTime, endTime] = await fetchFieldRange(categoryField, dataSourceId)
        setLoadingDate(false)
        const timeIntervalUnits = getAppropriateTimeUnit(startTime, endTime)
        const series = createByGroupSeries({ splitByField, splitByFieldType, splitByFieldValues, categoryField, statisticType, numericFields, propSeries: propSeries.asMutable({ deep: true }), timeIntervalUnits }, dataSourceId)
        const query = createByGroupQuery({ categoryField, splitByField, statisticType, numericFields }, orderByFields, pageSize)
        if (!series?.length) return
        const valueFormat = getDefaultValueFormat(categoryFieldType)
        const chartDataSource = propChartDataSource.set('query', query)
        onChange(Immutable(series), { chartDataSource, query: chartDataSource.query, valueFormat })
      } catch (error) {
        setLoadingDate(false)
        console.error(error)
      }
    } else {
      const series = createByGroupSeries({ categoryField, statisticType, numericFields, propSeries: propSeries.asMutable({ deep: true }) }, dataSourceId)
      const query = createByGroupQuery({ categoryField, statisticType, numericFields }, orderByFields, pageSize)
      const valueFormat = getDefaultValueFormat(categoryFieldType)
      const chartDataSource = propChartDataSource.set('query', query)
      onChange(Immutable(series), { chartDataSource, query: chartDataSource.query, valueFormat })
    }
  }

  const handleStatisticTypeChange = async (statisticType: ChartStatisticType): Promise<void> => {
    let _numericFields = numericFields
    if (statisticType === 'count') {
      _numericFields = [objectidField]
    } else {
      if (numericFields?.[0] === objectidField) {
        _numericFields = []
      }
    }
    const orderByFields = [`${categoryField} ASC`]
    const series = createByGroupSeries({ splitByField, splitByFieldType, splitByFieldValues, categoryField, statisticType, numericFields: _numericFields, propSeries: propSeries.asMutable({ deep: true }), timeIntervalUnits: statisticType === 'no_aggregation' ? null : timeIntervalUnits }, dataSourceId)
    const query = createByGroupQuery({ categoryField, splitByField, statisticType, numericFields: _numericFields }, orderByFields, pageSize)
    if (!series?.length) return
    const chartDataSource = propChartDataSource.set('query', query)
    onChange(Immutable(series), { chartDataSource, query: chartDataSource.query })
  }

  const handleNumericFieldsChange = async (numericFields: string[]): Promise<void> => {
    const orderByFields = [`${categoryField} ASC`]
    const _splitByField = numericFields?.length !== 1 ? '' : splitByField
    const series = createByGroupSeries({ splitByField: _splitByField, splitByFieldType, splitByFieldValues, categoryField, statisticType, numericFields, propSeries: propSeries.asMutable({ deep: true }), timeIntervalUnits }, dataSourceId)
    const query = createByGroupQuery({ categoryField, splitByField: _splitByField, statisticType, numericFields }, orderByFields, pageSize)
    if (!series?.length) return
    const chartDataSource = propChartDataSource.set('query', query)
    onChange(Immutable(series), { chartDataSource, query: chartDataSource.query })
  }

  const handleSplitByFieldChange = (splitByField: string, values: Array<number | string>, splitByFieldType: JimuFieldType): Promise<void> => {
    const orderByFields = [`${categoryField} ASC`]
    const series = createByGroupSeries({ splitByField, splitByFieldType, splitByFieldValues: values, categoryField, statisticType, numericFields, propSeries: propSeries.asMutable({ deep: true }), timeIntervalUnits }, dataSourceId)
    const query = createByGroupQuery({ categoryField, splitByField, statisticType, numericFields }, orderByFields, pageSize)
    if (!series?.length) return
    const chartDataSource = propChartDataSource.set('query', query)
    onChange(Immutable(series), { chartDataSource, query: chartDataSource.query })
  }

  const handleTimeIntervalChange = (size: number, unit: WebChartTimeIntervalUnits) => {
    const series = propSeries.map((serie) => {
      return serie.set('timeIntervalSize', size).set('timeIntervalUnits', unit)
    }) as unknown as ImmutableArray<WebChartSeries>
    onChange(series, { chartDataSource: propChartDataSource })
  }

  const handleTimeAggregationTypeChange = (value: WebChartTimeAggregationTypes) => {
    const series = propSeries.map((serie) => {
      return serie.set('timeAggregationType', value)
    }) as unknown as ImmutableArray<WebChartSeries>
    onChange(series, { chartDataSource: propChartDataSource })
  }

  const handleNullPolicyChange = (value: WebChartNullPolicyTypes) => {
    const series = propSeries.map((serie) => {
      return serie.set('nullPolicy', value)
    }) as unknown as ImmutableArray<WebChartSeries>
    onChange(series, { chartDataSource: propChartDataSource })
  }

  const handleTrimIncompleteTimeIntervalChange = (value: boolean) => {
    const series = propSeries.map((serie) => {
      return serie.set('trimIncompleteTimeInterval', value)
    }) as unknown as ImmutableArray<WebChartSeries>
    onChange(series, { chartDataSource: propChartDataSource })
  }

  const handleOrderChanged = (value: string): void => {
    if (propQuery) {
      const query = propQuery.set('orderByFields', [value])
      const chartDataSource = propChartDataSource.set('query', query)
      onChange(propSeries, { chartDataSource })
    }
  }

  return (
    <>
      <SettingRow label={translate('categoryField')} flow='wrap'>
        <FieldSelector
          className='category-field-selector'
          type='category'
          hideDateField={seriesType === 'pieSeries'}
          aria-label={translate('categoryField')}
          useDataSources={useDataSources}
          isMultiple={false}
          fields={categoryFields}
          onChange={handleCategoryFieldChange}
        />
      </SettingRow>

      <SettingRow label={translate('statistics')} flow='wrap'>
        <StatisticsSelector
          hideCount={false}
          disabled={!categoryField}
          hideNoAggregation={seriesType === 'pieSeries'}
          hidePercentileCount={!supportPercentile}
          value={statisticType}
          aria-label={translate('statistics')}
          onChange={handleStatisticTypeChange}
        />
      </SettingRow>
      {!hideNumericFields &&
        <>
          <SettingRow label={translate('numberFields')} flow='no-wrap'></SettingRow>
          <FieldSelector
            hideIdField={true}
            disabled={!categoryField}
            className='numeric-fields-selector mt-2 mb-4'
            type='numeric'
            aria-label={translate('numberFields')}
            isMultiple={isNumericFieldsMultiple}
            useDataSources={useDataSources}
            defaultFields={defaultNumericFields}
            debounce={true}
            onChange={handleNumericFieldsChange}
          />
        </>}
      {
        supportSplitBy && <>
          <SettingRow label={translate('splitByField')} flow='wrap'>
            <SplitByField
              disabled={numericFields?.length !== 1}
              aria-label={translate('splitByField')}
              useDataSources={useDataSources}
              splitByField={splitByField}
              onChange={handleSplitByFieldChange}
            />
          </SettingRow>
        </>
      }

      {
        isTimeBinning && (
          <>
            <SettingRow label={translate('timeBinningOptions')} flow='no-wrap'></SettingRow>
            <TimeBinning
              className='mt-2 mb-4'
              loading={loadingDate}
              timeIntervalSize={timeIntervalSize}
              timeIntervalUnits={timeIntervalUnits}
              timeAggregationType={timeAggregationType}
              nullPolicy={nullPolicy}
              trimIncompleteTimeInterval={trimIncompleteTimeInterval}
              onTimeIntervalChange={handleTimeIntervalChange}
              onTimeAggregationTypeChange={handleTimeAggregationTypeChange}
              onNullPolicyChange={handleNullPolicyChange}
              onTrimIncompleteTimeIntervalChange={handleTrimIncompleteTimeIntervalChange}
            />
          </>
        )
      }

      {!isTimeBinning && <SettingRow label={translate('sortBy')} flow='wrap'>
        <SorteSetting
          aria-label={translate('sortBy')}
          value={orderByField}
          fields={orderFields}
          disabled={!categoryField}
          onChange={handleOrderChanged}
        />
      </SettingRow>}
    </>
  )
}
