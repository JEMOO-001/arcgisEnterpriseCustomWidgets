import {
  React,
  Immutable,
  type ImmutableArray,
  type ImmutableObject,
  type UseDataSource,
  hooks
} from 'jimu-core'
import {
  type ChartDataSource,
  type HistogramOverlaysType,
  type WebChartSeries
} from '../../../../../../config'
import {
  defaultMessages as jimuiDefaultMessage,
  Switch,
  Select,
  NumericInput
} from 'jimu-ui'
import defaultMessages from '../../../../../translations/default'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { FieldSelector, FillSymbolSetting } from '../../components'
import {
  getDefaultSeriesFillColor,
  getDefaultSeriesOutlineColor,
  getDefaultHistomgramOverlayColor,
  SeriesColors
} from '../../../../../../utils/default'
import { type ISimpleFillSymbol } from '@esri/arcgis-rest-types'
import {
  WebChartDataTransformations,
  type WebChartHistogramSeries,
  type WebChartOverlay
} from 'jimu-ui/advanced/chart'
import { HistogramOverlaySetting } from './overlay'
import { createHistogramSeries, createHistogramQuery } from '../../../../../../utils/common'

export interface HistogramDataProps {
  series: ImmutableArray<WebChartSeries>
  chartDataSource: ImmutableObject<ChartDataSource>
  useDataSources: ImmutableArray<UseDataSource>
  onChange?: (
    series: ImmutableArray<WebChartSeries>,
    chartDataSource?: ImmutableObject<ChartDataSource>,
    overlaysCreated?: boolean
  ) => void
}

export const isOverlaysCreated = (
  series: ImmutableArray<WebChartSeries>
): boolean => {
  const overlays = (series?.[0] as ImmutableObject<WebChartHistogramSeries>)
    ?.overlays
  if (!overlays) {
    return false
  }
  return Object.values(overlays).some(
    (overlay: WebChartOverlay) => overlay.created
  )
}

const presetColors = SeriesColors.map((color) => ({
  label: color,
  value: color,
  color: color
}))

const defaultFillColor = getDefaultSeriesFillColor()
const defaultLineColor = getDefaultSeriesOutlineColor('histogramSeries')

const defaultChartDataSource = Immutable({}) as ImmutableObject<ChartDataSource>

