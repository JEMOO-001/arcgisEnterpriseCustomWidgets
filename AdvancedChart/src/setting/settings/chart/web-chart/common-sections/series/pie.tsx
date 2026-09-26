import { React, type ImmutableArray, type ImmutableObject, Immutable, type UseDataSource, hooks } from 'jimu-core'
import { defaultMessages as jimuiDefaultMessage, type LinearUnit, DistanceUnits, CollapsableToggle, Switch } from 'jimu-ui'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { type ChartDataSource, type WebChartSeries } from '../../../../../../config'
import defaultMessages from '../../../../../translations/default'
import { InputUnit } from 'jimu-ui/advanced/style-setting-components'
import { DefaultColorBySlicesOtherColor, getDefaultSeriesOutlineColor, getFillSymbol } from '../../../../../../utils/default'
import { type ISimpleLineSymbol } from '@esri/arcgis-rest-types'
import { LabelDisplaySetting, LineSymbolSetting, SimpleNumericFormatSetting } from '../../components'
import { ColorType } from './color-type'
import { ThemeColorPicker } from 'jimu-ui/basic/color-picker'
import { type NumberFormatOptions, type WebChartPieChartSeries } from 'jimu-ui/advanced/chart'
import { getTheme2 } from 'jimu-theme'
import { applyPieSlicesOutline } from './color-type/utils'
import { PieSliceGroupingSliceId } from '../../../../../../constants'
import { SettingCollapse } from '../../../../components'

interface PieSeriesSettingProps {
  useFeatureLayerDataSource?: boolean
  chartDataSource: ImmutableObject<ChartDataSource>
  useDataSources: ImmutableArray<UseDataSource>
  series: ImmutableArray<WebChartSeries>
  onChange?: (series: ImmutableArray<WebChartSeries>) => void
}

const units = [DistanceUnits.PERCENTAGE]

const defaultSeries = Immutable([])

const sliceGroupingLabel = 'Other'
const sliceGroupingColor = '#D6D6D6'

const defaultSliceGrouping = Immutable({
  sliceId: PieSliceGroupingSliceId,
  percentageThreshold: 0,
  label: sliceGroupingLabel,
  fillSymbol: getFillSymbol(sliceGroupingColor, 1, 'var(--light-100)')
}) as any

const defaultOutlineColor = getDefaultSeriesOutlineColor('pieSeries')

