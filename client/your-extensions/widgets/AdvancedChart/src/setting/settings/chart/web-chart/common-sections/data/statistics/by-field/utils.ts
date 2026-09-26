import { type WebChartSeries } from '../../../../../../../../config'
import { Immutable, type ImmutableArray } from 'jimu-core'
import { type SelectedOption } from '../../../../../../../../utils/common'

export const getByFieldOrderFields = (series: ImmutableArray<WebChartSeries>, translate): ImmutableArray<SelectedOption> => {
  const categoryField = series?.[0]?.x
  const serieY = (series?.[0] as any)?.y
  let fields: ImmutableArray<SelectedOption> = Immutable([])
  const xAxisLabel = translate('categoryAxis')
  const yAxisLabel = translate('valueAxis')

  fields = fields.concat(
    [{
      name: xAxisLabel,
      value: categoryField
    },
    {
      name: yAxisLabel,
      value: serieY
    }]
  )

  return fields
}
