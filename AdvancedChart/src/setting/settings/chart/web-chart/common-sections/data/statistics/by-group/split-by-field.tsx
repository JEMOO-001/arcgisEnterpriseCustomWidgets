import { type ImmutableArray, React, classNames, type QueriableDataSource, DataSourceManager, type UseDataSource, QueryScope, Immutable, hooks, type JimuFieldType } from 'jimu-core'
import { AlertPanel, Loading } from 'jimu-ui'
import { FieldSelector } from '../../../../components'
import { getFieldUniqueValuesParams } from '../../../../../../../../utils/common'
import { MaxInitialSplitBySeriesCount } from '../../../../../../../../constants'
import { styled } from 'jimu-theme'
import defaultMessages from '../../../../../../../translations/default'

interface Props {
  'aria-label'?: string
  className?: string
  splitByField: string
  useDataSources: ImmutableArray<UseDataSource>
  disabled?: boolean
  onChange?: (field: string, values: Array<number | string>, type?: JimuFieldType) => void
}

const Root = styled.div`
  position: relative;
  .split-by-field-container {
    width: 100%;
  }
`

export const SplitByField = (props: Props): React.ReactElement => {
  const {
    className,
    useDataSources,
    splitByField,
    onChange,
    disabled,
    'aria-label': ariaLabel
  } = props

  const translate = hooks.useTranslation(defaultMessages)
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState('')

  const fields = React.useMemo(() => splitByField ? Immutable([splitByField]) : Immutable([]), [splitByField])
  const dataSourceId = useDataSources?.[0]?.dataSourceId
  const ds = React.useMemo(() => DataSourceManager.getInstance().getDataSource(dataSourceId) as QueriableDataSource, [dataSourceId])

  const handleChange = async (fields: string[], types: JimuFieldType[]): Promise<void> => {
    const splitByField = fields[0]
    const splitByFieldType = types[0]
    if (splitByField) {
      try {
        setLoading(true)
        const values = await queryFieldUniqueValues(ds, splitByField)
        if (!values.length) {
          setMessage(translate('featchFieldValueEmpty'))
        } else {
          onChange(splitByField, values, splitByFieldType)
        }
        setLoading(false)
      } catch (error) {
        setLoading(false)
        setMessage(translate('fetchFieldValueFailed'))
        console.error(error?.message ?? error)
      }
    } else {
      onChange(splitByField, [], splitByFieldType)
    }
  }

  const queryFieldUniqueValues = async (dataSource: QueriableDataSource, field: string): Promise<Array<number | string>> => {
    const params = getFieldUniqueValuesParams(field, MaxInitialSplitBySeriesCount)
    const result = await dataSource.query(params, { scope: QueryScope.InConfigView })
    const values: Array<number | string> = result.records
      .map((record): string | number => record.getFieldValue(field))
      .filter((value) => value !== undefined)
    return values
  }

  return (<Root className={classNames('split-by-field w-100', className)}>
    <div className='split-by-field-container'>
      <FieldSelector
        className='split-by-field-selector'
        type='category'
        showEmptyItem={true}
        emptyItemLabel={translate('notUseSplitBy')}
        hideNonIntNumberField={true}
        hideDateField={true}
        hideIdField={true}
        disabled={disabled}
        aria-label={ariaLabel}
        useDataSources={useDataSources}
        isMultiple={false}
        fields={fields}
        onChange={handleChange}
      />
    </div>
    {loading && <Loading type='BAR' />}
    {message && <AlertPanel className='w-100 mt-2' text={message} closable={true} onClose={() => { setMessage('') }} />}
  </Root>)
}
