/** @jsx jsx */
import { React, jsx, Immutable, type UseDataSource, defaultMessages as jimucoreMessages, type ImmutableObject, getAppStore, AllDataSourceTypes, hooks, type DataSourceJson, DataSourceManager } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { defaultMessages as jimuiMessages, Switch, Button, Tabs, Tab } from 'jimu-ui'
import { SettingRow, SettingSection, SidePopper } from 'jimu-ui/advanced/setting-components'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { type ChartComponentProps, type ChartTools, type IMConfig, type IWebChart } from '../config'
import { ChartSettings } from './settings'
import defaultMessages from './translations/default'
import { getSeriesType } from 'jimu-ui/advanced/chart'
import OutputSourceManager from './data-source'
import { isGaugeChart, getChartText, DefaultTitleSize, DefaultTitleColor } from '../utils/default'
import utilities from './style'
import { DefaultChartComponentProps } from '../constants'
import { FieldSelector } from './settings/chart/web-chart/components'

const SupportImageryLayer = false

const ImageryTypes = [AllDataSourceTypes.OrientedImageryLayer, AllDataSourceTypes.ImageryLayer]

const SUPPORTED_TYPES = Immutable([AllDataSourceTypes.FeatureLayer, AllDataSourceTypes.SceneLayer, AllDataSourceTypes.BuildingComponentSubLayer].concat(SupportImageryLayer ? ImageryTypes : []))

const getDefaultToolsOption = (seriesType?: string) => {
  const isGauge = isGaugeChart(seriesType)
  return isGauge ? { cursorEnable: false } : { cursorEnable: true }
}

const DefaultOptions = Immutable(DefaultChartComponentProps)

type SettingProps = AllWidgetSettingProps<IMConfig>

