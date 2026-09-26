import { React, type ImmutableObject, type ImmutableArray, Immutable, DataSourceManager, type UseDataSource, type QueriableDataSource, hooks } from 'jimu-core'
import { SettingOutlined } from 'jimu-icons/outlined/application/setting'
import { Button, Label, Radio } from 'jimu-ui'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { ThemeColorPicker } from 'jimu-ui/basic/color-picker'
import defaultMessages from '../../../../../../translations/default'
import { type WebChartPieChartSeries, type WebChartPieChartSlice } from 'jimu-ui/advanced/chart'
import { CategoryType, type ChartDataSource, type WebChartSeries } from '../../../../../../../config'
import { DefaultColorBySlicesOtherColor, getFillSymbol, getSeriesFillColor, SeriesColors } from '../../../../../../../utils/default'
import { convertStripColors, getByFieldPieSlices, useLoadingPieSlices } from './utils'
import { ColorList } from './color-list'
import { getTheme2 } from 'jimu-theme'
import { MaxColorCount } from '../../../../../../../constants'
import { type ISimpleFillSymbol } from '@esri/arcgis-rest-types'
import { getCategoryFieldType, getCategoryType } from '../../../../../../../utils/common'
import { COLORS_SET } from '../components'

interface ColorTypeProps {
  useFeatureLayerDataSource?: boolean
  useDataSources: ImmutableArray<UseDataSource>
  chartDataSource: ImmutableObject<ChartDataSource>
  series: ImmutableArray<WebChartSeries>
  onChange?: (series: ImmutableArray<WebChartSeries>) => void
}

const defaultFillColor = getSeriesFillColor(0)
const presetSeriesColors = convertStripColors(SeriesColors)

const defaultFillSymbol = Immutable(
  getFillSymbol(defaultFillColor, 1, 'var(--light-100)')
)

