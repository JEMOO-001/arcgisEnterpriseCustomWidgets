import { React, type ImmutableArray, type ImmutableObject, Immutable, hooks } from 'jimu-core'
import { defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { type WebChartAxis } from 'jimu-ui/advanced/chart'
import defaultMessages from '../../../../../translations/default'
import { SettingCollapse } from '../../../../components'
import { CategoryAxis } from './category-axis'
import { DateAxis } from './date-axis'
import { NumericAxis } from './numeric-aixs'

export interface AxesSettingProps {
  rotated: boolean
  showLogarithmicScale?: boolean
  showFirstValueRange?: boolean
  showFirstIntegerOnly?: boolean
  axes: ImmutableArray<WebChartAxis>
  onChange?: (axes: ImmutableArray<WebChartAxis>) => void
}

export const AxesSetting = (props: AxesSettingProps): React.ReactElement => {
  const { showLogarithmicScale, showFirstValueRange = true, showFirstIntegerOnly = true, axes: propAxes, onChange, rotated } = props
  const [axisIndex, setAxisIndex] = React.useState<number>(-1)
  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)

  const handleClick = (index: number): void => {
    setAxisIndex(index)
  }

  const handleChange = (axis: ImmutableObject<WebChartAxis>): void => {
    onChange?.(Immutable.set(propAxes, axisIndex, axis))
  }

  return (
    <div className='auto-axes-setting w-100' role='group' aria-label={translate('axes')}>
      {propAxes?.map((axis, index) => {
        const type = axis.valueFormat.type
        const name = index === 0 ? 'xAxis' : 'yAxis'
        const isHorizontal = (name === 'xAxis' && !rotated) || (name === 'yAxis' && rotated)

        return (
          <SettingCollapse
            level={1}
            className='mt-2'
            key={index}
            bottomLine={index === 0}
            label={translate(name)}
            aria-label={translate(name)}
            role='group'
            isOpen={axisIndex === index}
            onRequestOpen={() => { handleClick(index) }}
            onRequestClose={() => { handleClick(-1) }}
          >
            {
              type === 'category' && (
                <CategoryAxis className='mt-4' isHorizontal={isHorizontal} axis={axis} onChange={handleChange} />
              )
            }
            {
              type === 'number' && (
                <NumericAxis className='mt-4' showValueRange={index === 0 ? showFirstValueRange : true} showIntegerOnly={index === 0 ? showFirstIntegerOnly : true} showLogarithmicScale={showLogarithmicScale} isHorizontal={isHorizontal} axis={axis} onChange={handleChange} />
              )
            }
            {
              type === 'date' && (
                <DateAxis className='mt-4' axis={axis} onChange={handleChange} />
              )
            }
          </SettingCollapse>
        )
      })}
    </div>
  )
}

export { default as Guides } from './guide'
