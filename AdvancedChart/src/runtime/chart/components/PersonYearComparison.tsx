import { React, ReactDOM, type DataSource, type QueriableDataSource } from 'jimu-core'

export interface YearDataPoint {
  year: number
  parcelCount: number
  totalArea: number
  deltaArea: number
  percentChange: number | null
  deltaParcels: number
  direction: 'up' | 'down' | 'neutral' | 'baseline'
}

export interface PersonComparisonSummary {
  personName: string
  airportName?: string
  yearsData: YearDataPoint[]
  minArea: number
  maxArea: number
  startYear: number
  latestYear: number
  latestArea: number
  latestParcels: number
  overallDeltaArea: number
  overallPercentChange: number | null
  overallDeltaParcels: number
  overallDirection: 'up' | 'down' | 'neutral'
}

export interface PersonYearComparisonProps {
  personName: string
  airportName?: string
  dataSource?: DataSource
  layer?: any
  clientField?: string
  airportField?: string
  yearField?: string
  areaField?: string
  onBack?: () => void
  onClose?: () => void
}

/**
 * Builds a smooth cubic bezier SVG path connecting the given points.
 */
function buildSmoothPath (points: Array<{ x: number, y: number }>): string {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i !== points.length - 2 ? points[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export const PersonYearComparison = (props: PersonYearComparisonProps): React.ReactElement => {
  const {
    personName,
    airportName = '',
    dataSource,
    layer,
    clientField = 'Client',
    airportField = 'AirportName',
    yearField = 'Year',
    areaField = 'إجمالي المساحة بالفدان',
    onBack,
    onClose
  } = props

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [summary, setSummary] = React.useState<PersonComparisonSummary | null>(null)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  React.useEffect(() => {
    let active = true

    if (!personName) {
      setLoading(false)
      setError('لا تتوفر بيانات للبحث')
      return
    }

    setLoading(true)
    setError(null)

    const queriableDs = dataSource as unknown as QueriableDataSource
    const escapedPerson = personName.replace(/'/g, "''")

    // Filter by person
    const personClause = `(${clientField} = '${escapedPerson}' OR ${clientField} = N'${escapedPerson}')`

    // Filter by airport if provided
    let whereClause = personClause
    if (airportName && airportField) {
      if (/^\d+$/.test(airportName.trim())) {
        whereClause += ` AND (${airportField} = ${airportName.trim()})`
      } else {
        const escapedAirport = airportName.replace(/'/g, "''")
        whereClause += ` AND (${airportField} = '${escapedAirport}' OR ${airportField} = N'${escapedAirport}')`
      }
    }

    const processRecords = (records: any[]): PersonComparisonSummary | null => {
      const yearMap: Record<number, { count: number, area: number }> = {}

      for (const rec of records) {
        const data = (typeof rec.getData === 'function' ? rec.getData() : rec.attributes) || rec || {}

        // Extract year with case & alias fallbacks
        let yrRaw = data[yearField] ?? data[yearField.toLowerCase()] ?? data[yearField.toUpperCase()]
        if (yrRaw == null) {
          const yrKey = Object.keys(data).find(k => /^(?:year|year_|survey.*year|upload.*year|سنة.*رفع|سنة)$/i.test(k))
          if (yrKey) yrRaw = data[yrKey]
        }
        if (yrRaw == null) continue
        const yr = Number(yrRaw)
        if (isNaN(yr) || yr < 1900 || yr > 2100) continue

        // Extract area with alias fallbacks
        let areaVal = Number(
          data[areaField] ??
          data[areaField.toLowerCase()] ??
          data[areaField.toUpperCase()] ??
          data.AreaF ??
          data.areaf ??
          data.AREAF ??
          data['إجمالي المساحة بالفدان'] ??
          data.sum_area ??
          data.total_area ??
          0
        )
        if (isNaN(areaVal) || areaVal === 0) {
          const areaKey = Object.keys(data).find(k => /(?:areaf|مساحة|area)/i.test(k) && !/(?:id|code|objectid|fid|shape__area)/i.test(k))
          if (areaKey && !isNaN(Number(data[areaKey]))) {
            areaVal = Number(data[areaKey])
          }
        }
        const validArea = !isNaN(areaVal) && areaVal > 0 ? areaVal : 0

        // Extract count (if from grouped statistics)
        const countVal = Number(data.parcel_count ?? data.PARCEL_COUNT ?? data.count ?? 1)

        if (!yearMap[yr]) {
          yearMap[yr] = { count: 0, area: 0 }
        }
        yearMap[yr].count += countVal
        yearMap[yr].area += validArea
      }

      const sortedYears = Object.keys(yearMap).map(Number).sort((a, b) => a - b)
      if (!sortedYears.length) return null

      const yearsData: YearDataPoint[] = sortedYears.map((yr, idx) => {
        const cur = yearMap[yr]
        const roundedArea = Math.round(cur.area * 100) / 100

        if (idx === 0) {
          return {
            year: yr,
            parcelCount: cur.count,
            totalArea: roundedArea,
            deltaArea: 0,
            percentChange: null,
            deltaParcels: 0,
            direction: 'baseline'
          }
        }

        const prev = yearMap[sortedYears[idx - 1]]
        const deltaA = Math.round((cur.area - prev.area) * 100) / 100
        const deltaP = cur.count - prev.count
        const pct = prev.area > 0 ? Math.round(((cur.area - prev.area) / prev.area) * 1000) / 10 : null

        let dir: 'up' | 'down' | 'neutral' = 'neutral'
        if (deltaA > 0.001) dir = 'up'
        else if (deltaA < -0.001) dir = 'down'

        return {
          year: yr,
          parcelCount: cur.count,
          totalArea: roundedArea,
          deltaArea: deltaA,
          percentChange: pct,
          deltaParcels: deltaP,
          direction: dir
        }
      })

      const areas = yearsData.map(d => d.totalArea)
      const minArea = Math.min(...areas)
      const maxArea = Math.max(...areas)
      const startYear = yearsData[0].year
      const latestYear = yearsData[yearsData.length - 1].year
      const startArea = yearsData[0].totalArea
      const latestArea = yearsData[yearsData.length - 1].totalArea
      const latestParcels = yearsData[yearsData.length - 1].parcelCount

      const overallDeltaArea = Math.round((latestArea - startArea) * 100) / 100
      const overallPercentChange = startArea > 0
        ? Math.round(((latestArea - startArea) / startArea) * 1000) / 10
        : null
      const overallDeltaParcels = latestParcels - yearsData[0].parcelCount

      let overallDirection: 'up' | 'down' | 'neutral' = 'neutral'
      if (overallDeltaArea > 0.001) overallDirection = 'up'
      else if (overallDeltaArea < -0.001) overallDirection = 'down'

      return {
        personName,
        airportName,
        yearsData,
        minArea,
        maxArea,
        startYear,
        latestYear,
        latestArea,
        latestParcels,
        overallDeltaArea,
        overallPercentChange,
        overallDeltaParcels,
        overallDirection
      }
    }

    const executeQuery = async (queryWhere: string): Promise<any[]> => {
      // 1. Try QueriableDataSource remote query
      if (queriableDs && typeof queriableDs.query === 'function') {
        try {
          const res = await queriableDs.query({
            where: queryWhere,
            outFields: ['*'],
            pageSize: 2000,
            returnGeometry: false
          } as any)
          if (res?.records?.length) {
            return res.records
          }
        } catch (e) {}
      }

      // 2. Try in-memory records from DataSource
      if (queriableDs) {
        try {
          const memRecs = (typeof queriableDs.getRecords === 'function' ? queriableDs.getRecords() : (queriableDs as any).getSourceRecords?.()) ?? []
          if (memRecs?.length) {
            const matches = memRecs.filter((r: any) => {
              const d = r.getData?.() || r.attributes || {}
              const c = d[clientField] ?? d[clientField.toLowerCase()] ?? d[clientField.toUpperCase()]
              return c && String(c).trim().toLowerCase() === personName.trim().toLowerCase()
            })
            if (matches.length) return matches
          }
        } catch (e) {}
      }

      // 3. Try FeatureLayer queryFeatures
      if (layer && typeof layer.queryFeatures === 'function') {
        try {
          const q = typeof layer.createQuery === 'function' ? layer.createQuery() : {}
          q.where = queryWhere
          q.outFields = ['*']
          q.returnGeometry = false
          const res = await layer.queryFeatures(q)
          if (res?.features?.length) {
            return res.features
          }
        } catch (e) {}
      }

      // 4. Try client-side graphics on layer source
      if (layer?.source?.items?.length) {
        try {
          const items = layer.source.items
          const matches = items.filter((g: any) => {
            const d = g.attributes || {}
            const c = d[clientField] ?? d[clientField.toLowerCase()] ?? d[clientField.toUpperCase()]
            return c && String(c).trim().toLowerCase() === personName.trim().toLowerCase()
          })
          if (matches.length) return matches
        } catch (e) {}
      }

      return []
    }

    const runQueries = async () => {
      // 1. Try grouped statistics query if dataSource is available
      if (queriableDs && typeof queriableDs.query === 'function') {
        try {
          const res: any = await queriableDs.query({
            where: whereClause,
            groupByFieldsForStatistics: [yearField],
            outStatistics: [
              {
                statisticType: 'count',
                onStatisticField: yearField,
                outStatisticFieldName: 'parcel_count'
              },
              {
                statisticType: 'sum',
                onStatisticField: areaField,
                outStatisticFieldName: 'sum_area'
              }
            ],
            orderByFields: [`${yearField} ASC`],
            returnGeometry: false
          } as any)
          if (active && res?.records?.length > 0) {
            const summaryResult = processRecords(res.records)
            if (summaryResult) {
              setSummary(summaryResult)
              setLoading(false)
              return
            }
          }
        } catch (e) {}
      }

      // 2. Try feature query with whereClause
      let records = await executeQuery(whereClause)
      if (!active) return

      // 3. Fallback: if airport-scoped query returned 0, try personClause
      if (!records.length && whereClause !== personClause) {
        records = await executeQuery(personClause)
      }
      if (!active) return

      if (records.length > 0) {
        const summaryResult = processRecords(records)
        if (summaryResult) {
          setSummary(summaryResult)
          setLoading(false)
          return
        }
      }

      setError('لم يتم العثور على بيانات مقارنة لسنوات سابقة لهذا المالك')
      setLoading(false)
    }

    runQueries().catch(() => {
      if (!active) return
      setError('تعذر تحميل بيانات مقارنة السنوات')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [dataSource, layer, personName, airportName, clientField, airportField, yearField, areaField])

  // SVG Chart Dimensions
  const svgWidth = 480
  const svgHeight = 180
  const padLeft = 52
  const padRight = 36
  const padTop = 25
  const padBottom = 32

  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  const chartPoints = React.useMemo(() => {
    if (!summary || !summary.yearsData.length) return []
    const data = summary.yearsData
    const count = data.length

    const yMin = Math.max(0, summary.minArea * 0.85)
    const yMax = Math.max(summary.maxArea * 1.15, summary.minArea + 1)
    const yRange = yMax - yMin

    return data.map((d, i) => {
      const x = count === 1 ? padLeft + plotWidth / 2 : padLeft + (i / (count - 1)) * plotWidth
      const y = padTop + plotHeight - ((d.totalArea - yMin) / yRange) * plotHeight
      return {
        ...d,
        x,
        y
      }
    })
  }, [summary, plotWidth, plotHeight, padLeft, padTop])

  const linePath = React.useMemo(() => {
    return buildSmoothPath(chartPoints)
  }, [chartPoints])

  const areaPath = React.useMemo(() => {
    if (!chartPoints.length) return ''
    const baselineY = padTop + plotHeight
    if (chartPoints.length === 1) {
      const pt = chartPoints[0]
      return `M ${pt.x - 20} ${baselineY} L ${pt.x - 20} ${pt.y} L ${pt.x + 20} ${pt.y} L ${pt.x + 20} ${baselineY} Z`
    }
    const first = chartPoints[0]
    const last = chartPoints[chartPoints.length - 1]
    return `${linePath} L ${last.x.toFixed(1)} ${baselineY.toFixed(1)} L ${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`
  }, [chartPoints, linePath, padTop, plotHeight])

  const activePoint = hoveredIndex != null && chartPoints[hoveredIndex] ? chartPoints[hoveredIndex] : null

  const isBullish = summary?.overallDirection === 'up'
  const isBearish = summary?.overallDirection === 'down'

  const strokeColor = isBearish ? '#ef4444' : '#10b981'
  const gradientStart = isBearish ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'
  const gradientEnd = isBearish ? 'rgba(239, 68, 68, 0.0)' : 'rgba(16, 185, 129, 0.0)'

  return (
    <div
      className='person-year-comparison-popup'
      style={{
        direction: 'rtl',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif',
        background: '#0f172a',
        color: '#f8fafc',
        borderRadius: '8px',
        padding: '16px',
        width: '100%',
        minHeight: '100%',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .person-year-comparison-popup * { box-sizing: border-box; }
        .pyc-badge-up { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .pyc-badge-down { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .pyc-badge-neutral { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
        .pyc-row:hover { background: rgba(255, 255, 255, 0.06) !important; }
        .pyc-btn-back:hover { background: rgba(255, 255, 255, 0.12) !important; color: #ffffff !important; }
        .pyc-node-halo { transition: all 0.2s ease-in-out; }
        .esri-popup--comparison-mode { min-width: 500px !important; max-width: 580px !important; width: 540px !important; }
        .esri-popup--comparison-mode .esri-popup__content { margin: 0 !important; padding: 0 !important; max-height: 560px !important; overflow-y: auto !important; }
      `}</style>

      {/* Top Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
        <button
          type='button'
          onClick={onBack}
          className='pyc-btn-back'
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#cbd5e1',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
        >
          <span>➔</span>
          <span>رجوع لتفاصيل القطعة</span>
        </button>

        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
          📊 مقارنة سنوات الرفع
        </span>

        {onClose && (
          <button
            type='button'
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            title='إغلاق'
          >
            ✕
          </button>
        )}
      </div>

      {/* Person Title & Airport Subtitle */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '18px' }}>👤</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            {personName}
          </h3>
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {airportName && (
            <span>📍 <strong>المطار:</strong> {airportName}</span>
          )}
          {summary && (
            <span>📅 <strong>سنوات الرفع:</strong> {summary.startYear} - {summary.latestYear}</span>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '13px' }}>جاري تجميع بيانات المقارنة لسنوات الرفع...</div>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5' }}>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>⚠️ {error}</div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>تأكد من وجود سجلات مسجلة لنفس المالك في سنوات رفع أخرى.</div>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Stock Ticker Summary Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                المساحة الحالية ({summary.latestYear})
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
                {summary.latestArea.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>فدان</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                إجمالي {summary.latestParcels} قطعة
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                صافي التغير الإجمالي
              </div>
              <div
                className={isBullish ? 'pyc-badge-up' : isBearish ? 'pyc-badge-down' : 'pyc-badge-neutral'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <span>{isBullish ? '▲' : isBearish ? '▼' : '➔'}</span>
                <span>
                  {summary.overallDeltaArea > 0 ? '+' : ''}{summary.overallDeltaArea.toFixed(2)} فدان
                </span>
                {summary.overallPercentChange != null && (
                  <span style={{ opacity: 0.85, fontSize: '11px' }}>
                    ({summary.overallPercentChange > 0 ? '+' : ''}{summary.overallPercentChange}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stock Market Area Chart (SVG) */}
          <div
            style={{
              position: 'relative',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '8px 4px 4px 4px',
              marginBottom: '14px',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 4px 10px', fontSize: '11px', color: '#94a3b8' }}>
              <span>منحنى تغير المساحة بالفدان</span>
              <span>المحور: سنوات الرفع (Upload Years)</span>
            </div>

            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id='stockAreaGrad' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor={gradientStart} />
                  <stop offset='100%' stopColor={gradientEnd} />
                </linearGradient>
                <filter id='nodeGlow' x='-30%' y='-30%' width='160%' height='160%'>
                  <feGaussianBlur stdDeviation='3' result='blur' />
                  <feComposite in='SourceGraphic' in2='blur' operator='over' />
                </filter>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = padTop + plotHeight * (1 - ratio)
                const yMin = Math.max(0, summary.minArea * 0.85)
                const yMax = Math.max(summary.maxArea * 1.15, summary.minArea + 1)
                const val = yMin + ratio * (yMax - yMin)
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke='rgba(255, 255, 255, 0.07)'
                      strokeDasharray='3 3'
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3}
                      fill='#64748b'
                      fontSize='9'
                      textAnchor='end'
                      fontFamily='monospace'
                    >
                      {val.toFixed(1)}
                    </text>
                  </g>
                )
              })}

              {/* Area Gradient Fill */}
              {areaPath && (
                <path d={areaPath} fill='url(#stockAreaGrad)' />
              )}

              {/* Main Stock Trend Curved Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill='none'
                  stroke={strokeColor}
                  strokeWidth='2.8'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              )}

              {/* Hover Crosshair Line */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={padTop}
                  x2={activePoint.x}
                  y2={padTop + plotHeight}
                  stroke='#94a3b8'
                  strokeWidth='1.2'
                  strokeDasharray='4 2'
                />
              )}

              {/* Data Points and Direction Indicators */}
              {chartPoints.map((pt, idx) => {
                const isHovered = hoveredIndex === idx
                const isUp = pt.direction === 'up'
                const isDown = pt.direction === 'down'
                const dotColor = isDown ? '#ef4444' : (isUp ? '#10b981' : '#38bdf8')

                return (
                  <g
                    key={pt.year}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Invisible larger hit target */}
                    <circle cx={pt.x} cy={pt.y} r='14' fill='transparent' />

                    {/* Outer Glow Halo on Hover */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r='9'
                        fill='none'
                        stroke={dotColor}
                        strokeWidth='2'
                        opacity='0.6'
                      />
                    )}

                    {/* Node Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '6' : '4.5'}
                      fill={dotColor}
                      stroke='#0f172a'
                      strokeWidth='2'
                      filter='url(#nodeGlow)'
                    />

                    {/* Small Arrow indicator above/below node */}
                    {pt.direction !== 'baseline' && (
                      <text
                        x={pt.x}
                        y={pt.y - 9}
                        fill={dotColor}
                        fontSize='10'
                        fontWeight='bold'
                        textAnchor='middle'
                      >
                        {isUp ? '↑' : isDown ? '↓' : '•'}
                      </text>
                    )}

                    {/* X-Axis Year Label */}
                    <text
                      x={pt.x}
                      y={padTop + plotHeight + 18}
                      fill={isHovered ? '#ffffff' : '#94a3b8'}
                      fontSize='10'
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      textAnchor='middle'
                    >
                      {pt.year}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Active Hover Floating Tooltip */}
            {activePoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', marginBottom: '3px' }}>
                  📅 سنة الرفع: {activePoint.year}
                </div>
                <div>المساحة: <strong>{activePoint.totalArea} فدان</strong></div>
                <div>القطع: <strong>{activePoint.parcelCount} قطعة</strong></div>
                {activePoint.direction !== 'baseline' && (
                  <div style={{ color: activePoint.direction === 'up' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {activePoint.direction === 'up' ? '▲ زيادة' : '▼ نقص'}: {activePoint.deltaArea > 0 ? '+' : ''}{activePoint.deltaArea} فدان
                    {activePoint.percentChange != null && ` (${activePoint.percentChange}%)`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Year-by-Year Breakdown List */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📋</span>
              <span>سجل التطور السنوي لقطع الأراضي والمساحات:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {summary.yearsData.map((d, idx) => {
                const isUp = d.direction === 'up'
                const isDown = d.direction === 'down'
                const isBase = d.direction === 'baseline'
                const isRowHovered = hoveredIndex === idx

                return (
                  <div
                    key={d.year}
                    className='pyc-row'
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isRowHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isRowHovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out'
                    }}
                  >
                    {/* Year badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '70px' }}>
                      <span
                        style={{
                          background: isRowHovered ? '#38bdf8' : '#334155',
                          color: isRowHovered ? '#0f172a' : '#f8fafc',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}
                      >
                        {d.year}
                      </span>
                    </div>

                    {/* Parcels count */}
                    <div style={{ color: '#cbd5e1', minWidth: '80px' }}>
                      <span style={{ color: '#94a3b8' }}>➔ </span>
                      <strong>{d.parcelCount}</strong> قطعة
                    </div>

                    {/* Total Area */}
                    <div style={{ fontWeight: 700, color: '#f8fafc', minWidth: '95px' }}>
                      <span style={{ color: '#94a3b8' }}>➔ </span>
                      <strong>{d.totalArea}</strong> فدان
                    </div>

                    {/* Up / Down Trend Indicator */}
                    <div style={{ textAlign: 'left', minWidth: '110px' }}>
                      {isBase ? (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          (سنة الأساس)
                        </span>
                      ) : (
                        <span
                          className={isUp ? 'pyc-badge-up' : isDown ? 'pyc-badge-down' : 'pyc-badge-neutral'}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>{isUp ? '↑' : isDown ? '↓' : '•'}</span>
                          <span>{d.deltaArea > 0 ? '+' : ''}{d.deltaArea} فدان</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Mounts the PersonYearComparison component into a target DOM node.
 * Supports React 17 (ReactDOM.render) and React 18+ (ReactDOM.createRoot).
 * Returns an unmount cleanup function.
 */
export function mountPersonYearComparison (
  container: HTMLElement,
  props: PersonYearComparisonProps
): () => void {
  try {
    const rd = (ReactDOM as any) || (window as any).ReactDOM || (window as any).jimuCore?.ReactDOM
    if (!rd) {
      console.error('ReactDOM is not available to mount PersonYearComparison')
      return () => {}
    }

    if (typeof rd.createRoot === 'function') {
      const root = rd.createRoot(container)
      root.render(React.createElement(PersonYearComparison, props))
      return () => {
        try {
          root.unmount()
        } catch (e) {}
      }
    } else if (typeof rd.render === 'function') {
      rd.render(React.createElement(PersonYearComparison, props), container)
      return () => {
        try {
          rd.unmountComponentAtNode(container)
        } catch (e) {}
      }
    } else {
      console.error('Neither createRoot nor render is available on ReactDOM:', rd)
    }
  } catch (err) {
    console.error('Failed to mount PersonYearComparison:', err)
  }
  return () => {}
}

export default PersonYearComparison
