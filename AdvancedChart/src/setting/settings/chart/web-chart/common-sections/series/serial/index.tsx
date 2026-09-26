import { React, type ImmutableArray, Immutable, hooks, getAppStore, type IMFeatureLayerQueryParams, type UseDataSource } from 'jimu-core'
import { Select, defaultMessages as jimuiDefaultMessage, Switch, CollapsableToggle } from 'jimu-ui'
import { WebChartStackedKinds } from 'jimu-ui/advanced/chart'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { type WebChartSeries } from '../../../../../../../config'
import defaultMessages from '../../../../../../translations/default'
import { getSerialStackedType } from '../../../../../../../utils/common'
import { TextAlignment, TextAlignments } from '../../../components'
import SeriesSetting from './series'

interface SerialSeriesSettingProps {
  rotated?: boolean
  series: ImmutableArray<WebChartSeries>
  query?: IMFeatureLayerQueryParams
  useDataSources?: ImmutableArray<UseDataSource>
  onChange?: (series: ImmutableArray<WebChartSeries>) => void
}

const DefaultSeries: any = Immutable([])
export const SerialSeriesSetting = (props: SerialSeriesSettingProps): React.ReactElement => {
  const { useDataSources, query, series: propSeries = DefaultSeries, rotated = false, onChange } = props
  const valueLabelVisible = propSeries[0]?.dataLabels.visible ?? false
  const dataTooltipVisible = propSeries[0]?.dataTooltipVisible ?? true
  const { current: isRTL } = React.useRef(getAppStore().getState().appContext.isRTL)

  const alignmentName = rotated ? 'horizontalAlignment' : 'verticalAlignment'
  const alignments = TextAlignments[alignmentName]
  const alignment = propSeries?.[0]?.dataLabels.content[alignmentName] ?? alignments[2]

  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)

  const handleStackedTypeChange = (
    evt: React.MouseEvent<HTMLSelectElement>
  ): void => {
    const stackedType = evt.currentTarget.value as WebChartStackedKinds
    const series = propSeries?.map(propSerie => {
      return propSerie.set('stackedType', stackedType)
    })
    onChange?.(series)
  }

  const handleDataLabelsVisibleChange = (visible: boolean): void => {
    const series = propSeries?.map(propSerie => {
      return propSerie.setIn(['dataLabels', 'visible'], visible)
    })
    onChange?.(series)
  }

  const handleDataTooltipVisibleChange = (evt): void => {
    const visible = evt.target.checked
    const series = propSeries?.map(propSerie => {
      return propSerie.set('dataTooltipVisible', visible)
    })
    onChange?.(series)
  }

  const handleAlignmentChange = (alignment): void => {
    const series = propSeries?.map(propSerie => {
      return propSerie.setIn(['dataLabels', 'content', alignmentName], alignment)
    })
    onChange?.(series)
  }

  return (
    <div className='serial-series-setting w-100' role='group' aria-label={translate('series')}>
      <SettingRow label={translate('stacking')} className="mt-2" level={2}>
        <Select
          size='sm'
          aria-label={translate('stacking')}
          className='w-50'
          value={getSerialStackedType(propSeries)}
          onChange={handleStackedTypeChange}
        >
          <option value={WebChartStackedKinds.Side}>
            {translate(WebChartStackedKinds.Side)}
          </option>
          <option value={WebChartStackedKinds.Stacked}>
            {translate(WebChartStackedKinds.Stacked)}
          </option>
          <option value={WebChartStackedKinds.Stacked100}>
            {`${translate(WebChartStackedKinds.Stacked)} ${isRTL ? '100%' : '%100'}`}
          </option>
        </Select>
      </SettingRow>
      <CollapsableToggle
        role='group'
        className='mt-2'
        level={2}
        label={translate('dataLabel')}
        aria-label={translate('dataLabel')}
        isOpen={valueLabelVisible}
        onRequestOpen={() => { handleDataLabelsVisibleChange(true) }}
        onRequestClose={() => { handleDataLabelsVisibleChange(false) }}
      >
        <SettingRow
          level={3}
          truncateLabel={true}
          className='label-alignment w-100 mt-2'
          label={translate('alignment')}
          flow='no-wrap'
        >
          <TextAlignment
            aria-label={translate('alignment')}
            vertical={!rotated}
            className='w-50'
            value={alignment}
            onChange={handleAlignmentChange}
          />
        </SettingRow>
      </CollapsableToggle>
      <SettingRow label={translate('hoverLabel')} className="mt-2" level={2}>
        <Switch
          aria-label={translate('hoverLabel')}
          checked={dataTooltipVisible}
          onChange={handleDataTooltipVisibleChange}
        />
      </SettingRow>
     <SeriesSetting useDataSources={useDataSources} query={query} series={propSeries} onChange={onChange} />
    </div>
  )
}