export const PieSeriesSetting = (props: PieSeriesSettingProps): React.ReactElement => {
  const { useFeatureLayerDataSource = true, series: propSeries = defaultSeries, useDataSources, chartDataSource, onChange } = props

  const theme2 = getTheme2()
  const propSerie: ImmutableObject<WebChartPieChartSeries> = propSeries[0]
  const dataLabelVisible = propSerie?.dataLabels.visible ?? false
  const dataTooltipVisible = propSerie?.dataTooltipVisible ?? true
  const alignDataLabels = propSerie.alignDataLabels ?? false
  const optimizeDataLabelsOverlapping = propSerie.optimizeDataLabelsOverlapping ?? false

  const numericValueFormat = propSerie.numericValueFormat
  const percentValueFormat = propSerie.percentValueFormat

  const displayPercentageOnDataLabel = propSerie?.displayPercentageOnDataLabel ?? false
  const displayNumericValueOnDataLabel = propSerie?.displayNumericValueOnDataLabel ?? true

  const displayPercentageOnTooltip = propSerie?.displayPercentageOnTooltip ?? true
  const displayNumericValueOnTooltip = propSerie?.displayNumericValueOnTooltip ?? true

  const dataLabelsOffset = propSerie?.dataLabelsOffset ?? 0
  const dataLabelsOffsetUnit: LinearUnit = {
    distance: dataLabelsOffset,
    unit: DistanceUnits.PIXEL
  }

  const propSliceGrouping = React.useMemo(() => {
    let grouping = propSerie?.sliceGrouping ?? defaultSliceGrouping
    if (!grouping.fillSymbol) {
      grouping = grouping.set('fillSymbol', defaultSliceGrouping.fillSymbol)
    }
    return grouping
  }, [propSerie?.sliceGrouping])

  const sliceGroupingFill = propSliceGrouping.fillSymbol
  const percentageThreshold = propSliceGrouping.percentageThreshold
  const percentageThresholdUnit: LinearUnit = {
    distance: percentageThreshold,
    unit: DistanceUnits.PERCENTAGE
  }

  const outline = propSerie?.fillSymbol?.outline

  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)

  const handleDataLabelsVisibleChange = (visible: boolean): void => {
    const series = Immutable.setIn(propSeries, ['0', 'dataLabels', 'visible'], visible)
    onChange?.(series)
  }

  const handleDataTooltipVisibleChange = (visible: boolean): void => {
    const series = Immutable.setIn(propSeries, ['0', 'dataTooltipVisible'], visible)
    onChange?.(series)
  }

  const handleNumericValueFormatChange = (value: ImmutableObject<NumberFormatOptions>): void => {
    const series = Immutable.setIn(propSeries, ['0', 'numericValueFormat'], value)
    onChange?.(series)
  }

  const handlePercentValueFormatChange = (value: ImmutableObject<NumberFormatOptions>): void => {
    const series = Immutable.setIn(propSeries, ['0', 'percentValueFormat'], value)
    onChange?.(series)
  }

  const handlePropertyChange = (name: string, value: any): void => {
    const series = Immutable.setIn(propSeries, ['0', name], value)
    onChange?.(series)
  }

  const handleLabelOffsetChange = (value: LinearUnit) => {
    const number = value.distance ?? 0
    const dataLabelsOffset = Math.floor(+number)
    const series = Immutable.setIn(propSeries, ['0', 'dataLabelsOffset'], dataLabelsOffset)
    onChange?.(series)
  }

  const handleAlignDataLabels = (evt): void => {
    const checked = evt.target.checked
    const series = Immutable.setIn(propSeries, ['0', 'alignDataLabels'], checked)
    onChange?.(series)
  }

  const handleOptimizeDataLabelsOverlapping = (evt): void => {
    const checked = evt.target.checked
    const series = Immutable.setIn(propSeries, ['0', 'optimizeDataLabelsOverlapping'], checked)
    onChange?.(series)
  }

  const handlePercentageThreshold = (value: LinearUnit) => {
    const number = value.distance ?? 0
    const percentageThreshold = Math.floor(+number)
    const sliceGrouping = propSliceGrouping.set('percentageThreshold', percentageThreshold)
    const series = Immutable.setIn(propSeries, ['0', 'sliceGrouping'], sliceGrouping)
    onChange?.(series)
  }

  const handleSliceGroupingColorChange = (value: string) => {
    const color = value || DefaultColorBySlicesOtherColor
    const sliceGrouping = propSliceGrouping.setIn(['fillSymbol', 'color'], color)
    const series = Immutable.setIn(propSeries, ['0', 'sliceGrouping'], sliceGrouping)
    onChange?.(series)
  }

  const handleOutlineChange = (value: ImmutableObject<ISimpleLineSymbol>) => {
    let series = Immutable.setIn(propSeries, ['0', 'fillSymbol', 'outline'], value)
    const sliceGrouping = propSliceGrouping.setIn(['fillSymbol', 'outline'], value)
    series = Immutable.setIn(series, ['0', 'sliceGrouping'], sliceGrouping)
    const propSlices = series?.[0]?.slices
    if (propSlices) {
      const slices = applyPieSlicesOutline(propSlices, value)
      series = Immutable.setIn(series, ['0', 'slices'], slices)
    }
    onChange?.(series)
  }

  return (
    <div className='pie-series-setting w-100' role='group' aria-label={translate('slices')}>
      <SettingCollapse
        role='group'
        className='mt-2'
        level={2}
        bottomLine={true}
        label={translate('displayFormat')}
        aria-label={translate('displayFormat')}
        defaultIsOpen={false}
      >
        <SettingRow label={translate('valueDecimal')} className="mt-2" flow='wrap' level={3}>
          <SimpleNumericFormatSetting
            value={numericValueFormat}
            onChange={handleNumericValueFormatChange}
          />
        </SettingRow>
        <SettingRow label={translate('percentageDecimal')} className="mt-2" flow='wrap' level={3}>
          <SimpleNumericFormatSetting
            value={percentValueFormat}
            onChange={handlePercentValueFormatChange}
          />
        </SettingRow>
      </SettingCollapse>
      <CollapsableToggle
        role='group'
        className='mt-2'
        level={2}
        label={translate('dataLabel')}
        aria-label={translate('dataLabel')}
        isOpen={dataLabelVisible}
        bottomLine={true}
        onRequestOpen={() => { handleDataLabelsVisibleChange(true) }}
        onRequestClose={() => { handleDataLabelsVisibleChange(false) }}
      >
        <LabelDisplaySetting
          className='mt-2'
          displayNumericValueOnLabel={displayNumericValueOnDataLabel}
          displayPercentageOnLabel={displayPercentageOnDataLabel}
          onDisplayNumericValueOnLabelChange={(checked: boolean) => { handlePropertyChange('displayNumericValueOnDataLabel', checked) }}
          onDisplayPercentageOnLabelChange={(checked: boolean) => { handlePropertyChange('displayPercentageOnDataLabel', checked) }}
        />
        <SettingRow label={translate('alignDataLabel')} level={3} className='mt-2 pl-1'>
          <Switch
            size='sm'
            aria-label={translate('alignDataLabel')}
            checked={alignDataLabels}
            onChange={handleAlignDataLabels}
          />
        </SettingRow>
        <SettingRow label={translate('optimizeDataLabelOverlaps')} level={3} className='mt-2 pl-1'>
          <Switch
            size='sm'
            aria-label={translate('optimizeDataLabelOverlaps')}
            checked={optimizeDataLabelsOverlapping}
            onChange={handleOptimizeDataLabelsOverlapping}
          />
        </SettingRow>
        <SettingRow label={translate('labelOffset')} level={3} className='mt-2'>
          <InputUnit
            style={{ width: 77 }}
            aria-label={translate('labelOffset')}
            size='sm'
            min={-100}
            step={1}
            max={100}
            units={units}
            value={dataLabelsOffsetUnit}
            onChange={handleLabelOffsetChange}
          />
        </SettingRow>
      </CollapsableToggle>
      <CollapsableToggle
        role='group'
        className='mt-2'
        level={2}
        label={translate('hoverLabel')}
        aria-label={translate('hoverLabel')}
        isOpen={dataTooltipVisible}
        onRequestOpen={() => { handleDataTooltipVisibleChange(true) }}
        onRequestClose={() => { handleDataTooltipVisibleChange(false) }}
      >
        <LabelDisplaySetting
          className='mt-2'
          displayNumericValueOnLabel={displayNumericValueOnTooltip}
          displayPercentageOnLabel={displayPercentageOnTooltip}
          onDisplayNumericValueOnLabelChange={(checked: boolean) => { handlePropertyChange('displayNumericValueOnTooltip', checked) }}
          onDisplayPercentageOnLabelChange={(checked: boolean) => { handlePropertyChange('displayPercentageOnTooltip', checked) }}
        />
      </CollapsableToggle>
      <SettingRow label={translate('grouping')} className='mt-4' level={2}>
        <div className='slice-grouping w-50 d-flex justify-content-between' role='group' aria-label={translate('grouping')}>
          <InputUnit
            className='flex-grow-1 mr-1'
            size='sm'
            aria-label={translate('grouping')}
            min={0}
            step={1}
            max={100}
            units={units}
            value={percentageThresholdUnit}
            onChange={handlePercentageThreshold}
          />
          <ThemeColorPicker specificTheme={theme2} title={translate('groupedColor')} aria-label={translate('groupedColor')} className='flex-shrink-0 mr-1' value={sliceGroupingFill.color} onChange={handleSliceGroupingColorChange} />
        </div>
      </SettingRow>
      <SettingRow label={translate('columnOutline')} flow='wrap' level={2}>
        <LineSymbolSetting aria-label={translate('columnOutline')} type='outline' defaultColor={defaultOutlineColor} value={outline} onChange={handleOutlineChange} />
      </SettingRow>
      <ColorType
        useFeatureLayerDataSource={useFeatureLayerDataSource}
        chartDataSource={chartDataSource}
        useDataSources={useDataSources}
        series={propSeries}
        onChange={onChange} />
    </div>
  )
}