const HistogramData = (
  props: HistogramDataProps
): React.ReactElement => {
  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)
  const {
    chartDataSource: propChartDataSource = defaultChartDataSource,
    useDataSources,
    series: propSeries,
    onChange
  } = props

  const dataSourceId = useDataSources?.[0]?.dataSourceId
  const query = propChartDataSource.query
  const pageSize = query?.pageSize

  const numericField = query?.outFields?.[0]
  const propSerie = propSeries?.[0] as ImmutableObject<WebChartHistogramSeries>

  const dataTransformationType = propSerie?.dataTransformationType
  const dataTooltipVisible = propSerie?.dataTooltipVisible ?? true
  const binCount = propSerie?.binCount
  const fillSymbol = propSerie?.fillSymbol
  const valueLabelVisible = propSerie?.dataLabels.visible ?? false

  // Overlays
  const meanOverlay = propSerie?.overlays?.mean
  const medianOverlay = propSerie?.overlays?.median
  const stdOverlay = propSerie?.overlays?.standardDeviation
  const codOverlay = propSerie?.overlays?.comparisonDistribution

  const handleNumberFieldChange = (numericFields: string[]) => {
    const x = numericFields?.[0]
    const orderByFields = [`${x} ASC`]
    const series = createHistogramSeries(x, propSeries, dataSourceId)
    const query = createHistogramQuery(x, orderByFields, pageSize)
    const chartDataSource = propChartDataSource.set('query', query)
    onChange(Immutable(series), chartDataSource)
  }

  const handleDataTransformationTypeChange = (
    evt: React.MouseEvent<HTMLSelectElement>
  ): void => {
    const dataTransformationType = evt.currentTarget
      .value as WebChartDataTransformations
    const series = Immutable.setIn(
      propSeries,
      ['0', 'dataTransformationType'],
      dataTransformationType
    )
    onChange?.(series)
  }

  const handleDataTooltipVisibleChange = (evt): void => {
    const visible = evt.target.checked
    const series = Immutable.setIn(
      propSeries,
      ['0', 'dataTooltipVisible'],
      visible
    )
    onChange?.(series)
  }

  const handleBinCountChange = (binCount: number): void => {
    const series = Immutable.setIn(propSeries, ['0', 'binCount'], binCount)
    onChange?.(series)
  }

  const handleFillSymbolChange = (
    value: ImmutableObject<ISimpleFillSymbol>
  ): void => {
    const series = Immutable.setIn(propSeries, ['0', 'fillSymbol'], value)
    onChange?.(series)
  }

  const handleDataLabelsVisibleChange = (evt): void => {
    const visible = evt.target.checked
    const series = Immutable.setIn(
      propSeries,
      ['0', 'dataLabels', 'visible'],
      visible
    )
    onChange?.(series)
  }

  const handleOverlayCreatedChange = (
    type: HistogramOverlaysType,
    created: boolean
  ): void => {
    const visible = propSerie.overlays?.[type]?.visible ?? false
    let series = Immutable.setIn(
      propSeries,
      ['0', 'overlays', type, 'created'],
      created
    )
    if (!visible) {
      series = Immutable.setIn(series, ['0', 'overlays', type, 'visible'], true)
    }
    const overlaysCreated = isOverlaysCreated(series)
    onChange?.(series, propChartDataSource, overlaysCreated)
  }

  const handleOverlaysChange = (
    type: HistogramOverlaysType,
    value: ImmutableObject<WebChartOverlay>
  ): void => {
    const series = Immutable.setIn(propSeries, ['0', 'overlays', type], value)
    onChange?.(series)
  }

  return (
    <>
      <SettingRow level={2} label={translate('variables')} flow='wrap'>
        <SettingRow
          className='w-100'
          level={3}
          label={translate('numericFields')}
          flow='wrap'
        >
          <FieldSelector
            className='numeric-field-selector'
            type='numeric'
            aria-label={translate('numericFields')}
            useDataSources={useDataSources}
            isMultiple={false}
            hideIdField={true}
            fields={numericField ? Immutable([numericField]) : undefined}
            onChange={handleNumberFieldChange}
          />
        </SettingRow>
        <SettingRow
          className='w-100'
          level={3}
          label={translate('transformation')}
          flow='wrap'
        >
          <Select
            size='sm'
            aria-label={translate('transformation')}
            disabled={!numericField}
            value={dataTransformationType}
            onChange={handleDataTransformationTypeChange}
          >
            <option value={WebChartDataTransformations.None}>
              {translate('none')}
            </option>
            <option value={WebChartDataTransformations.Log}>
              {translate('logarithmic')}
            </option>
            <option value={WebChartDataTransformations.Sqrt}>
              {translate('squareRoot')}
            </option>
          </Select>
        </SettingRow>
      </SettingRow>
      <SettingRow level={2} label={translate('bins')} flow='wrap'>
        <SettingRow
          className='w-100'
          level={3}
          label={translate('numberOfBins')}
          flow='no-wrap'
        >
          <NumericInput
            style={{ width: 56 }}
            value={binCount}
            onAcceptValue={handleBinCountChange}
            min={1}
            max={64}
            step={1}
            size='sm'
            aria-label={translate('numberOfBins')}
            showHandlers={false}
          />
        </SettingRow>
        <SettingRow className='w-100' level={3} flow='no-wrap'>
          <FillSymbolSetting
            aria-label={translate('bins')}
            defaultFillColor={defaultFillColor}
            defaultLineColor={defaultLineColor}
            presetFillColors={presetColors}
            value={fillSymbol}
            onChange={handleFillSymbolChange}
          />
        </SettingRow>
        <SettingRow className='w-100' level={2} label={translate('dataLabel')} flow='no-wrap'>
          <Switch
            checked={valueLabelVisible}
            aria-label={translate('dataLabel')}
            onChange={handleDataLabelsVisibleChange}
          />
        </SettingRow>
        <SettingRow className='w-100' level={2} label={translate('hoverLabel')} flow='no-wrap'>
          <Switch
            aria-label={translate('hoverLabel')}
            checked={dataTooltipVisible}
            onChange={handleDataTooltipVisibleChange}
          />
        </SettingRow>
      </SettingRow>
      <SettingRow level={2} label={translate('statisticGraph')} flow='wrap' role='group' aria-label={translate('statisticGraph')}>
        <SettingRow className='w-100' level={3} label={translate('mean')} flow='no-wrap'>
          <Switch
            checked={meanOverlay.created}
            aria-label={translate('mean')}
            onChange={(evt) => { handleOverlayCreatedChange('mean', evt.target.checked) }
            }
          />
        </SettingRow>
        {meanOverlay.created && (
          <SettingRow className='w-100' level={3} flow='wrap'>
            <HistogramOverlaySetting
              aria-label={translate('mean')}
              defaultColor={getDefaultHistomgramOverlayColor('mean')}
              value={meanOverlay}
              onChange={(value) => { handleOverlaysChange('mean', value) }}
            />
          </SettingRow>
        )}
        <SettingRow className='w-100' level={3} label={translate('median')} flow='no-wrap'>
          <Switch
            checked={medianOverlay.created}
            aria-label={translate('median')}
            onChange={(evt) => { handleOverlayCreatedChange('median', evt.target.checked) }
            }
          />
        </SettingRow>
        {medianOverlay.created && (
          <SettingRow className='w-100' level={3} flow='wrap'>
            <HistogramOverlaySetting
              aria-label={translate('median')}
              defaultColor={getDefaultHistomgramOverlayColor('median')}
              value={medianOverlay}
              onChange={(value) => { handleOverlaysChange('median', value) }}
            />
          </SettingRow>
        )}
        <SettingRow
          className='w-100'
          level={3}
          label={translate('normalDistribution')}
          flow='no-wrap'
        >
          <Switch
            checked={codOverlay.created}
            aria-label={translate('normalDistribution')}
            onChange={(evt) => {
              handleOverlayCreatedChange(
                'comparisonDistribution',
                evt.target.checked
              )
            }
            }
          />
        </SettingRow>
        {codOverlay.created && (
          <SettingRow className='w-100' level={3} flow='wrap'>
            <HistogramOverlaySetting
              aria-label={translate('normalDistribution')}
              defaultColor={getDefaultHistomgramOverlayColor(
                'comparisonDistribution'
              )}
              value={codOverlay}
              onChange={(value) => { handleOverlaysChange('comparisonDistribution', value) }
              }
            />
          </SettingRow>
        )}
        <SettingRow
          className='w-100'
          level={3}
          label={translate('standardDeviation')}
          flow='no-wrap'
        >
          <Switch
            checked={stdOverlay.created}
            aria-label={translate('standardDeviation')}
            onChange={(evt) => {
              handleOverlayCreatedChange(
                'standardDeviation',
                evt.target.checked
              )
            }
            }
          />
        </SettingRow>
        {stdOverlay.created && (
          <SettingRow className='w-100' level={3} flow='wrap'>
            <HistogramOverlaySetting
              aria-label={translate('standardDeviation')}
              defaultColor={getDefaultHistomgramOverlayColor(
                'standardDeviation'
              )}
              value={stdOverlay}
              onChange={(value) => { handleOverlaysChange('standardDeviation', value) }
              }
            />
          </SettingRow>
        )}
      </SettingRow>
    </>
  )
}

export default HistogramData
