import { React, type ImmutableObject, Immutable, hooks } from 'jimu-core'
import { type WebChartLegend, WebChartLegendPositions, type WebChartPieChartLegend } from 'jimu-ui/advanced/chart'
import { TextInput, Select, CollapsableToggle, NumericInput, Switch } from 'jimu-ui'
import { getDefaultLegend } from '../../../../../../../utils/default'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import defaultMessages from '../../../../../../translations/default'

interface LegendProps {
  disabled?: boolean
  value: ImmutableObject<WebChartLegend>
  isPieChart?: boolean
  hideLegendForEmptySeriesVisibility?: boolean
  hideEmptySeriesInLegend?: boolean
  onChange?: (value: ImmutableObject<WebChartLegend>) => void
  onHideEmptySeriesChange?: (hideEmptySeriesInLegend?: boolean) => void
}

const defaultValue = Immutable(getDefaultLegend())

export const Legend = (props: LegendProps): React.ReactElement => {
  const { disabled = false, isPieChart = false, hideLegendForEmptySeriesVisibility = true, hideEmptySeriesInLegend = false, onHideEmptySeriesChange, value = defaultValue, onChange } = props

  const translate = hooks.useTranslation(defaultMessages)

  const handleTitleTextChange = (text: string): void => {
    onChange?.(value.setIn(['title', 'content', 'text'], text))
  }

  const handleVisibleChange = (visible: boolean): void => {
    onChange?.(value.set('visible', visible))
  }

  const handlePositionChange = (
    evt: React.MouseEvent<HTMLSelectElement>
  ): void => {
    const position = evt.currentTarget.value as WebChartLegendPositions
    onChange?.(value.set('position', position))
  }

  const handleMaxWidthChange = (val: number): void => {
    const maxWidth = Math.floor(+val)
    onChange?.(value.set('labelMaxWidth', maxWidth))
  }

  return (
    <CollapsableToggle
      role='group'
      className='mt-4'
      level={3}
      disabled={disabled}
      label={translate('LegendLabel')}
      aria-label={translate('LegendLabel')}
      isOpen={!disabled && value?.visible}
      onRequestOpen={() => { handleVisibleChange(true) }}
      onRequestClose={() => { handleVisibleChange(false) }}
    >
      <div className='mt-4' role='group' aria-label={translate('LegendLabel')}>
        <SettingRow label={translate('legendTitle')} flow='wrap'>
          <TextInput
            size='sm'
            className='w-100'
            aria-label={translate('legendTitle')}
            defaultValue={value.title?.content.text}
            onAcceptValue={handleTitleTextChange}
          />
        </SettingRow>
        <SettingRow label={translate('legendPosition')} flow='no-wrap'>
          <Select
            size='sm'
            aria-label={translate('legendPosition')}
            value={value?.position}
            style={{ width: '88px' }}
            onChange={handlePositionChange}
          >
            <option value={WebChartLegendPositions.Left}>
              {translate(WebChartLegendPositions.Left)}
            </option>
            <option value={WebChartLegendPositions.Right}>
              {translate(WebChartLegendPositions.Right)}
            </option>
            <option value={WebChartLegendPositions.Top}>
              {translate(WebChartLegendPositions.Top)}
            </option>
            <option value={WebChartLegendPositions.Bottom}>
              {translate(WebChartLegendPositions.Bottom)}
            </option>
          </Select>
        </SettingRow>
        {isPieChart && <SettingRow label={translate('maxWidth')} flow='no-wrap'>
          <NumericInput
            aria-label={translate('maxWidth')}
            size='sm'
            min={0}
            step={1}
            max={1000}
            style={{ width: '88px' }}
            defaultValue={(value as ImmutableObject<WebChartPieChartLegend>).labelMaxWidth ?? ''}
            onAcceptValue={handleMaxWidthChange}
          />
        </SettingRow>}
        {(!isPieChart && hideLegendForEmptySeriesVisibility) && <SettingRow label={translate('hideLegendForEmptySeries')}>
          <Switch
            checked={hideEmptySeriesInLegend}
            aria-label={translate('hideLegendForEmptySeries')}
            onChange={(_, checked) => { onHideEmptySeriesChange?.(checked) }}
          />
        </SettingRow>}
      </div>
    </CollapsableToggle>
  )
}
