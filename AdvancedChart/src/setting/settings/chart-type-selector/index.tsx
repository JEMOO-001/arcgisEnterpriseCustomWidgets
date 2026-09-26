/** @jsx jsx */
import { React, css, jsx, polished, type SerializedStyles, type ImmutableObject, type UseDataSource, type ImmutableArray, classNames, hooks } from 'jimu-core'
import { Button, defaultMessages as jimuiDefaultMessage, Icon } from 'jimu-ui'
import { type IWebChart } from '../../../config'
import defaultMessages from '../../translations/default'
import { SidePopper } from 'jimu-ui/advanced/setting-components'
import Templates, { getMainTypeTranslation, getTemplateIcon } from './templates'
import { useTheme } from 'jimu-theme'
import completeChart from './utils/complete-chart'

export interface ChartTypeSelectorProps {
  templateId: string
  webChart: ImmutableObject<IWebChart>
  useDataSources: ImmutableArray<UseDataSource>
  onChange: (template: string, webChart: ImmutableObject<IWebChart>) => void
}

const useStyle = (): SerializedStyles => {
  const theme = useTheme()
  return React.useMemo(
    () => css`
    button.btn-link {
      height: ${polished.rem(32)};
      line-height: ${polished.rem(32)};
      padding: 0;
      border: 1px dashed ${theme?.ref.palette.neutral[800]};
      border-radius: ${polished.rem(2)};
      cursor: pointer;
      color: ${theme?.sys.color.primary.light};
      font-size: ${polished.rem(14)};
      text-decoration: none;
      font-weight: 500;
      &:hover{
        border-color: ${theme?.ref.palette.neutral[900]};
        color: ${theme?.sys.color.primary.light};
      }
    }`,
    [theme]
  )
}

const ChartTypeSelector = (props: ChartTypeSelectorProps): React.ReactElement => {
  const { templateId, webChart, useDataSources, onChange } = props
  const style = useStyle()
  const translate = hooks.useTranslation(defaultMessages, jimuiDefaultMessage)
  const [open, setOpen] = React.useState(false)

  const [templateIcon, templateLabel] = React.useMemo(() => {
    if (!templateId) return []
    const icon = getTemplateIcon(webChart)
    const label = translate(getMainTypeTranslation(webChart))
    return [icon, label]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  const ref = React.useRef<HTMLButtonElement>(null)

  const handleChange = (template: IWebChart): void => {
    const webChart = completeChart(template)
    onChange?.(template.id, webChart)
    setOpen(false)
  }

  return (
    <React.Fragment>
      <div className="chart-type-selector w-100" css={style}>
        <Button
          ref={ref}
          type={templateId ? 'default' : 'link'}
          title={templateId ? templateLabel : translate('selectChart')}
          aria-label={templateId ? templateLabel : translate('selectChart')}
          className={classNames('w-100', { 'text-left pl-2 pr-2': templateId })}
          onClick={() => { setOpen(v => !v) }}>
          {templateId && <Icon icon={templateIcon} />}
          {templateId ? templateLabel : translate('selectChart')}
        </Button>
      </div>

      <SidePopper isOpen={open} position="right" toggle={() => { setOpen(false) }} trigger={ref?.current} backToFocusNode={ref?.current} title={translate('chartType')}>
        <Templates className='px-4' useDataSources={useDataSources} templateId={templateId} onChange={handleChange} />
      </SidePopper>
    </React.Fragment>
  )
}

export * from './templates/buildin-templates'

export default ChartTypeSelector
