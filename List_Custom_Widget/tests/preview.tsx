import * as React from 'react'
import { createRoot } from 'react-dom/client'
import Widget from '../src/runtime/widget'
import { sdkBoundary } from './sdk-boundary'

const categories = [
  { code: 0, name: 'محافظة القاهرة' },
  { code: 2, name: 'محافظة الجيزة' },
  { code: 3, name: 'محافظة الإسكندرية' },
  { code: 4, name: 'محافظة الوادي الجديد — اسم طويل لاختبار التفاف النص' },
  { code: "O'Brien", name: "O'Brien" }
]

function Preview() {
  const [queries, setQueries] = React.useState<Record<string, string>>({})
  React.useMemo(() => {
    sdkBoundary.dataSource = {
      getRemoteQueryParams: () => ({ where: 'ACTIVE = 1' }),
      layer: {
        fields: [{ name: 'CATEGORY', domain: { codedValues: categories } }],
        queryFeatures: async () => ({ features: categories.map(category => ({ attributes: { CATEGORY: category.code } })) })
      },
      updateQueryParams: (query: { where: string }, widgetId: string) => {
        setQueries(previous => ({ ...previous, [widgetId]: query.where }))
      }
    }
  }, [])
  return (
    <main className="page-renderer">
      <header className="header" data-testid="page-header">
        <div className="header-content">
          {[false, true].map(multi => (
            <div className="widget-renderer category" key={String(multi)}>
              <div className="widget-content">
                <Widget {...{
                  id: multi ? 'multi' : 'single',
                  useDataSources: [{ dataSourceId: 'sample' }],
                  config: { categoryField: 'CATEGORY', enableMultiChoice: multi, buttonLabel: multi ? 'اختيار متعدد' : 'اختيار واحد' }
                } as any} />
              </div>
            </div>
          ))}
        </div>
      </header>
      <section className="page" data-testid="page-body">
        <h1>Header dropdown regression</h1>
        <p>The open menu must appear above this body, even though its normal layer is higher than the header.</p>
        <output aria-label="Single choice filter">Single: {queries.single || '1=1'}</output>
        <output aria-label="Multi choice filter">Multi: {queries.multi || '1=1'}</output>
        <div className="sample-list">Sample map/list region · existing filter: ACTIVE = 1</div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
