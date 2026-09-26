import { React, type DataSource, type QueriableDataSource, hooks } from 'jimu-core'
import { type DrilldownOptions } from '../../../config'

// ---------------------------------------------------------------------------
// Defaults - used only when the widget's Drilldown Settings haven't been
// configured yet (e.g. right after upgrading), so the panel still works.
// ---------------------------------------------------------------------------
const Defaults: Required<DrilldownOptions> = {
  airportField: 'AirportName',
  clientField: 'Client',
  yearField: 'Year',
  areaField: 'إجمالي المساحة بالفدان',
  topN: 20,
  fontFamily: '',
  fontSize: 13
}

export interface YearComparisonResult {
  client: string
  fromYear: number
  toYear: number
  fromArea: number
  toArea: number
  percentChange: number | null // null when fromArea is 0 (can't compute a %)
}

interface AirportDrilldownPanelProps {
  dataSource: DataSource
  airportName: string
  drilldownOptions?: DrilldownOptions
  onComparisonChange: (result: YearComparisonResult | null) => void
}

type SimpleQueryResult<T> = {
  loading: boolean
  values: T[]
}

/**
 * Runs a distinct-values query for a single field, scoped to the given
 * airport, using the same QueriableDataSource the chart itself uses
 * (so it goes through the same layer/service).
 */
