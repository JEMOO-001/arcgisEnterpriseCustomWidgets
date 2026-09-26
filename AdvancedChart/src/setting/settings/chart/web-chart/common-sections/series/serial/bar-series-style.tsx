import { React, type ImmutableObject, classNames, hooks } from 'jimu-core'
import { type ISimpleFillSymbol } from '@esri/arcgis-rest-types'
import { TextInput, defaultMessages as jimuMessages } from 'jimu-ui'
import defaultMessages from '../../../../../../translations/default'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { FillSymbolSetting } from '../../../components'
import { type WebChartSeries } from '../../../../../../../config'
import { SeriesColors } from '../../../../../../../utils/default'

interface BarSeriesStyleProps {
  className?: string
  labelVisibility?: boolean
  defaultFillColor: string
  defaultLineColor: string
  serie: ImmutableObject<WebChartSeries>
  onChange?: (serie: ImmutableObject<WebChartSeries>) => void
}

const presetSeriesColors = SeriesColors.map((color) => ({
  label: color,
  value: color,
  color: color
}))

export const BarSeriesStyle = (props: BarSeriesStyleProps): React.ReactElement => {
  const { className, labelVisibility = true, serie, defaultFillColor, defaultLineColor, onChange } = props
  const translate = hooks.useTranslation(defaultMessages, jimuMessages)

  const handleLabelChange = (value: string): void => {
    onChange?.(serie.set('name', value))
  }

  const handleFillSymbolChange = (
    value: ImmutableObject<ISimpleFillSymbol>
  ): void => {
    onChange?.(serie.set('fillSymbol', value))
  }

  return (
    <div className={classNames('bar-series-style w-100', className)}>
      {labelVisibility && <SettingRow label={translate('label')} flow='no-wrap'>
        <TextInput
          size='sm'
          aria-label={translate('label')}
          className='w-50 wrapper-overflow-hidden'
          defaultValue={serie?.name ?? ''}
          onAcceptValue={handleLabelChange}
        />
      </SettingRow>}
      <SettingRow label={labelVisibility ? translate('symbol') : ''} flow='wrap' className='mt-3'>
        <FillSymbolSetting
          defaultFillColor={defaultFillColor}
          defaultLineColor={defaultLineColor}
          presetFillColors={presetSeriesColors}
          value={(serie as any)?.fillSymbol}
          onChange={handleFillSymbolChange}
        />
      </SettingRow>
    </div>
  )
}
