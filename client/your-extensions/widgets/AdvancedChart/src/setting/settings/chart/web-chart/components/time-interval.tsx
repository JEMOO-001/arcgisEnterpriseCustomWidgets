import { React } from 'jimu-core'
import { WebChartTimeIntervalUnits } from 'jimu-ui/advanced/chart'
import { DateUnitInput, type DateUnitInputValue, UnitSelectorDateWeekUnits, UnitSelectorTimeUnits, type DateTimeUnits } from 'jimu-ui/advanced/style-setting-components'

interface TimeIntervalProps {
  className?: string
  'aria-label'?: string
  size: number
  unit: WebChartTimeIntervalUnits
  onChange: (size: number, unit: WebChartTimeIntervalUnits) => void
}

export const DateTimeUnitsMap = {
  [UnitSelectorDateWeekUnits[0]]: WebChartTimeIntervalUnits.Years,
  [UnitSelectorDateWeekUnits[1]]: WebChartTimeIntervalUnits.Months,
  [UnitSelectorDateWeekUnits[2]]: WebChartTimeIntervalUnits.Weeks,
  [UnitSelectorDateWeekUnits[3]]: WebChartTimeIntervalUnits.Days,
  [UnitSelectorTimeUnits[0]]: WebChartTimeIntervalUnits.Hours,
  [UnitSelectorTimeUnits[1]]: WebChartTimeIntervalUnits.Minutes,
  [UnitSelectorTimeUnits[2]]: WebChartTimeIntervalUnits.Seconds,
  [WebChartTimeIntervalUnits.Seconds]: UnitSelectorTimeUnits[2],
  [WebChartTimeIntervalUnits.Minutes]: UnitSelectorTimeUnits[1],
  [WebChartTimeIntervalUnits.Hours]: UnitSelectorTimeUnits[0],
  [WebChartTimeIntervalUnits.Days]: UnitSelectorDateWeekUnits[3],
  [WebChartTimeIntervalUnits.Weeks]: UnitSelectorDateWeekUnits[2],
  [WebChartTimeIntervalUnits.Months]: UnitSelectorDateWeekUnits[1],
  [WebChartTimeIntervalUnits.Years]: UnitSelectorDateWeekUnits[0]
}

const Units = [...UnitSelectorDateWeekUnits, ...UnitSelectorTimeUnits]

export const TimeInterval = (props: TimeIntervalProps): React.ReactElement => {
  const { className, 'aria-label': ariaLabel, size, unit, onChange } = props

  const value: DateUnitInputValue = React.useMemo(() => {
    return {
      val: size,
      unit: DateTimeUnitsMap[unit] as DateTimeUnits
    }
  }, [size, unit])

  const handleChange = (value: DateUnitInputValue) => {
    const size = value.val
    const unit = DateTimeUnitsMap[value.unit] as WebChartTimeIntervalUnits
    onChange(size, unit)
  }

  return (
    <DateUnitInput aria-label={ariaLabel} className={className} units={Units} value={value} onChange={handleChange} />
  )
}