const totalNumberLimit = 50
export const ColorType = (props: ColorTypeProps): React.ReactElement => {
  const {
    useFeatureLayerDataSource = false,
    series: propSeries,
    chartDataSource,
    useDataSources,
    onChange
  } = props
  const appTheme = getTheme2()
  const unmountRef = React.useRef<boolean>(false)
  hooks.useUnmount(() => { unmountRef.current = true })
  const translate = hooks.useTranslation(defaultMessages)

  const colorMatchBtnRef = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)
  const [colors, setColors] = React.useState(COLORS_SET[0])
  const dataSourceId = useDataSources?.[0]?.dataSourceId
  const dataSource = React.useMemo(() => DataSourceManager.getInstance().getDataSource(dataSourceId) as QueriableDataSource, [dataSourceId])

  const propSerie = propSeries?.[0] as ImmutableObject<WebChartPieChartSeries>
  const propSlices = propSerie?.slices
  const query = chartDataSource?.query
  const categoryType = getCategoryType(query)
  const categoryFieldType = getCategoryFieldType(query, dataSourceId)

  const numericFields = query?.outStatistics
    ?.map((outStatistic) => outStatistic.onStatisticField)
    .filter((field) => !!field)

  const [loadSlices, loading] = useLoadingPieSlices(dataSource, query, propSlices, colors, totalNumberLimit, useFeatureLayerDataSource)

  const colorMode = propSerie?.slices?.length ? 'bySlices' : 'singleColor'
  const fillSymbol = propSerie?.fillSymbol
  const outline = fillSymbol?.outline
  const singleColor = fillSymbol?.color as any

  const handleSingleColorChange = (value: string) => {
    value = value || defaultFillColor
    const series = Immutable.setIn(
      propSeries,
      ['0', 'fillSymbol', 'color'],
      value
    )
    onChange?.(series)
  }

  const handleColorTypeChange = async (type: 'singleColor' | 'bySlices') => {
    let series = propSeries
    if (type === 'singleColor') {
      series = Immutable.setIn(
        series,
        ['0', 'fillSymbol'],
        fillSymbol.set('color', defaultFillColor)
      )
      series = series.map(serie => (serie as ImmutableObject<WebChartPieChartSeries>).without('slices') as any)
      onChange?.(series)
    } else if (type === 'bySlices') {
      if (categoryType === CategoryType.ByGroup) {
        series = Immutable.setIn(
          series,
          ['0', 'fillSymbol'],
          fillSymbol.set('color', DefaultColorBySlicesOtherColor)
        )
        loadSlices(MaxColorCount, outline).then(({ value: slices }) => {
          if (unmountRef.current) return
          series = Immutable.setIn(series, ['0', 'slices'], slices)
          onChange?.(series)
        })
      } else if (categoryType === CategoryType.ByField) {
        const slices = getByFieldPieSlices(numericFields, COLORS_SET[0], outline)
        series = Immutable.setIn(
          series,
          ['0', 'fillSymbol'],
          defaultFillSymbol.set('color', DefaultColorBySlicesOtherColor)
        )
        series = Immutable.setIn(series, ['0', 'slices'], slices)
        onChange?.(series)
      }
    }
  }

  const handleSlicesChange = (slices: ImmutableArray<WebChartPieChartSlice>) => {
    const series = Immutable.setIn(propSeries, ['0', 'slices'], slices)
    onChange?.(series)
  }

  const handleOtherChange = (
    fillSymbol: ImmutableObject<ISimpleFillSymbol>
  ) => {
    const series = Immutable.setIn(propSeries, ['0', 'fillSymbol'], fillSymbol)
    onChange?.(series)
  }

  return (
    <>
      <SettingRow label={translate('themeSettingColorMode')} flow='wrap' level={2}>
        <div role='radiogroup' className='w-100' aria-label={translate('themeSettingColorMode')}>
          <div className='d-flex align-items-center justify-content-between'>
            <Label
              title={translate('singleColor')}
              className='d-flex align-items-center text-truncate'
              style={{ width: '60%' }}
            >
              <Radio
                name='color-mode'
                aria-label={translate('singleColor')}
                className='mr-2'
                checked={colorMode === 'singleColor'}
                onChange={() => handleColorTypeChange('singleColor')}
              />
              {translate('singleColor')}
            </Label>
            {colorMode === 'singleColor' && (
              <ThemeColorPicker
                specificTheme={appTheme}
                aria-label={translate('singleColor')}
                presetColors={presetSeriesColors}
                value={singleColor}
                onChange={handleSingleColorChange}
              />
            )}
          </div>
          <div className='d-flex align-items-center justify-content-between'>
            <Label
              title={translate('byCategory')}
              className='d-flex align-items-center text-truncate'
              style={{ width: '60%' }}
            >
              <Radio
                name='color-mode'
                className='mr-2'
                aria-label={translate('byCategory')}
                checked={colorMode === 'bySlices'}
                onChange={() => handleColorTypeChange('bySlices')}
              />
              {translate('byCategory')}
            </Label>
            {colorMode === 'bySlices' && (
              <Button
                ref={colorMatchBtnRef}
                type='tertiary'
                active={open}
                icon
                size='sm'
                aria-label={translate('byCategory')}
                onClick={() => { setOpen(!open) }}
              >
                <SettingOutlined />
              </Button>
            )}
          </div>
        </div>
      </SettingRow>
      <ColorList
        open={open}
        trigger={colorMatchBtnRef.current}
        onRequestClose={() => { setOpen(false) }}
        categoryType={categoryType}
        useFeatureLayerDataSource={useFeatureLayerDataSource}
        categoryFieldType={categoryFieldType}
        loadSlices={loadSlices}
        loading={loading}
        value={propSlices}
        other={fillSymbol}
        colors={colors}
        onColorsChange={setColors}
        onChange={handleSlicesChange}
        onOtherChange={handleOtherChange} />
    </>
  )
}
