import { React, Immutable, defaultMessages as jimuCoreDefaultMessage, hooks } from 'jimu-core'
import { defaultMessages as jimuiDefaultMessage, Switch } from 'jimu-ui'
import { type ChartTypes } from 'jimu-ui/advanced/chart'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { type ImmutableObject } from 'seamless-immutable'
import { type ChartTools } from '../../../../../config'

interface ToolsProps {
  type: ChartTypes
  tools: ImmutableObject<ChartTools>
  onChange?: (tools: ImmutableObject<ChartTools>) => void
}

const DefaultTools: ImmutableObject<ChartTools> = Immutable({ cursorEnable: true })

export const Tools = (props: ToolsProps): React.ReactElement => {
  const { type = 'barSeries', tools: propTools = DefaultTools, onChange } = props

  const translate = hooks.useTranslation(jimuiDefaultMessage, jimuCoreDefaultMessage)
  const selectionLabel = type === 'pieSeries' ? translate('selection') : `${translate('selection')} & ${translate('ZoomLabel')}`

  const cursorEnable = propTools?.cursorEnable ?? false

  const handleCursorEnableChange = (_, checked: boolean): void => {
    const tools = propTools.set('cursorEnable', checked)
    onChange?.(tools)
  }

  return (
    <div className='serial-tools w-100' role='group' aria-label={translate('tools')}>
      <SettingRow label={selectionLabel} flow='no-wrap' className='mt-4'>
        <Switch
          aria-label={selectionLabel}
          checked={cursorEnable}
          onChange={handleCursorEnableChange}
        />
      </SettingRow>
    </div>
  )
}