const useDistinctFieldValues = (
  dataSource: DataSource,
  airportField: string,
  airportName: string,
  field: string
): SimpleQueryResult<string | number> => {
  const [state, setState] = React.useState<SimpleQueryResult<string | number>>({ loading: false, values: [] })
  const cancelable = hooks.useCancelablePromiseMaker()

  React.useEffect(() => {
    if (!dataSource || !airportName) {
      setState({ loading: false, values: [] })
      return
    }

    let active = true
    setState((s) => ({ ...s, loading: true }))

    const queriableDs = dataSource as unknown as QueriableDataSource
    const escapedAirport = airportName.replace(/'/g, "''")

    cancelable(
      queriableDs.query({
        where: `${airportField} = '${escapedAirport}'`,
        groupByFieldsForStatistics: [field],
        outFields: [field],
        outStatistics: [] as any,
        returnGeometry: false
      } as any)
    )
      .then((result: any) => {
        if (!active) return
        const records = result?.records ?? []
        const values = Array.from(
          new Set(
            records
              .map((record) => record.getData?.()?.[field] ?? record.getFieldValue?.(field))
              .filter((v) => v !== null && v !== undefined)
          )
        )
        setState({ loading: false, values })
      })
      .catch(() => {
        if (!active) return
        setState({ loading: false, values: [] })
      })

    return () => { active = false }
  }, [cancelable, dataSource, airportField, airportName, field])

  return state
}

/**
 * Queries the sum of the area field for a given airport + client + year.
 */
const querySumAreaForYear = async (
  dataSource: DataSource,
  fields: Required<DrilldownOptions>,
  airportName: string,
  client: string,
  year: number
): Promise<number> => {
  const queriableDs = dataSource as unknown as QueriableDataSource
  const escapedAirport = airportName.replace(/'/g, "''")
  const escapedClient = client.replace(/'/g, "''")

  const result: any = await queriableDs.query({
    where: `${fields.airportField} = '${escapedAirport}' AND ${fields.clientField} = '${escapedClient}' AND ${fields.yearField} = ${year}`,
    outStatistics: [{
      onStatisticField: fields.areaField,
      outStatisticFieldName: 'total_area',
      statisticType: 'sum'
    }],
    returnGeometry: false
  } as any)

  const records = result?.records ?? []
  const value = records?.[0]?.getData?.()?.total_area ?? records?.[0]?.getFieldValue?.('total_area')
  return typeof value === 'number' ? value : 0
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  fontSize: '12px',
  marginBottom: '8px'
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  opacity: 0.75,
  display: 'block',
  marginBottom: '2px'
}

export const AirportDrilldownPanel = (props: AirportDrilldownPanelProps): React.ReactElement => {
  const { dataSource, airportName, drilldownOptions, onComparisonChange } = props

  const fields: Required<DrilldownOptions> = { ...Defaults, ...(drilldownOptions ?? {}) }

  const [selectedClient, setSelectedClient] = React.useState<string>('')
  const [fromYear, setFromYear] = React.useState<string>('')
  const [toYear, setToYear] = React.useState<string>('')
  const [computing, setComputing] = React.useState(false)

  const cancelable = hooks.useCancelablePromiseMaker()

  const { values: clients, loading: clientsLoading } = useDistinctFieldValues(dataSource, fields.airportField, airportName, fields.clientField)
  const { values: years, loading: yearsLoading } = useDistinctFieldValues(dataSource, fields.airportField, airportName, fields.yearField)

  const sortedClients = React.useMemo(
    () => [...clients].sort((a, b) => String(a).localeCompare(String(b), 'ar')),
    [clients]
  )
  const sortedYears = React.useMemo(
    () => [...years].map(Number).sort((a, b) => a - b),
    [years]
  )

  // Reset selections whenever the selected airport changes.
  hooks.useUpdateEffect(() => {
    setSelectedClient('')
    setFromYear('')
    setToYear('')
    onComparisonChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airportName])

  // Run the comparison once all three selections are made.
  hooks.useUpdateEffect(() => {
    if (!selectedClient || !fromYear || !toYear) {
      onComparisonChange(null)
      return
    }

    setComputing(true)
    const fromYearNum = Number(fromYear)
    const toYearNum = Number(toYear)

    cancelable(
      Promise.all([
        querySumAreaForYear(dataSource, fields, airportName, selectedClient, fromYearNum),
        querySumAreaForYear(dataSource, fields, airportName, selectedClient, toYearNum)
      ])
    )
      .then(([fromArea, toArea]) => {
        const percentChange = fromArea > 0 ? ((toArea - fromArea) / fromArea) * 100 : null
        onComparisonChange({
          client: selectedClient,
          fromYear: fromYearNum,
          toYear: toYearNum,
          fromArea,
          toArea,
          percentChange
        })
        setComputing(false)
      })
      .catch(() => {
        onComparisonChange(null)
        setComputing(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient, fromYear, toYear, airportName, dataSource])

  const textStyle: React.CSSProperties = {
    fontFamily: fields.fontFamily || undefined,
    fontSize: `${fields.fontSize}px`
  }

  return (
    <div
      className='airport-drilldown-panel p-2'
      style={{ minWidth: '160px', borderInlineStart: '1px solid var(--ref-palette-neutral-500)', ...textStyle }}
    >
      <label style={labelStyle}>اسم الشخص</label>
      <select
        style={selectStyle}
        value={selectedClient}
        disabled={clientsLoading}
        onChange={(e) => { setSelectedClient(e.target.value) }}
      >
        <option value=''>{clientsLoading ? 'جاري التحميل...' : 'اختر اسم'}</option>
        {sortedClients.map((client) => (
          <option key={String(client)} value={String(client)}>{String(client)}</option>
        ))}
      </select>

      <label style={labelStyle}>من سنة</label>
      <select
        style={selectStyle}
        value={fromYear}
        disabled={yearsLoading}
        onChange={(e) => { setFromYear(e.target.value) }}
      >
        <option value=''>{yearsLoading ? 'جاري التحميل...' : 'اختر سنة'}</option>
        {sortedYears.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <label style={labelStyle}>إلى سنة</label>
      <select
        style={selectStyle}
        value={toYear}
        disabled={yearsLoading}
        onChange={(e) => { setToYear(e.target.value) }}
      >
        <option value=''>{yearsLoading ? 'جاري التحميل...' : 'اختر سنة'}</option>
        {sortedYears.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      {computing && <div style={{ fontSize: '11px', opacity: 0.7 }}>جاري الحساب...</div>}
    </div>
  )
}

export default AirportDrilldownPanel