const Setting = (props: SettingProps): React.ReactElement => {
  const {
    id,
    useDataSources: propUseDataSources,
    outputDataSources: propOutputDataSources,
    onSettingChange,
    config: propConfig,
    label
  } = props

  const translate = hooks.useTranslation(defaultMessages, jimuiMessages, jimucoreMessages)

  const [activeTab, setActiveTab] = React.useState<'primary' | 'rechart'>('primary')
  const [rechartSidePopperOpen, setRechartSidePopperOpen] = React.useState(false)
  const rechartBtnRef = React.useRef<HTMLButtonElement>(null)

  const { template = '', webChart, tools, options = DefaultOptions } = propConfig
  const seriesType = getSeriesType(webChart?.series as any) ?? 'barSeries'
  const outputDataSourceId = propOutputDataSources?.[0] ?? ''
  const outputDataSourceLabel = translate('outputStatistics', { name: label })
  const autoZoomToParcel = options?.autoZoomToParcel ?? true

  // Rechart configurations
  const rechartConfig = propConfig?.rechart
  const rechartEnabled = !!rechartConfig?.enabled
  const rechartTemplate = rechartConfig?.template ?? ''
  const rechartWebChart = rechartConfig?.webChart
  const rechartSeriesType = getSeriesType(rechartWebChart?.series as any) ?? 'barSeries'
  const rechartTools = rechartConfig?.tools ?? Immutable(getDefaultToolsOption(rechartSeriesType))
  const rechartOptions = rechartConfig?.options ?? DefaultOptions

  // Trigger field configuration
  const primaryCategoryField = (webChart?.dataSource?.query?.groupByFieldsForStatistics?.[0]) || (webChart?.series?.[0] as any)?.x
  const currentTriggerField = rechartConfig?.filterField || primaryCategoryField
  const triggerFields = React.useMemo(() => {
    return currentTriggerField ? Immutable([currentTriggerField]) : Immutable([])
  }, [currentTriggerField])

  const handleTriggerFieldChange = (fields: string[]) => {
    const field = fields?.[0] ?? ''
    const config = propConfig.setIn(['rechart', 'filterField'], field)
    onSettingChange({ id, config })
  }

  const handleUseDataSourceChange = (useDataSources: UseDataSource[]): void => {
    const config = propConfig.without('webChart').set('tools', getDefaultToolsOption()).without('template')
    if (outputDataSourceId) {
      let outputDataSourceJson = DataSourceManager.getInstance().getDataSource(outputDataSourceId).getDataSourceJson()
      outputDataSourceJson = outputDataSourceJson.set('originDataSources', useDataSources)
      onSettingChange({ id, useDataSources, config }, [outputDataSourceJson.asMutable({ deep: true })])
    } else {
      onSettingChange({ id, useDataSources, config })
    }
  }

  const handleOutputCreate = (dataSourceJson: DataSourceJson) => {
    onSettingChange({ id }, [dataSourceJson])
  }

  const handleFieldsChange = (fields: string[]) => {
    const useDataSources = Immutable.setIn(propUseDataSources, ['0', 'fields'], fields).asMutable({ deep: true })
    onSettingChange({ id, useDataSources })
  }

  const handleTemplateChange = (templateId: string, webChart: ImmutableObject<IWebChart>): void => {
    const seriesType = getSeriesType(webChart.series as any)
    const config = propConfig.set('template', templateId).set('webChart', webChart).set('tools', getDefaultToolsOption(seriesType))
    onSettingChange({ id, config })
  }

  //Update output ds label when the label of widget changes
  React.useEffect(() => {
    const outputDataSource = getAppStore().getState().appStateInBuilder.appConfig?.dataSources?.[outputDataSourceId]
    if (outputDataSource && outputDataSource.label !== outputDataSourceLabel) {
      onSettingChange({ id }, [{ id: outputDataSourceId, label: outputDataSourceLabel }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputDataSourceLabel])

  const handleWebChartChange = (webChart: ImmutableObject<IWebChart>): void => {
    let chartToSave = webChart
    const pageSize = chartToSave?.dataSource?.query?.pageSize
    if (pageSize && chartToSave?.title?.content?.text) {
      const currentTitle = chartToSave.title.content.text
      const personWord = (pageSize >= 3 && pageSize <= 10) ? 'أشخاص' : 'شخص'
      if (/\bTop\s+\d+\b/i.test(currentTitle) || /أعلى\s+\d+/i.test(currentTitle)) {
        let syncedTitle = currentTitle
          .replace(/\bTop\s+\d+\b/i, `أعلى ${pageSize}`)
          .replace(/أعلى\s+\d+\s*(?:أشخاص|شخص)?/i, `أعلى ${pageSize} ${personWord}`)
        if (syncedTitle.includes('People by Area') || syncedTitle.includes('by Area')) {
          syncedTitle = syncedTitle.replace(/(?:People\s+)?by\s+Area/i, `${personWord} حسب المساحة`)
        }
        if (syncedTitle.includes('Airport Name')) {
          syncedTitle = syncedTitle.replace('Airport Name', 'اسم المطار')
        }
        if (syncedTitle.includes(' — ')) {
          syncedTitle = syncedTitle.replace(' — ', ' – ')
        }
        if (syncedTitle.includes(' – ')) {
          const parts = syncedTitle.split(' – ')
          if (parts.length === 2 && /أعلى\s+\d+/i.test(parts[1])) {
            syncedTitle = `${parts[1]} – ${parts[0]}`
          }
        }
        if (syncedTitle !== currentTitle) {
          chartToSave = chartToSave.setIn(['title', 'content', 'text'], syncedTitle)
        }
      }
    }
    const config = propConfig.set('webChart', chartToSave)
    onSettingChange({ id, config })
  }

  const handleToolsChange = (tools: ImmutableObject<ChartTools>): void => {
    onSettingChange({ id, config: propConfig.set('tools', tools) })
  }

  const handleOptionsChange = (options: ImmutableObject<ChartComponentProps>): void => {
    onSettingChange({ id, config: propConfig.set('options', options) })
  }

  const handleAutoZoomToggle = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean): void => {
    const newOptions = (options || DefaultOptions).set('autoZoomToParcel', checked)
    onSettingChange({ id, config: propConfig.set('options', newOptions) })
  }

  // Handlers for Rechart configuration
  const handleRechartToggle = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean): void => {
    const config = propConfig.setIn(['rechart', 'enabled'], checked)
    onSettingChange({ id, config })
    if (checked) {
      setRechartSidePopperOpen(true)
    }
  }

  const handleRechartTemplateChange = (templateId: string, newWebChart: ImmutableObject<IWebChart>): void => {
    const newSeriesType = getSeriesType(newWebChart.series as any)
    let chartWithTitle = newWebChart
    const pageSize = chartWithTitle?.dataSource?.query?.pageSize || 15
    const personWord = (pageSize >= 3 && pageSize <= 10) ? 'أشخاص' : 'شخص'
    if (!chartWithTitle.title || !chartWithTitle.title.content?.text) {
      const defaultDynamicTitle = `أعلى ${pageSize} ${personWord} حسب المساحة – اسم المطار`
      chartWithTitle = chartWithTitle.set('title', getChartText(defaultDynamicTitle, true, DefaultTitleSize, DefaultTitleColor))
    }
    const config = propConfig
      .setIn(['rechart', 'template'], templateId)
      .setIn(['rechart', 'webChart'], chartWithTitle)
      .setIn(['rechart', 'tools'], getDefaultToolsOption(newSeriesType))
    onSettingChange({ id, config })
  }

  const handleRechartWebChartChange = (newWebChart: ImmutableObject<IWebChart>): void => {
    let chartToSave = newWebChart
    const pageSize = chartToSave?.dataSource?.query?.pageSize
    if (pageSize && chartToSave?.title?.content?.text) {
      const currentTitle = chartToSave.title.content.text
      const personWord = (pageSize >= 3 && pageSize <= 10) ? 'أشخاص' : 'شخص'
      if (/\bTop\s+\d+\b/i.test(currentTitle) || /أعلى\s+\d+/i.test(currentTitle)) {
        let syncedTitle = currentTitle
          .replace(/\bTop\s+\d+\b/i, `أعلى ${pageSize}`)
          .replace(/أعلى\s+\d+\s*(?:أشخاص|شخص)?/i, `أعلى ${pageSize} ${personWord}`)
        if (syncedTitle.includes('People by Area') || syncedTitle.includes('by Area')) {
          syncedTitle = syncedTitle.replace(/(?:People\s+)?by\s+Area/i, `${personWord} حسب المساحة`)
        }
        if (syncedTitle.includes('Airport Name')) {
          syncedTitle = syncedTitle.replace('Airport Name', 'اسم المطار')
        }
        if (syncedTitle.includes(' — ')) {
          syncedTitle = syncedTitle.replace(' — ', ' – ')
        }
        if (syncedTitle.includes(' – ')) {
          const parts = syncedTitle.split(' – ')
          if (parts.length === 2 && /أعلى\s+\d+/i.test(parts[1])) {
            syncedTitle = `${parts[1]} – ${parts[0]}`
          }
        }
        if (syncedTitle !== currentTitle) {
          chartToSave = chartToSave.setIn(['title', 'content', 'text'], syncedTitle)
        }
      }
    }
    const config = propConfig.setIn(['rechart', 'webChart'], chartToSave)
    onSettingChange({ id, config })
  }

  const handleRechartToolsChange = (newTools: ImmutableObject<ChartTools>): void => {
    const config = propConfig.setIn(['rechart', 'tools'], newTools)
    onSettingChange({ id, config })
  }

  const handleRechartOptionsChange = (newOptions: ImmutableObject<ChartComponentProps>): void => {
    const config = propConfig.setIn(['rechart', 'options'], newOptions)
    onSettingChange({ id, config })
  }

  return (
    <div className='widget-setting-chart jimu-widget-setting' css={utilities}>
      <div className='w-100 h-100'>
        <div className='w-100'>
          <SettingSection className='d-flex flex-column pb-0'>
            <SettingRow label={translate('data')} flow="wrap" level={1}>
              <DataSourceSelector
                isMultiple={false}
                aria-describedby='chart-blank-msg'
                mustUseDataSource
                types={SUPPORTED_TYPES}
                useDataSources={propUseDataSources}
                onChange={handleUseDataSourceChange}
                widgetId={id}
              />
            </SettingRow>
          </SettingSection>
        </div>

        {propUseDataSources?.length && (
          <div className='px-3 pt-2 pb-1'>
            <Tabs
              type='pills'
              fill
              value={activeTab}
              onChange={(tabId: string) => { setActiveTab(tabId as 'primary' | 'rechart') }}
            >
              <Tab id='primary' title={translate('_widgetLabel')} />
              <Tab id='rechart' title={rechartEnabled ? translate('rechartInside') : translate('rechart')} />
            </Tabs>
          </div>
        )}

        {activeTab === 'primary' && (
          <>
            <ChartSettings
              type={seriesType}
              template={template}
              onTemplateChange={handleTemplateChange}
              useDataSources={propUseDataSources}
              tools={tools}
              options={options}
              webChart={webChart}
              onToolsChange={handleToolsChange}
              onWebChartChange={handleWebChartChange}
              onOptionsChange={handleOptionsChange}
            />
            {propUseDataSources?.length && <OutputSourceManager
              widgetId={id}
              dataSourceId={outputDataSourceId}
              originalUseDataSource={propUseDataSources?.[0]}
              onCreate={handleOutputCreate}
              onFieldsChange={handleFieldsChange} />}

            <SettingSection title={translate('rechart')} className='border-top pt-3 mt-3'>
              <SettingRow label={translate('enableRechart')} flow='no-wrap'>
                <Switch
                  checked={rechartEnabled}
                  onChange={handleRechartToggle}
                />
              </SettingRow>
              {rechartEnabled && (
                <>
                  <SettingRow label={translate('triggerField')} flow='wrap' className='mt-2'>
                    <div className='w-100 text-secondary mb-1' style={{ fontSize: '12px' }}>
                      {translate('triggerFieldTip')}
                    </div>
                    <FieldSelector
                      type='category'
                      useDataSources={propUseDataSources}
                      fields={triggerFields}
                      isMultiple={false}
                      onChange={handleTriggerFieldChange}
                    />
                  </SettingRow>
                  <SettingRow label={translate('zoomToParcel')} flow='no-wrap' className='mt-2'>
                    <Switch
                      checked={autoZoomToParcel}
                      onChange={handleAutoZoomToggle}
                    />
                  </SettingRow>
                  <SettingRow flow='wrap' className='mt-2'>
                    <div className='w-100 text-secondary mb-2' style={{ fontSize: '12px' }}>
                      {translate('rechartTip')}
                    </div>
                    <Button
                      ref={rechartBtnRef}
                      type='primary'
                      className='w-100'
                      onClick={() => { setRechartSidePopperOpen(true) }}
                    >
                      {translate('configureInsideChart')}
                    </Button>
                  </SettingRow>
                </>
              )}
            </SettingSection>
          </>
        )}

        {activeTab === 'rechart' && (
          <>
            <SettingSection title={translate('rechart')} className='pb-2'>
              <SettingRow label={translate('enableRechart')} flow='no-wrap'>
                <Switch
                  checked={rechartEnabled}
                  onChange={handleRechartToggle}
                />
              </SettingRow>
              {!rechartEnabled && (
                <div className='text-secondary mt-2' style={{ fontSize: '13px' }}>
                  {translate('rechartTip')}
                </div>
              )}
              {rechartEnabled && (
                <SettingRow label={translate('triggerField')} flow='wrap' className='mt-2'>
                  <div className='w-100 text-secondary mb-1' style={{ fontSize: '12px' }}>
                    {translate('triggerFieldTip')}
                  </div>
                  <FieldSelector
                    type='category'
                    useDataSources={propUseDataSources}
                    fields={triggerFields}
                    isMultiple={false}
                    onChange={handleTriggerFieldChange}
                  />
                </SettingRow>
                <SettingRow label={translate('zoomToParcel')} flow='no-wrap' className='mt-2'>
                  <Switch
                    checked={autoZoomToParcel}
                    onChange={handleAutoZoomToggle}
                  />
                </SettingRow>
              )}
            </SettingSection>

            {rechartEnabled && (
              <ChartSettings
                type={rechartSeriesType}
                template={rechartTemplate}
                onTemplateChange={handleRechartTemplateChange}
                useDataSources={propUseDataSources}
                tools={rechartTools}
                options={rechartOptions}
                webChart={rechartWebChart}
                onToolsChange={handleRechartToolsChange}
                onWebChartChange={handleRechartWebChartChange}
                onOptionsChange={handleRechartOptionsChange}
              />
            )}
          </>
        )}

        <SidePopper
          isOpen={rechartSidePopperOpen}
          position='right'
          toggle={() => { setRechartSidePopperOpen(false) }}
          trigger={rechartBtnRef?.current}
          backToFocusNode={rechartBtnRef?.current}
          title={translate('rechartConfigTitle')}
        >
          <div className='w-100 h-100 p-3' style={{ overflowY: 'auto' }}>
            <div className='text-secondary mb-3' style={{ fontSize: '12px' }}>
              Choose a chart type and configure dimensions/metrics for the inside chart when only one value is present.
            </div>
            <div className='mb-3'>
              <SettingRow label={translate('triggerField')} flow='wrap'>
                <div className='w-100 text-secondary mb-1' style={{ fontSize: '12px' }}>
                  {translate('triggerFieldTip')}
                </div>
                <FieldSelector
                  type='category'
                  useDataSources={propUseDataSources}
                  fields={triggerFields}
                  isMultiple={false}
                  onChange={handleTriggerFieldChange}
                />
              </SettingRow>
            </div>
            <ChartSettings
              type={rechartSeriesType}
              template={rechartTemplate}
              onTemplateChange={handleRechartTemplateChange}
              useDataSources={propUseDataSources}
              tools={rechartTools}
              options={rechartOptions}
              webChart={rechartWebChart}
              onToolsChange={handleRechartToolsChange}
              onWebChartChange={handleRechartWebChartChange}
              onOptionsChange={handleRechartOptionsChange}
            />
          </div>
        </SidePopper>
      </div>
    </div>
  )
}

export default Setting
