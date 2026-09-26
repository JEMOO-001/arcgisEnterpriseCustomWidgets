jest.mock('jimu-arcgis', () => ({
  MapViewManager: {
    getInstance: () => ({
      getAllJimuMapViewGroups: () => ({}),
      getJimuMapViews: () => ({})
    })
  },
  zoomToUtils: {
    zoomTo: jest.fn().mockResolvedValue(true)
  },
  loadArcGISJSAPIModules: jest.fn().mockResolvedValue([
    class MockExtent {
      xmin: number; ymin: number; xmax: number; ymax: number; spatialReference: any;
      constructor(opts: any) { Object.assign(this, opts) }
      expand() { return this }
    },
    class MockGraphic {},
    {}
  ])
}), { virtual: true })

import {
  isFieldFilteredToSingleValue,
  extractSingleFilterValue,
  formatDynamicChartTitle,
  getConfiguredPeopleCount,
  findAirportNameInAttributes,
  lookupDomainName,
  formatArabicArea,
  formatArabicParcelCount,
  resolvePersonDetails,
  buildArabicTooltipHTML,
  escapeHtml
} from '../../src/runtime/chart/RechartContainer'
import normalizeAxes from '../../src/runtime/chart/utils/normalize-axes'

describe('isFieldFilteredToSingleValue', () => {
  const targetField = 'AirportName'

  describe('Startup, empty, and layer-wide filters (must return false - Original Chart)', () => {
    it('returns false for undefined, null, or empty string', () => {
      expect(isFieldFilteredToSingleValue(undefined, targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('   ', targetField)).toBe(false)
    })

    it('returns false for tautology (1=1)', () => {
      expect(isFieldFilteredToSingleValue('1=1', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('1 = 1', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('(1=1)', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('( 1 = 1 )', targetField)).toBe(false)
    })

    it('returns false when where clause only contains layer definition filters on other fields (prevents startup false positive)', () => {
      expect(isFieldFilteredToSingleValue('Year = 2024', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('1=1 AND (Year = 2024)', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('Archive = 0', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue("Status = 'Active'", targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('OBJECTID > 0', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('ParcelStatus = 1', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('((ParcelStatus = 1))', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('1=1 AND ((ParcelStatus = 1))', targetField)).toBe(false)
    })

    it('returns false for self comparisons or is not null', () => {
      expect(isFieldFilteredToSingleValue('AirportName = AirportName', targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('AirportName IS NOT NULL', targetField)).toBe(false)
    })
  })

  describe('Multi-value filters (must return false - Original Chart)', () => {
    it('returns false for IN clause with multiple items', () => {
      expect(isFieldFilteredToSingleValue("AirportName IN ('Cairo', 'Alexandria')", targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue("AirportName IN (N'مطار القاهرة', N'مطار برج العرب')", targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue('AirportName IN (1, 2, 3)', targetField)).toBe(false)
    })

    it('returns false for OR clauses with multiple values', () => {
      expect(isFieldFilteredToSingleValue("AirportName = 'Cairo' OR AirportName = 'Alexandria'", targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue("(AirportName = 'Cairo') OR (AirportName = 'Alexandria')", targetField)).toBe(false)
      expect(isFieldFilteredToSingleValue("1=1 AND (AirportName = 'Cairo' OR AirportName = 'Alexandria')", targetField)).toBe(false)
    })
  })

  describe('Single-value filters (must return true - Rechart Configuration)', () => {
    it('returns true for simple equality', () => {
      expect(isFieldFilteredToSingleValue("AirportName = 'Cairo'", targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue("AirportName='Cairo'", targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue('"AirportName" = \'Cairo\'', targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue('[AirportName] = \'Cairo\'', targetField)).toBe(true)
    })

    it('returns true for Arabic Unicode strings with N prefix', () => {
      expect(isFieldFilteredToSingleValue("AirportName = N'مطار القاهرة الدولي'", targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue("AirportName = 'مطار القاهرة الدولي'", targetField)).toBe(true)
    })

    it('returns true when combined with layer-wide AND conditions', () => {
      expect(isFieldFilteredToSingleValue("Year = 2024 AND AirportName = 'Cairo'", targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue("1=1 AND (Year = 2024) AND (AirportName = N'مطار القاهرة الدولي')", targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue("(Archive = 0) AND (AirportName = 'Cairo')", targetField)).toBe(true)
    })

    it('returns true for single item IN clause', () => {
      expect(isFieldFilteredToSingleValue("AirportName IN ('Cairo')", targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue("AirportName IN (N'مطار القاهرة الدولي')", targetField)).toBe(true)
      expect(isFieldFilteredToSingleValue('AirportName IN (123)', targetField)).toBe(true)
    })

    it('returns true for numeric field equality', () => {
      expect(isFieldFilteredToSingleValue('AirportCode = 12', 'AirportCode')).toBe(true)
    })
  })

  describe('zoomMapToRecords and extractExtentFromRecords', () => {
    it('handles empty, null, or undefined records gracefully without throwing', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { zoomMapToRecords } = require('../../src/runtime/chart/utils/use-selection')
      expect(() => zoomMapToRecords([])).not.toThrow()
      expect(() => zoomMapToRecords(null)).not.toThrow()
      expect(() => zoomMapToRecords(undefined)).not.toThrow()
    })

    it('safely filters records without geometries', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { zoomMapToRecords } = require('../../src/runtime/chart/utils/use-selection')
      const dummyRecords = [
        { getId: () => '1', feature: null },
        { getId: () => '2', getData: () => ({ name: 'test' }) }
      ]
      expect(() => zoomMapToRecords(dummyRecords)).not.toThrow()
    })

    it('extracts correct bounding box and extent from polygon rings', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { extractExtentFromRecords } = require('../../src/runtime/chart/utils/use-selection')
      const dummyPolygonRecord = {
        getId: () => 'parcel-101',
        feature: {
          geometry: {
            type: 'polygon',
            rings: [
              [[10, 20], [30, 20], [30, 40], [10, 40], [10, 20]]
            ],
            spatialReference: { wkid: 102100 }
          }
        }
      }
      const result = extractExtentFromRecords([dummyPolygonRecord])
      expect(result.extent).toEqual({
        xmin: 10,
        ymin: 20,
        xmax: 30,
        ymax: 40,
        spatialReference: { wkid: 102100 }
      })
      expect(result.isPoint).toBe(false)
    })

    it('extracts correct coordinates and detects point geometry', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { extractExtentFromRecords } = require('../../src/runtime/chart/utils/use-selection')
      const dummyPointRecord = {
        getId: () => 'parcel-102',
        getGeometry: () => ({
          type: 'point',
          x: 500,
          y: 600,
          spatialReference: { wkid: 4326 }
        })
      }
      const result = extractExtentFromRecords([dummyPointRecord])
      expect(result.extent).toEqual({
        xmin: 500,
        ymin: 600,
        xmax: 500,
        ymax: 600,
        spatialReference: { wkid: 4326 }
      })
      expect(result.isPoint).toBe(true)
    })

    it('calls view.goTo with smooth animation and scale for active map views and opens popup', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MapViewManager } = require('jimu-arcgis')
      const mockGoTo = jest.fn().mockResolvedValue(true)
      const mockPopupOpen = jest.fn()
      const mockActiveView = {
        view: {
          goTo: mockGoTo,
          spatialReference: { wkid: 102100 },
          popup: { open: mockPopupOpen }
        }
      }
      jest.spyOn(MapViewManager, 'getInstance').mockReturnValue({
        getAllJimuMapViews: () => [mockActiveView],
        jimuMapViewGroups: {}
      })

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { zoomMapToRecords } = require('../../src/runtime/chart/utils/use-selection')
      const dummyRecord = {
        getId: () => 'parcel-99',
        feature: {
          attributes: { Client: 'أحمد علي', ParcelID: 'P-123' },
          geometry: {
            rings: [[[100, 200], [300, 200], [300, 400], [100, 400], [100, 200]]],
            spatialReference: { wkid: 102100 }
          }
        }
      }

      await zoomMapToRecords([dummyRecord], 'Client')
      expect(mockGoTo).toHaveBeenCalledTimes(1)
      const [target, options] = mockGoTo.mock.calls[0]
      expect(options).toEqual(expect.objectContaining({ duration: 1200 }))
      expect(target).toBeDefined()
      expect(mockPopupOpen).toHaveBeenCalledTimes(1)
      expect(mockPopupOpen.mock.calls[0][0].features).toBeDefined()
    })

    it('removes previous highlight handle and closes previous popup when a new parcel is clicked', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MapViewManager } = require('jimu-arcgis')
      const mockRemoveHandle1 = jest.fn()
      const mockRemoveHandle2 = jest.fn()
      let highlightCount = 0

      const mockHighlight = jest.fn().mockImplementation(() => {
        highlightCount++
        return highlightCount === 1
          ? { remove: mockRemoveHandle1 }
          : { remove: mockRemoveHandle2 }
      })

      const mockPopupClose = jest.fn()
      const mockPopupOpen = jest.fn()

      const mockLayerView = {
        highlight: mockHighlight
      }

      const mockMatchingLayer = {
        type: 'feature',
        popupTemplate: { title: 'Test' }
      }

      const mockActiveView = {
        view: {
          goTo: jest.fn().mockResolvedValue(true),
          spatialReference: { wkid: 102100 },
          popup: { open: mockPopupOpen, close: mockPopupClose },
          graphics: { addMany: jest.fn(), removeMany: jest.fn() },
          map: { layers: [mockMatchingLayer] },
          whenLayerView: jest.fn().mockResolvedValue(mockLayerView)
        }
      }

      jest.spyOn(MapViewManager, 'getInstance').mockReturnValue({
        getAllJimuMapViews: () => [mockActiveView],
        jimuMapViewGroups: {}
      })

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { zoomMapToRecords, clearPreviousMapSelection } = require('../../src/runtime/chart/utils/use-selection')

      const parcelA = {
        getId: () => 'parcel-A',
        feature: {
          attributes: { Client: 'Person A' },
          geometry: { rings: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] }
        }
      }

      const parcelB = {
        getId: () => 'parcel-B',
        feature: {
          attributes: { Client: 'Person B' },
          geometry: { rings: [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]] }
        }
      }

      // First click: Person A
      await zoomMapToRecords([parcelA], 'Client')
      // Wait for whenLayerView promise
      await Promise.resolve()
      expect(mockHighlight).toHaveBeenCalledTimes(1)
      expect(mockRemoveHandle1).not.toHaveBeenCalled()

      // Second click: Person B
      await zoomMapToRecords([parcelB], 'Client')
      await Promise.resolve()

      // Person A's highlight handle MUST have been removed!
      expect(mockRemoveHandle1).toHaveBeenCalledTimes(1)
      // Person B's highlight was applied
      expect(mockHighlight).toHaveBeenCalledTimes(2)

      // Clear map selection removes handle 2
      clearPreviousMapSelection([mockActiveView])
      expect(mockRemoveHandle2).toHaveBeenCalledTimes(1)
      expect(mockPopupClose).toHaveBeenCalled()
    })
  })

  describe('extractSingleFilterValue', () => {
    const targetField = 'AirportName'

    it('returns undefined for empty or layer-wide filters', () => {
      expect(extractSingleFilterValue(undefined, targetField)).toBeUndefined()
      expect(extractSingleFilterValue('', targetField)).toBeUndefined()
      expect(extractSingleFilterValue('1=1', targetField)).toBeUndefined()
      expect(extractSingleFilterValue('Year = 2024', targetField)).toBeUndefined()
      expect(extractSingleFilterValue('ParcelStatus = 1', targetField)).toBeUndefined()
      expect(extractSingleFilterValue('((ParcelStatus = 1))', targetField)).toBeUndefined()
    })

    it('returns undefined for multi-value filters or self-comparisons', () => {
      expect(extractSingleFilterValue("AirportName IN ('Cairo', 'Alexandria')", targetField)).toBeUndefined()
      expect(extractSingleFilterValue("AirportName = 'Cairo' OR AirportName = 'Alexandria'", targetField)).toBeUndefined()
      expect(extractSingleFilterValue('AirportName = AirportName', targetField)).toBeUndefined()
    })

    it('extracts airport name from simple equality', () => {
      expect(extractSingleFilterValue("AirportName = 'Cairo'", targetField)).toBe('Cairo')
      expect(extractSingleFilterValue('AirportName = "Cairo"', targetField)).toBe('Cairo')
      expect(extractSingleFilterValue('[AirportName] = \'Alexandria\'', targetField)).toBe('Alexandria')
    })

    it('extracts Arabic airport name with N prefix', () => {
      expect(extractSingleFilterValue("AirportName = N'مطار القاهرة الدولي'", targetField)).toBe('مطار القاهرة الدولي')
      expect(extractSingleFilterValue("AirportName = 'مطار القاهرة الدولي'", targetField)).toBe('مطار القاهرة الدولي')
    })

    it('extracts airport name from single-item IN clause', () => {
      expect(extractSingleFilterValue("AirportName IN ('Cairo')", targetField)).toBe('Cairo')
      expect(extractSingleFilterValue("AirportName IN (N'مطار القاهرة الدولي')", targetField)).toBe('مطار القاهرة الدولي')
    })

    it('extracts airport name when combined with other layer filters (AND)', () => {
      expect(extractSingleFilterValue("Year = 2024 AND AirportName = 'Cairo'", targetField)).toBe('Cairo')
      expect(extractSingleFilterValue("1=1 AND (Year = 2024) AND (AirportName = N'مطار القاهرة الدولي')", targetField)).toBe('مطار القاهرة الدولي')
      expect(extractSingleFilterValue("((ParcelStatus = 1)) AND (AirportName = N'مطار القاهرة الدولي')", targetField)).toBe('مطار القاهرة الدولي')
    })

    it('extracts numeric value when target field is numeric', () => {
      expect(extractSingleFilterValue('AirportCode = 12', 'AirportCode')).toBe('12')
    })
  })

  describe('formatDynamicChartTitle', () => {
    it('formats dynamic title with count first and مطار prepended to airport name', () => {
      expect(formatDynamicChartTitle('Cairo Airport', 15)).toBe('أعلى 15 شخص حسب المساحة – مطار Cairo Airport')
      expect(formatDynamicChartTitle('Cairo Airport', 10)).toBe('أعلى 10 أشخاص حسب المساحة – مطار Cairo Airport')
      expect(formatDynamicChartTitle('King Abdulaziz International Airport', 20)).toBe('أعلى 20 شخص حسب المساحة – مطار King Abdulaziz International Airport')
      expect(formatDynamicChartTitle('أبو صوير', 10)).toBe('أعلى 10 أشخاص حسب المساحة – مطار أبو صوير')
      expect(formatDynamicChartTitle('أبو صوير', 15)).toBe('أعلى 15 شخص حسب المساحة – مطار أبو صوير')
      expect(formatDynamicChartTitle('أبو صوير', 20)).toBe('أعلى 20 شخص حسب المساحة – مطار أبو صوير')
    })

    it('updates existing title string with new count and new airport adhering to Arabic format', () => {
      expect(formatDynamicChartTitle('Cairo', 10, 'Airport Name — Top 20 People by Area')).toBe('أعلى 10 أشخاص حسب المساحة – مطار Cairo')
      expect(formatDynamicChartTitle('Alexandria', 20, 'Cairo – Top 10 by Area')).toBe('أعلى 20 شخص حسب المساحة – مطار Alexandria')
      expect(formatDynamicChartTitle('Borg El Arab', 15, 'Top 20 by Area')).toBe('أعلى 15 شخص حسب المساحة – مطار Borg El Arab')
      expect(formatDynamicChartTitle('Cairo Airport', 15, 'Chart Title')).toBe('أعلى 15 شخص حسب المساحة – مطار Cairo Airport')
      expect(formatDynamicChartTitle('Cairo Airport', 20, 'Advanced Chart')).toBe('أعلى 20 شخص حسب المساحة – مطار Cairo Airport')
      expect(formatDynamicChartTitle('أبو صوير', 15, 'أعلى 10 أشخاص حسب المساحة – مطار أبو صوير')).toBe('أعلى 15 شخص حسب المساحة – مطار أبو صوير')
    })

    it('preserves custom metric suffixes configured in the title', () => {
      expect(formatDynamicChartTitle('Cairo', 25, 'Airport Name – Top 20 Clients by Land Area')).toBe('أعلى 25 Clients by Land Area – مطار Cairo')
      expect(formatDynamicChartTitle('Cairo', 10, 'Top 20 Land Owners')).toBe('أعلى 10 Land Owners – مطار Cairo')
      expect(formatDynamicChartTitle('أبو صوير', 10, 'أعلى 20 ملاك أراضي – مطار أبو صوير')).toBe('أعلى 10 ملاك أراضي – مطار أبو صوير')
    })

    it('handles Arabic airport names properly without duplicating مطار if already present', () => {
      expect(formatDynamicChartTitle('مطار القاهرة الدولي', 15)).toBe('أعلى 15 شخص حسب المساحة – مطار القاهرة الدولي')
      expect(formatDynamicChartTitle('مطار برج العرب', 10)).toBe('أعلى 10 أشخاص حسب المساحة – مطار برج العرب')
      expect(formatDynamicChartTitle('مطار برج العرب', 20)).toBe('أعلى 20 شخص حسب المساحة – مطار برج العرب')
      expect(formatDynamicChartTitle('مطار الملك عبد العزيز الدولي', 10, 'Airport Name — Top 20 People by Area')).toBe('أعلى 10 أشخاص حسب المساحة – مطار الملك عبد العزيز الدولي')
      expect(formatDynamicChartTitle('أبو صوير', 10)).toBe('أعلى 10 أشخاص حسب المساحة – مطار أبو صوير')
    })

    it('falls back to "اسم المطار" when airportName is empty or undefined', () => {
      expect(formatDynamicChartTitle('', 15)).toBe('أعلى 15 شخص حسب المساحة – اسم المطار')
      expect(formatDynamicChartTitle(undefined as any, 10)).toBe('أعلى 10 أشخاص حسب المساحة – اسم المطار')
      expect(formatDynamicChartTitle('Airport Name', 10)).toBe('أعلى 10 أشخاص حسب المساحة – اسم المطار')
    })

    it('guards against displaying purely numeric airport IDs or numbers', () => {
      expect(formatDynamicChartTitle('15', 15)).toBe('أعلى 15 شخص حسب المساحة – اسم المطار')
      expect(formatDynamicChartTitle('101', 20)).toBe('أعلى 20 شخص حسب المساحة – اسم المطار')
    })

    it('integrates with lookupDomainName when database stores numeric code 5, displaying Cairo Airport instead of 5', () => {
      const mockDs = {
        layer: {
          getFieldDomain: (field: string) => {
            if (field === 'AirportName') {
              return {
                codedValues: [{ code: 5, name: 'Cairo Airport' }]
              }
            }
            return null
          }
        }
      }
      const rawStoredCode = 5
      const resolvedAirportName = lookupDomainName('AirportName', rawStoredCode, mockDs)
      expect(resolvedAirportName).toBe('Cairo Airport')
      expect(formatDynamicChartTitle(resolvedAirportName, 15)).toBe('أعلى 15 شخص حسب المساحة – مطار Cairo Airport')
      expect(formatDynamicChartTitle(resolvedAirportName, 10)).toBe('أعلى 10 أشخاص حسب المساحة – مطار Cairo Airport')
      // Even if resolution failed, raw numeric code '5' is never displayed as '5'
      expect(formatDynamicChartTitle(String(rawStoredCode), 15)).toBe('أعلى 15 شخص حسب المساحة – اسم المطار')
    })
  })

  describe('findAirportNameInAttributes', () => {
    it('extracts real airport name from attributes and ignores numeric IDs', () => {
      const data = {
        Airport_ID: 15,
        AirportName: 'King Abdulaziz International Airport',
        Client: 'Ahmed',
        Area: 120.5
      }
      expect(findAirportNameInAttributes(data)).toBe('King Abdulaziz International Airport')
    })

    it('extracts Arabic airport name from attributes', () => {
      const data = {
        OBJECTID: 3,
        Airport_No: '003',
        اسم_المطار: 'مطار الملك خالد الدولي',
        Client: 'حسن فوزي'
      }
      expect(findAirportNameInAttributes(data)).toBe('مطار الملك خالد الدولي')
    })

    it('returns undefined if record only contains numeric IDs and no name', () => {
      const data = {
        Airport_ID: 15,
        FID: 101,
        OBJECTID: 15
      }
      expect(findAirportNameInAttributes(data)).toBeUndefined()
    })
  })

  describe('lookupDomainName', () => {
    it('resolves coded value domain name from layer domain', () => {
      const mockDs = {
        layer: {
          getFieldDomain: (field: string) => {
            if (field === 'Airport') {
              return {
                codedValues: [
                  { code: 1, name: 'Cairo International Airport' },
                  { code: 2, name: 'Alexandria Borg El Arab Airport' }
                ]
              }
            }
            return null
          }
        }
      }
      expect(lookupDomainName('Airport', 1, mockDs)).toBe('Cairo International Airport')
      expect(lookupDomainName('Airport', '2', mockDs)).toBe('Alexandria Borg El Arab Airport')
      expect(lookupDomainName('Airport', 99, mockDs)).toBeUndefined()
    })

    it('resolves code 5 to Cairo Airport when database stores 5', () => {
      const mockDs = {
        layer: {
          getFieldDomain: (field: string) => {
            if (field === 'AirportName' || field === 'Airport') {
              return {
                codedValues: [
                  { code: 5, name: 'Cairo Airport' },
                  { code: 6, name: 'Alexandria Airport' }
                ]
              }
            }
            return null
          }
        }
      }
      expect(lookupDomainName('AirportName', 5, mockDs)).toBe('Cairo Airport')
      expect(lookupDomainName('AirportName', '5', mockDs)).toBe('Cairo Airport')
      expect(lookupDomainName('Airport', 5, mockDs)).toBe('Cairo Airport')
    })

    it('resolves domain from layer.fields array', () => {
      const mockDs = {
        layer: {
          fields: [
            {
              name: 'AirportName',
              domain: {
                codedValues: [
                  { code: 5, name: 'Cairo Airport' }
                ]
              }
            }
          ]
        }
      }
      expect(lookupDomainName('AirportName', 5, mockDs)).toBe('Cairo Airport')
      expect(lookupDomainName('AirportName', '5', mockDs)).toBe('Cairo Airport')
    })

    it('resolves domain from getLayerDefinition() fields and subtypes', () => {
      const mockDs = {
        getLayerDefinition: () => ({
          fields: [
            {
              name: 'AirportName',
              domain: {
                codedValues: [
                  { code: 5, name: 'Cairo Airport' }
                ]
              }
            }
          ],
          types: []
        })
      }
      expect(lookupDomainName('AirportName', 5, mockDs)).toBe('Cairo Airport')
    })

    it('resolves domain from getSchema().fields', () => {
      const mockDs = {
        getSchema: () => ({
          fields: {
            AirportName: {
              domain: {
                codedValues: [
                  { code: 5, name: 'Cairo Airport' }
                ]
              }
            }
          }
        })
      }
      expect(lookupDomainName('AirportName', 5, mockDs)).toBe('Cairo Airport')
    })

    it('resolves domain from subtypes in layer.types', () => {
      const mockDs = {
        layer: {
          types: [
            {
              id: 1,
              domains: {
                AirportName: {
                  codedValues: [
                    { code: 5, name: 'Cairo Airport' }
                  ]
                }
              }
            }
          ]
        }
      }
      expect(lookupDomainName('AirportName', 5, mockDs)).toBe('Cairo Airport')
    })

    it('finds domain across candidate airport fields when specific field not provided', () => {
      const mockDs = {
        getLayerDefinition: () => ({
          fields: [
            {
              name: 'Airport_Code',
              domain: {
                codedValues: [
                  { code: 5, name: 'Cairo Airport' }
                ]
              }
            }
          ]
        })
      }
      expect(lookupDomainName(undefined, 5, mockDs)).toBe('Cairo Airport')
    })

    it('rejects purely numeric domain names as invalid airport names', () => {
      const mockDs = {
        layer: {
          getFieldDomain: () => ({
            codedValues: [
              { code: 5, name: '5' },
              { code: 6, name: '101' }
            ]
          })
        }
      }
      expect(lookupDomainName('Airport', 5, mockDs)).toBeUndefined()
    })
  })

  describe('getConfiguredPeopleCount', () => {
    it('extracts pageSize from webChart.dataSource.query.pageSize', () => {
      const webChart = { dataSource: { query: { pageSize: 15 } } } as any
      expect(getConfiguredPeopleCount(webChart)).toBe(15)
    })

    it('extracts pageSize from series query', () => {
      const webChart = { series: [{ query: { pageSize: 25 } }] } as any
      expect(getConfiguredPeopleCount(webChart)).toBe(25)
    })

    it('extracts topN from drilldown options', () => {
      const options = { drilldown: { topN: 30 } } as any
      expect(getConfiguredPeopleCount({} as any, options)).toBe(30)
    })

    it('extracts count from existing title text pattern', () => {
      const webChart = { title: { content: { text: 'Cairo – Top 12 by Area' } } } as any
      expect(getConfiguredPeopleCount(webChart)).toBe(12)

      const arabicWebChart = { title: { content: { text: 'أعلى 10 أشخاص حسب المساحة – مطار أبو صوير' } } } as any
      expect(getConfiguredPeopleCount(arabicWebChart)).toBe(10)

      const arabicWebChart15 = { title: { content: { text: 'أعلى 15 شخص حسب المساحة – مطار أبو صوير' } } } as any
      expect(getConfiguredPeopleCount(arabicWebChart15)).toBe(15)
    })

    it('falls back to default count (15) when unconfigured', () => {
      expect(getConfiguredPeopleCount({} as any)).toBe(15)
    })
  })

  describe('formatArabicArea', () => {
    it('formats whole numbers with فدان suffix', () => {
      expect(formatArabicArea(138)).toBe('138 فدان')
      expect(formatArabicArea(30)).toBe('30 فدان')
      expect(formatArabicArea(0)).toBe('0 فدان')
    })

    it('formats decimal numbers nicely', () => {
      expect(formatArabicArea(138.5)).toBe('138.5 فدان')
      expect(formatArabicArea(138.256)).toBe('138.26 فدان')
    })

    it('handles null, undefined or NaN gracefully', () => {
      expect(formatArabicArea(NaN)).toBe('0 فدان')
      expect(formatArabicArea(null as any)).toBe('0 فدان')
      expect(formatArabicArea(undefined as any)).toBe('0 فدان')
    })
  })

  describe('formatArabicParcelCount', () => {
    it('formats 1 as قطعة واحدة', () => {
      expect(formatArabicParcelCount(1)).toBe('قطعة واحدة')
    })

    it('formats 2 as قطعتان', () => {
      expect(formatArabicParcelCount(2)).toBe('قطعتان')
    })

    it('formats 3 to 10 as N قطع (e.g. 5 قطع from user example)', () => {
      expect(formatArabicParcelCount(3)).toBe('3 قطع')
      expect(formatArabicParcelCount(5)).toBe('5 قطع')
      expect(formatArabicParcelCount(8)).toBe('8 قطع')
      expect(formatArabicParcelCount(10)).toBe('10 قطع')
    })

    it('formats 11 and above as N قطعة', () => {
      expect(formatArabicParcelCount(11)).toBe('11 قطعة')
      expect(formatArabicParcelCount(25)).toBe('25 قطعة')
    })

    it('handles undefined or null as en-dash', () => {
      expect(formatArabicParcelCount(undefined)).toBe('–')
      expect(formatArabicParcelCount(null as any)).toBe('–')
      expect(formatArabicParcelCount(0)).toBe('–')
    })
  })

  describe('resolvePersonDetails', () => {
    const mockStats = {
      'أحمد محمد': { count: 5, area: 138, fullName: 'أحمد محمد' },
      'ahmed mohamed': { count: 5, area: 138, fullName: 'أحمد محمد' },
      'حسن فوزي حسن': { count: 8, area: 138, fullName: 'حسن فوزي حسن' },
      'محمد ابراهيم علي': { count: 3, area: 30, fullName: 'محمد ابراهيم علي' }
    }

    it('resolves exact person name match and returns full name and count', () => {
      const res = resolvePersonDetails('أحمد محمد', 138, mockStats)
      expect(res.displayName).toBe('أحمد محمد')
      expect(res.parcelCount).toBe(5)
    })

    it('resolves truncated category labels with leading ellipsis (e.g. ...حسن فوزي حس)', () => {
      const res = resolvePersonDetails('...حسن فوزي حس', 138, mockStats)
      expect(res.displayName).toBe('حسن فوزي حسن')
      expect(res.parcelCount).toBe(8)
    })

    it('resolves truncated category labels with trailing ellipsis (e.g. محمد ابراهي...)', () => {
      const res = resolvePersonDetails('محمد ابراهي...', 30, mockStats)
      expect(res.displayName).toBe('محمد ابراهيم علي')
      expect(res.parcelCount).toBe(3)
    })

    it('falls back cleanly to cleaned xValue if not found in stats', () => {
      const res = resolvePersonDetails('...علي محمود', 50, mockStats)
      expect(res.displayName).toBe('علي محمود')
      expect(res.parcelCount).toBeUndefined()
    })
  })

  describe('buildArabicTooltipHTML', () => {
    it('builds full Arabic person tooltip matching user example', () => {
      const html = buildArabicTooltipHTML('أحمد محمد', 138, 5, true)
      expect(html).toContain('الاسم:')
      expect(html).toContain('أحمد محمد')
      expect(html).toContain('المساحة:')
      expect(html).toContain('138 فدان')
      expect(html).toContain('عدد القطع:')
      expect(html).toContain('5 قطع')
      expect(html).toContain('direction: rtl')
      expect(html).toContain('text-align: right')
    })

    it('builds airport tooltip when isPersonView is false', () => {
      const html = buildArabicTooltipHTML('مطار أبو حماد', 2500, undefined, false)
      expect(html).toContain('المطار:')
      expect(html).toContain('مطار أبو حماد')
      expect(html).toContain('المساحة:')
      expect(html).toContain('2500 فدان')
      expect(html).not.toContain('عدد القطع:')
    })

    it('safely escapes HTML special characters in names', () => {
      const html = buildArabicTooltipHTML('<script>alert("x")</script>', 100, 2, true)
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })
  })

  describe('normalizeAxes Y-axis area label', () => {
    it('sets Y-axis title visible and text to المساحة (بالفدان) when empty or invisible', () => {
      const series = [{ type: 'lineSeries' }] as any
      const axes = [
        { type: 'chartAxis', valueFormat: { type: 'category' } },
        {
          type: 'chartAxis',
          valueFormat: { type: 'number' },
          title: { visible: false, content: { text: '' } }
        }
      ] as any

      const normalized = normalizeAxes(series, axes, {} as any) as any
      expect(normalized[1].title.visible).toBe(true)
      expect(normalized[1].title.content.text).toBe('المساحة (بالفدان)')
      expect(normalized[1].title.content.angle).toBe(270)
      expect(normalized[1].title.content.verticalAlignment).toBe('middle')
    })

    it('preserves existing non-empty title if already configured, making it visible', () => {
      const series = [{ type: 'lineSeries' }] as any
      const axes = [
        { type: 'chartAxis', valueFormat: { type: 'category' } },
        {
          type: 'chartAxis',
          valueFormat: { type: 'number' },
          title: { visible: false, content: { text: 'المساحة الكلية' } }
        }
      ] as any

      const normalized = normalizeAxes(series, axes, {} as any) as any
      expect(normalized[1].title.visible).toBe(true)
      expect(normalized[1].title.content.text).toBe('المساحة الكلية')
      expect(normalized[1].title.content.angle).toBe(270)
    })
  })
})

