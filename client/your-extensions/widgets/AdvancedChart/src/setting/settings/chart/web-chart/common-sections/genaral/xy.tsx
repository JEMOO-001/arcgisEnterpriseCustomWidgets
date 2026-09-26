import { React, type ImmutableObject, hooks } from 'jimu-core'
import { defaultMessages as jimuiDefaultMessage } from 'jimu-ui'
import { type WebChartLegend, type WebChartText } from 'jimu-ui/advanced/chart'
import { type ChartComponentProps, type IWebChart } from '../../../../../../config'
import defaultMessages from '../../../../../translations/default'
import { Title } from './components/title'
import { Orientation } from './components/orientation'
import { Legend } from './components/legend'
import { getCorrespondingAlignment } from '../../components'

interface XYGeneralSettingProps {
  rotatable?: boolean
  hideLegendForEmptySeriesVisibility?: boolean
  legendVisibility?: boolean
  legendValid?: boolean
  options?: ImmutableObject<ChartComponentProps>
  onOptionsChange?: (options: ImmutableObject<ChartComponentProps>) => void
  value: ImmutableObject<Partial<IWebChart>>
  onChange: (value: ImmutableObject<Partial<IWebChart>>) => void
}

export const XYGeneralSetting = (
  props: XYGeneralSettingProps
): React.ReactElement => {
  const {
    value,
    options: propOptions,
    rotatable = true,
    legendValid = false,
    legendVisibility = true,
    hideLegendForEmptySeriesVisibility,
    onChange,
    onOptionsChange
  } = props

  const title = value.title
  const footer = value.footer
  const legend = value.legend
  const rotated = value.rotated ?? false

  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)

  const handleTitleChange = (title: ImmutableObject<WebChartText>): void => {
    onChange?.(value.set('title', title))
  }

  const onFooterChange = (footer: ImmutableObject<WebChartText>): void => {
    onChange?.(value.set('footer', footer))
  }

  const handleLegendChange = (legend: ImmutableObject<WebChartLegend>): void => {
    onChange?.(value.set('legend', legend))
  }

  const handleRotatedChange = (rotated: boolean): void => {
    const horizontalAlignment = rotated ? 'right' : 'center'
    const verticalAlignment = rotated ? 'middle' : 'top'
    const series = value?.series.map(serie => serie.setIn(['dataLabels', 'content', 'horizontalAlignment'], horizontalAlignment)
      .setIn(['dataLabels', 'content', 'verticalAlignment'], verticalAlignment))

    let webChart = value.set('rotated', rotated).set('series', series)

    const axes = value?.axes?.map((axis) => {
      if (axis.valueFormat?.type === 'number') {
        const guides = axis?.guides?.map((guide) => {
          const verticalAlignment = getCorrespondingAlignment(guide.label.horizontalAlignment)
          const horizontalAlignment = getCorrespondingAlignment(guide.label.verticalAlignment)
          return guide.setIn(['label', 'horizontalAlignment'], horizontalAlignment)
            .setIn(['label', 'verticalAlignment'], verticalAlignment)
        })
        return axis.set('guides', guides)
      }
      return axis
    })

    webChart = webChart.set('axes', axes)
    onChange?.(webChart)
  }

  const handleHideEmptySeriesChange = (hideEmptySeriesInLegend?: boolean) => {
    const options = propOptions.set('hideEmptySeriesInLegend', hideEmptySeriesInLegend)
    onOptionsChange?.(options)
  }

  return (
    <div className='xy-general-setting w-100 mt-2' role='group' aria-label={translate('general')}>
      <Title
        type='input'
        value={title}
        label={translate('chartTitle')}
        onChange={handleTitleChange}
      />
      <Title
        type='area'
        value={footer}
        label={translate('description')}
        onChange={onFooterChange}
      />
      {rotatable && (
        <Orientation value={rotated} onChange={handleRotatedChange} />
      )}
      {legendVisibility && <Legend
        value={legend}
        hideLegendForEmptySeriesVisibility={hideLegendForEmptySeriesVisibility}
        hideEmptySeriesInLegend={propOptions?.hideEmptySeriesInLegend}
        onChange={handleLegendChange}
        onHideEmptySeriesChange={handleHideEmptySeriesChange}
        disabled={!legendValid}
      />}
    </div>
  )
}
