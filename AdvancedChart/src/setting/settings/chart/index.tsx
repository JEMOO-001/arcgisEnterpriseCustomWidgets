import { type IMFeatureLayerQueryParams, type ImmutableArray, type ImmutableObject, React, type UseDataSource, hooks } from 'jimu-core'
import { SettingSection } from 'jimu-ui/advanced/setting-components'
import { type ChartComponentProps, type ChartTools, type IWebChart } from '../../../config'
import { CollapsablePanel, defaultMessages } from 'jimu-ui'
import { Tools } from './universal'
import WebChartSetting from './web-chart'
import { ChartSettingSection } from './type'
import { type ChartTypes } from 'jimu-ui/advanced/chart'

interface ChartSettingProps {
  type: ChartTypes
  tools: ImmutableObject<ChartTools>
  webChart: ImmutableObject<IWebChart>
  options: ImmutableObject<ChartComponentProps>
  useDataSources: ImmutableArray<UseDataSource>
  onOptionsChange: (options: ImmutableObject<ChartComponentProps>) => void
  onToolsChange: (tools: ImmutableObject<ChartTools>) => void
  onWebChartChange: (webChart: ImmutableObject<IWebChart>, query?: IMFeatureLayerQueryParams) => void
}

const ChartSetting = (props: ChartSettingProps) => {
  const {
    type,
    tools,
    options,
    webChart,
    useDataSources,
    onToolsChange,
    onWebChartChange,
    onOptionsChange
  } = props
  const translate = hooks.useTranslation(defaultMessages)
  const [section, setSection] = React.useState(ChartSettingSection.Data)

  return (
    <>
      <WebChartSetting
        type={type}
        section={section}
        onSectionChange={setSection}
        webChart={webChart}
        options={options}
        useDataSources={useDataSources}
        onWebChartChange={onWebChartChange}
        onOptionsChange={onOptionsChange}
      />
     { type !== 'gaugeSeries' && <SettingSection>
        <CollapsablePanel
          label={translate('tools')}
          aria-label={translate('tools')}
          isOpen={section === ChartSettingSection.Tools}
          onRequestOpen={() => { setSection(ChartSettingSection.Tools) }}
          onRequestClose={() => { setSection(ChartSettingSection.None) }}
        >
          <Tools type={type} tools={tools} onChange={onToolsChange} />
        </CollapsablePanel>
      </SettingSection>}
    </>
  )
}

export default ChartSetting
