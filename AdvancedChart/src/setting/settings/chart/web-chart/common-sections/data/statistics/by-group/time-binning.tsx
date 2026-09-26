import { React, classNames, hooks } from 'jimu-core'
import { Loading, Select, Switch, defaultMessages as jimuMessages } from 'jimu-ui'
import { WebChartNullPolicyTypes, WebChartTimeAggregationTypes, type WebChartTimeIntervalUnits } from 'jimu-ui/advanced/chart'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { TimeInterval } from '../../../../components'
import defaultMessages from '../../../../../../../translations/default'

interface Props {
  className?: string
  loading?: boolean
  timeIntervalSize: number
  timeIntervalUnits: WebChartTimeIntervalUnits
  onTimeIntervalChange: (size: number, unit: WebChartTimeIntervalUnits) => void
  nullPolicy: WebChartNullPolicyTypes
  onNullPolicyChange: (nullPolicy: WebChartNullPolicyTypes) => void
  timeAggregationType: WebChartTimeAggregationTypes
  onTimeAggregationTypeChange: (aggregationType: WebChartTimeAggregationTypes) => void
  trimIncompleteTimeInterval: boolean
  onTrimIncompleteTimeIntervalChange: (trimIncompleteTimeInterval: boolean) => void
}

const WebChartNullPolicyTypesTranslation = {
  [WebChartNullPolicyTypes.Null]: 'breakLine',
  [WebChartNullPolicyTypes.Interpolate]: 'connectLine',
  [WebChartNullPolicyTypes.Zero]: 'treatAsZero'
}

const WebChartTimeAggregationTypesTranslation = {
  [WebChartTimeAggregationTypes.Start]: 'snapToTheFirstDataPoint',
  [WebChartTimeAggregationTypes.End]: 'snapToTheLastDataPoint'
}

export const TimeBinning = (props: Props): React.ReactElement => {
  const {
    className,
    loading = false,
    timeIntervalUnits,
    timeIntervalSize,
    nullPolicy = WebChartNullPolicyTypes.Null,
    timeAggregationType = WebChartTimeAggregationTypes.Start,
    trimIncompleteTimeInterval = true,
    onTimeIntervalChange,
    onNullPolicyChange,
    onTimeAggregationTypeChange,
    onTrimIncompleteTimeIntervalChange
  } = props

  const translate = hooks.useTranslation(defaultMessages, jimuMessages)

  const handleNullPolicyChange = (evt: React.MouseEvent<HTMLSelectElement>): void => {
    const value = evt.currentTarget.value as WebChartNullPolicyTypes
    onNullPolicyChange?.(value)
  }

  const handleTimeAggregationTypeChange = (evt: React.MouseEvent<HTMLSelectElement>): void => {
    const value = evt.currentTarget.value as WebChartTimeAggregationTypes
    onTimeAggregationTypeChange?.(value)
  }

  const handleTrimIncompleteTimeIntervalChange = (_, checked: boolean) => {
    onTrimIncompleteTimeIntervalChange?.(checked)
  }

  return (<div className={classNames('time-binning', className)} style={{ position: 'relative' }}>
    <SettingRow label={translate('interval')} flow='wrap' className='mt-2'>
      <TimeInterval aria-label={translate('interval')} size={timeIntervalSize} unit={timeIntervalUnits} onChange={onTimeIntervalChange} />
    </SettingRow>
    <SettingRow label={translate('intervalAlignment')} flow='wrap' className='mt-2'>
      <Select
        size='sm'
        aria-label={translate('intervalAlignment')}
        value={timeAggregationType}
        onChange={handleTimeAggregationTypeChange}
      >
        {Object.keys(WebChartTimeAggregationTypes).map((key, i) => (
          <option value={WebChartTimeAggregationTypes[key]} key={i} className='text-truncate'>
            {translate(WebChartTimeAggregationTypesTranslation[WebChartTimeAggregationTypes[key]])}
          </option>
        ))}
      </Select>
    </SettingRow>
    <SettingRow label={translate('emptyBins')} flow='no-wrap' className='mt-4'>
      <Select
        size='sm'
        aria-label={translate('emptyBins')}
        className='w-50'
        value={nullPolicy}
        onChange={handleNullPolicyChange}
      >
        {Object.keys(WebChartNullPolicyTypes).map((nullPolicy, i) => (
          <option value={WebChartNullPolicyTypes[nullPolicy]} key={i} className='text-truncate'>
            {translate(WebChartNullPolicyTypesTranslation[WebChartNullPolicyTypes[nullPolicy]])}
          </option>
        ))}
      </Select>
    </SettingRow>
    <SettingRow label={translate('trimIncompletegInterval')} flow='no-wrap' className='mt-4'>
      <Switch aria-label={translate('trimIncompletegInterval')} checked={trimIncompleteTimeInterval} onChange={handleTrimIncompleteTimeIntervalChange} />
    </SettingRow>
    { loading && <Loading type='DONUT' />}
  </div>)
}
