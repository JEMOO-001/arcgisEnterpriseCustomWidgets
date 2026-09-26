import createRecordsFromChartData, {
  matchCodedValueLabel
} from '../../src/runtime/chart/feature-layer-chart/convert-chart-data-to-records'

jest.mock('@arcgis/charts-components', () => {
  return {
    setAssetPath: jest.fn()
  }
})

describe('src/runtime/chart/feature-layer-chart/convert-chart-data-to-records', () => {
  it('matchCodedValueLabel', () => {
    let dataItem: { [key: string]: any } = {
      OBJECTID_count: 2,
      MISMATCH: 'matching fields one'
    }
    expect(matchCodedValueLabel(dataItem)).toEqual({
      OBJECTID_count: 2,
      MISMATCH: 'matching fields one'
    })
    dataItem = {
      OBJECTID_count: 2,
      MISMATCH: 'matching fields one',
      arcgis_charts_type_domain_field_name: 'MISMATCH',
      arcgis_charts_type_domain_id_value: 'one'
    }
    expect(matchCodedValueLabel(dataItem)).toEqual({
      OBJECTID_count: 2,
      MISMATCH: 'one',
      arcgis_charts_type_domain_field_name: 'MISMATCH',
      arcgis_charts_type_domain_id_value: 'one',
      arcgis_charts_type_domain_id_label: 'matching fields one'
    })
  })
  it('createRecordsFromChartData', () => {
    const dataSource = {
      getIdField: () => 'objectid',
      buildRecord: (feature) => feature.attributes
    }

    let dataItems: Array<{ [key: string]: any }> = [
      {
        OBJECTID_count: 2,
        MISMATCH: 'matching fields one'
      },
      {
        OBJECTID_count: 1,
        MISMATCH: 'matching fields three'
      },
      {
        OBJECTID_count: 1,
        MISMATCH: 'matching fields two'
      }
    ]

    expect(createRecordsFromChartData(dataItems, dataSource)).toEqual([
      {
        objectid: 0,
        OBJECTID_count: 2,
        MISMATCH: 'matching fields one'
      },
      {
        objectid: 1,
        OBJECTID_count: 1,
        MISMATCH: 'matching fields three'
      },
      {
        objectid: 2,
        OBJECTID_count: 1,
        MISMATCH: 'matching fields two'
      }
    ])

    dataItems = [
      {
        OBJECTID_count: 2,
        MISMATCH: 'matching fields one',
        arcgis_charts_type_domain_field_name: 'MISMATCH',
        arcgis_charts_type_domain_id_value: 'one'
      },
      {
        OBJECTID_count: 1,
        MISMATCH: 'matching fields three',
        arcgis_charts_type_domain_field_name: 'MISMATCH',
        arcgis_charts_type_domain_id_value: 'three'
      },
      {
        OBJECTID_count: 1,
        MISMATCH: 'matching fields two',
        arcgis_charts_type_domain_field_name: 'MISMATCH',
        arcgis_charts_type_domain_id_value: 'two'
      }
    ]
    expect(createRecordsFromChartData(dataItems, dataSource)).toEqual([
      {
        objectid: 0,
        OBJECTID_count: 2,
        MISMATCH: 'one',
        arcgis_charts_type_domain_field_name: 'MISMATCH',
        arcgis_charts_type_domain_id_value: 'one',
        arcgis_charts_type_domain_id_label: 'matching fields one'
      },
      {
        objectid: 1,
        OBJECTID_count: 1,
        MISMATCH: 'three',
        arcgis_charts_type_domain_field_name: 'MISMATCH',
        arcgis_charts_type_domain_id_value: 'three',
        arcgis_charts_type_domain_id_label: 'matching fields three'
      },
      {
        objectid: 2,
        OBJECTID_count: 1,
        MISMATCH: 'two',
        arcgis_charts_type_domain_field_name: 'MISMATCH',
        arcgis_charts_type_domain_id_value: 'two',
        arcgis_charts_type_domain_id_label: 'matching fields two'
      }
    ])
  })
})
