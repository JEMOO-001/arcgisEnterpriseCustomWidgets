import { type FeatureLayerQueryParams, type ImmutableArray, type ImmutableObject } from 'jimu-core'
import { type WebChartAxis, type WebChartGaugeAxis, getSeriesType } from 'jimu-ui/advanced/chart'
import { type WebChartSeries } from '../../../config'

const normalizeAxes = (
  series: ImmutableArray<WebChartSeries>,
  axes: ImmutableArray<WebChartGaugeAxis> | ImmutableArray<WebChartAxis>,
  query: ImmutableObject<FeatureLayerQueryParams>
): ImmutableArray<WebChartGaugeAxis> | ImmutableArray<WebChartAxis> => {
  const type = getSeriesType(series as any)

  if (type === 'gaugeSeries') {
    const minimumStatistic = query?.outStatistics?.[1]
    const maximumStatistic = query?.outStatistics?.[2]
    if (minimumStatistic || maximumStatistic) {
      return axes?.map((propAxis: ImmutableObject<WebChartGaugeAxis>) => {
        let axis = propAxis
        if (minimumStatistic) {
          axis = axis.set('minimumFromField', minimumStatistic)
        }
        if (maximumStatistic) {
          axis = axis.set('maximumFromField', maximumStatistic)
        }
        return axis as unknown as WebChartGaugeAxis
      })
    }
  }

  if (axes && (Array.isArray(axes) || (axes as any)?._isImmutable)) {
    let modified = false
    const normalized = (axes as any).map((propAxis: any, idx: number) => {
      if (!propAxis) return propAxis
      const isValueAxis = propAxis.valueFormat?.type === 'number' || idx === 1
      if (isValueAxis) {
        const titleVisible = propAxis.title?.visible
        const text = propAxis.title?.content?.text?.trim()
        if (!titleVisible || !text) {
          modified = true
          let updated = propAxis
          const defaultTitle = {
            type: 'chartText',
            visible: true,
            content: {
              type: 'esriTS',
              color: 'var(--dark-800)',
              font: {
                family: 'Avenir Next',
                size: 14,
                style: 'normal',
                weight: 'normal',
                decoration: 'none'
              },
              horizontalAlignment: 'center',
              verticalAlignment: 'middle',
              angle: 270,
              text: 'المساحة (بالفدان)'
            }
          }
          if (!updated.title) {
            updated = typeof updated.set === 'function' ? updated.set('title', defaultTitle) : { ...updated, title: defaultTitle }
          } else {
            if (typeof updated.setIn === 'function') {
              updated = updated
                .setIn(['title', 'visible'], true)
                .setIn(['title', 'content', 'text'], text || 'المساحة (بالفدان)')
                .setIn(['title', 'content', 'verticalAlignment'], 'middle')
                .setIn(['title', 'content', 'angle'], 270)
            } else {
              updated = {
                ...updated,
                title: {
                  ...updated.title,
                  type: 'chartText',
                  visible: true,
                  content: {
                    ...(updated.title.content || {}),
                    type: 'esriTS',
                    verticalAlignment: 'middle',
                    angle: 270,
                    text: text || 'المساحة (بالفدان)'
                  }
                }
              }
            }
          }
          return updated
        }
      }
      return propAxis
    })
    if (modified) {
      return normalized
    }
  }

  return axes
}

export default normalizeAxes
