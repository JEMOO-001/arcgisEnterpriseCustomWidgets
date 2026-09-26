import { type IMFeatureLayerQueryParams, type ImmutableObject } from 'jimu-core'
import { type NumberFormatOptions, type DateTimeFormatOptions, type CategoryFormatOptions } from 'jimu-ui/advanced/chart'
import { type ChartDataSource } from '../../../../../../../config'

export interface SeriesRelatedProps {
  chartDataSource: ImmutableObject<ChartDataSource>
  query?: IMFeatureLayerQueryParams
  valueFormat?: NumberFormatOptions | DateTimeFormatOptions | CategoryFormatOptions
}
