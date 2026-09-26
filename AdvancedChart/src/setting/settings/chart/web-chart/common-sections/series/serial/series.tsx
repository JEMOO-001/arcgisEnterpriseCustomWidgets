import { React, type ImmutableArray, classNames, type ImmutableObject, Immutable, hooks, type IMFeatureLayerQueryParams, type UseDataSource } from 'jimu-core'
import { AnchoredSidePanel } from '../../../../../components'
import { getSeriesFillColor } from '../../../../../../../utils/default'
import { type WebChartSeries } from '../../../../../../../config'
import defaultMessages from '../../../../../../translations/default'
import { SeriesItem } from './series-item'
import SplitBySeries from './split-by-series'

interface SeriesSettingProps {
  className?: string
  series: ImmutableArray<WebChartSeries>
  query?: IMFeatureLayerQueryParams
  useDataSources?: ImmutableArray<UseDataSource>
  onChange?: (series: ImmutableArray<WebChartSeries>) => void
}

const NormalSeries = (props: SeriesSettingProps): React.ReactElement => {
  const { className, series: propSeries, onChange } = props

  const [serieIndex, setSerieIndex] = React.useState<number>(-1)
  const handleClick = (index: number): void => {
    setSerieIndex(index)
  }

  const handleChange = (serie: ImmutableObject<WebChartSeries>): void => {
    const series = Immutable.set(propSeries, serieIndex, serie)
    onChange?.(series)
  }

  return (<div className={classNames('serial-series-setting-series', className)} style={{ maxHeight: 340, overflowY: 'auto' }}>
    {propSeries?.map((serie, index) => {
      const defaultFillColor = getSeriesFillColor(index)
      return (
        <SeriesItem
          className={classNames({ 'mt-2': index !== 0 }, 'pr-1')}
          key={index}
          isOpen={serieIndex === index}
          value={serie}
          onChange={handleChange}
          defaultColor={defaultFillColor}
          onRequestOpen={() => { handleClick(index) }}
          onRequestClose={() => { handleClick(-1) }}
        />
      )
    }
    )}
  </div>)
}

const SeriesSetting = (props: SeriesSettingProps): React.ReactElement => {
  const { useDataSources, query, className, series, onChange } = props

  const useSplitBy = !!series?.[0]?.query?.where
  const translate = hooks.useTranslation(defaultMessages)

  return (<div className={classNames('serial-series-setting', className)}>
    {
      !useSplitBy && <NormalSeries className='mt-4' series={series} onChange={onChange} />
    }
    {
      useSplitBy && <AnchoredSidePanel
        level={1}
        label={translate('seriesFormat')}
        title={translate('seriesFormat')}
      >
        <SplitBySeries useDataSources={useDataSources} query={query} series={series} onChange={onChange} />
      </AnchoredSidePanel>
    }
  </div>)
}

export default SeriesSetting
