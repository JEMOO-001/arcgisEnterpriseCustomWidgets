/** @jsx jsx */
import { React, jsx, css, classNames, type ImmutableObject, getAppStore, hooks, type DataRecordSet, ReactRedux, type IMState } from 'jimu-core'
import { DataActionList, DataActionListStyle, defaultMessages } from 'jimu-ui'
import { type ChartTools } from '../../../config'
import { type RangeCursorModeValue } from './range-cursor-mode'
import { useChartRuntimeState } from '../../state'
import { SelectionZoom } from './selection-zoom'
import { ActionMode, type ChartTypes } from 'jimu-ui/advanced/chart'

interface ToolsProps {
  type: ChartTypes
  widgetId: string
  className?: boolean
  tools?: ImmutableObject<ChartTools>
  enableDataAction?: boolean
}

const style = css`
  .tool-dividing-line {
    height: 16px;
    width: 1px;
    background-color: var(--ref-palette-neutral-500);
  }
`

const Tools = (props: ToolsProps): React.ReactElement => {
  const { type = 'barSeries', className, widgetId, tools, enableDataAction } = props

  const translate = hooks.useTranslation(defaultMessages)
  const widgetLabel = getAppStore().getState().appConfig.widgets?.[widgetId]?.label ?? 'Chart'
  const dataActionLabel = translate('outputStatistics', { name: widgetLabel })
  const { outputDataSource, chart } = useChartRuntimeState()
  const cursorEnable = tools?.cursorEnable

  const dividerVisible = cursorEnable && enableDataAction

  const selectedIds = ReactRedux.useSelector((state: IMState) => state?.dataSourcesInfo[outputDataSource?.id]?.selectedIds)
  const actionDataSets: DataRecordSet[] = React.useMemo(() => {
    return outputDataSource ? [{ name: dataActionLabel, type: 'selected', dataSource: outputDataSource, records: outputDataSource?.getSelectedRecords() }] : []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataActionLabel, outputDataSource, selectedIds])

  const handleRangeModeChange = (mode: RangeCursorModeValue) => {
    if (mode === 'selection') {
      chart?.setActionMode(ActionMode.MultiSelectionWithCtrlKey)
    } else if (mode === 'zoom') {
      chart?.setActionMode(ActionMode.Zoom)
    }
  }

  const handleClearSelection = () => {
    chart?.clearSelection()
  }

  React.useEffect(() => {
    if (cursorEnable) {
      chart?.setActionMode(ActionMode.MultiSelectionWithCtrlKey)
    } else {
      chart?.setActionMode(ActionMode.None)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorEnable, chart])

  return (
    <div
      css={style}
      className={classNames(
        'chart-tool-bar w-100 d-flex align-items-center justify-content-end px-2 pt-2',
        className
      )}
      role='group'
      aria-label={translate('tools')}
    >
      {cursorEnable && (
        <SelectionZoom
          type={type}
          className='mr-1'
          onModeChange={handleRangeModeChange}
          onClearSelection={handleClearSelection}
        />
      )}

      {dividerVisible && <span className='tool-dividing-line mx-1'></span>}

      {enableDataAction && <DataActionList
        widgetId={widgetId}
        buttonType='tertiary'
        listStyle={DataActionListStyle.Dropdown}
        dataSets={actionDataSets}
      />}
    </div>
  )
}

export default Tools
