import { React, classNames, hooks } from 'jimu-core'
import { ZoomInOutlined } from 'jimu-icons/outlined/editor/zoom-in'
import { Button, defaultMessages, Tooltip } from 'jimu-ui'
import { SelectRectangleOutlined } from 'jimu-icons/outlined/gis/select-rectangle'
import { type ChartTypes } from 'jimu-ui/advanced/chart'
import { isXYChart } from '../../../utils/default'

export type RangeCursorModeValue = 'selection' | 'zoom'

export interface RangeCursorModeProps {
  type: ChartTypes
  className?: string
  onChange: (mode?: RangeCursorModeValue) => void
}

export const RangeCursorMode = (props: RangeCursorModeProps): React.ReactElement => {
  const translate = hooks.useTranslation(defaultMessages)
  const [mode, setMode] = React.useState<RangeCursorModeValue>('selection')

  const { type = 'barSeries', className, onChange } = props

  const handleSelectionClick = () => {
    if (type === 'pieSeries') return

    onChange('selection')
    setMode('selection')
  }

  const handleZoomClick = () => {
    onChange('zoom')
    setMode('zoom')
  }

  return <div className={classNames('range-cursor-mode', className)}>
    <Tooltip title={translate('SelectLabel')}>
      <Button
        size='sm'
        className="mr-1"
        icon
        type='tertiary'
        aria-label={translate('SelectLabel')}
        onClick={handleSelectionClick}
        active={mode === 'selection'}
      >
        <SelectRectangleOutlined />
      </Button>
    </Tooltip>
    {isXYChart(type) && <Tooltip title={translate('ZoomLabel')}>
      <Button
        size='sm'
        icon
        type='tertiary'
        aria-label={translate('ZoomLabel')}
        onClick={handleZoomClick}
        active={mode === 'zoom'}
      >
        <ZoomInOutlined />
      </Button>
    </Tooltip>}
  </div>
}
