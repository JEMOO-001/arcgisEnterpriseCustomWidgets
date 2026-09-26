import { isSerialSeries } from '../../../utils/default'
import { type ChartTypes } from 'jimu-ui/advanced/chart'

/**
 * Convert the matching coded label into coded value
 */
export const matchCodedValueLabel = (data: { [key: string]: any }) => {
  const domainFieldName = data.arcgis_charts_type_domain_field_name
  if (typeof domainFieldName !== 'string') return data
  const domainFieldValue = data.arcgis_charts_type_domain_id_value
  if (data[domainFieldName] && domainFieldValue) {
    data.arcgis_charts_type_domain_id_label = data[domainFieldName]
    data[domainFieldName] = domainFieldValue
  }
  return data
}

const createRecordsFromChartData = (data = [], dataSource) => {
  const idField = dataSource.getIdField()
  const records = data?.map((item, i) => {
    const feature = { attributes: null }
    let data = { ...item }
    data[idField] = i
    data = matchCodedValueLabel(data)
    feature.attributes = data
    return dataSource.buildRecord(feature)
  })

  return records
}

export const getDataItems = (type: ChartTypes, detail) => {
  let dataItems = []
  if (isSerialSeries(type) || type === 'pieSeries' || type === 'scatterSeries' || type === 'gaugeSeries') {
    dataItems = detail?.dataItems
  } else if (type === 'histogramSeries') {
    dataItems = detail?.bins
  }
  return dataItems
}

export default createRecordsFromChartData
