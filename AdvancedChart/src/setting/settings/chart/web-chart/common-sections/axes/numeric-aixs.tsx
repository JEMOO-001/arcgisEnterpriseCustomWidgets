import { React, type ImmutableObject, classNames, type ImmutableArray, hooks } from 'jimu-core'
import {
  TextInput,
  NumericInput,
  defaultMessages as jimuiDefaultMessage,
  Switch
} from 'jimu-ui'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { type CategoryFormatOptions, type NumberFormatOptions, type WebChartAxis, type WebChartGuide } from 'jimu-ui/advanced/chart'
import defaultMessages from '../../../../../translations/default'
import { NumericFormatSetting } from '../../components'
import Guides from './guide'
import { parseNumber } from './guide/utils'

export interface NumericAxisProps {
  className?: string
  isHorizontal: boolean
  showLogarithmicScale?: boolean
  showValueRange?: boolean
  showIntegerOnly?: boolean
  axis: ImmutableObject<WebChartAxis>
  onChange?: (axis: ImmutableObject<WebChartAxis>) => void
}

export const NumericAxis = (props: NumericAxisProps): React.ReactElement => {
  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)
  const { className, axis, isHorizontal, showLogarithmicScale, showValueRange = true, showIntegerOnly = true, onChange } = props
  const titleText = axis.title.content?.text ?? ''
  const valueFormat = axis.valueFormat
  const showGrid = axis.grid?.width > 0
  const minimum = axis.minimum ?? ''
  const maximum = axis.maximum ?? ''
  const isLogarithmic = axis.isLogarithmic ?? false
  const integerOnlyValues = axis.integerOnlyValues ?? false
  const guides = axis?.guides

  const handleTitleTextChange = (value: string): void => {
    onChange?.(
      axis.set(
        'title',
        axis.title.set('visible', value !== '').setIn(['content', 'text'], value)
      )
    )
  }

  const handleValueFormatChange = (value: ImmutableObject<CategoryFormatOptions> | ImmutableObject<NumberFormatOptions>): void => {
    onChange?.(axis.set('valueFormat', value))
  }

  const handleShowGridChange = (): void => {
    onChange?.(axis.setIn(['grid', 'width'], showGrid ? 0 : 1))
  }

  const handleMinumumChange = (value: string): void => {
    const minimum = parseNumber(value)
    onChange?.(axis.set('minimum', minimum))
  }

  const handleMaxumumChange = (value: string): void => {
    const maximum = parseNumber(value)
    onChange?.(axis.set('maximum', maximum))
  }

  const handleLogarithmicChange = (): void => {
    onChange?.(axis.set('isLogarithmic', !isLogarithmic))
  }

  const handleIntegerOnlyValuesChange = (): void => {
    onChange?.(axis.set('integerOnlyValues', !integerOnlyValues))
  }

  const handleGuidesChange = (value: ImmutableArray<WebChartGuide>) => {
    onChange?.(axis.set('guides', value))
  }

  return (
    <div className={classNames('numeric-axis w-100', className)}>
      {showValueRange && <SettingRow label={translate('valueRange')} flow='wrap' level={2}>
        <div className='d-flex align-items-center justify-content-between' aria-label={translate('valueRange')} role='group'>
          <NumericInput
            placeholder={translate('min')}
            size='sm'
            aria-label={translate('min')}
            showHandlers={false}
            value={minimum}
            style={{ width: '40%' }}
            onAcceptValue={handleMinumumChange}
          />
          <span className='text-truncate'>{translate('to')}</span>
          <NumericInput
            size='sm'
            showHandlers={false}
            placeholder={translate('max')}
            aria-label={translate('max')}
            value={maximum}
            style={{ width: '40%' }}
            onAcceptValue={handleMaxumumChange}
          />
        </div>
      </SettingRow>}
      {
        showLogarithmicScale && (
          <SettingRow label={translate('logarithmicScale')} level={2}>
            <Switch aria-label={translate('logarithmicScale')} checked={isLogarithmic} onChange={handleLogarithmicChange} />
          </SettingRow>
        )
      }
      {
        showIntegerOnly && <SettingRow label={translate('displayIntegersOnly')} level={2}>
          <Switch aria-label={translate('displayIntegersOnly')} checked={integerOnlyValues} onChange={handleIntegerOnlyValuesChange} />
        </SettingRow>
      }
      <SettingRow label={translate('axisTitle')} flow='wrap' level={2}>
        <TextInput
          size='sm'
          aria-label={translate('axisTitle')}
          defaultValue={titleText}
          className='w-100'
          onAcceptValue={handleTitleTextChange}
        />
      </SettingRow>
      <SettingRow label={translate('axisLabel')} aria-label={translate('axisLabel')} role='group' flow='wrap' level={2}>
        <NumericFormatSetting
          value={valueFormat as ImmutableObject<NumberFormatOptions>}
          onChange={handleValueFormatChange}
        />
      </SettingRow>
      <SettingRow label={translate('axisGrid')} level={2}>
        <Switch checked={showGrid} onChange={handleShowGridChange} />
      </SettingRow>
      <Guides isHorizontal={!isHorizontal} value={guides} onChange={handleGuidesChange} />
    </div>
  )
}
