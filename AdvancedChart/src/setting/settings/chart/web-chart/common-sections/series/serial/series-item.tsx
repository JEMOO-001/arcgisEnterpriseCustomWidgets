import { type ImmutableObject, React, classNames } from 'jimu-core'
import { DeletableCollapsePanel } from '../../../../../components'
import { type WebChartSeries } from '../../../../../../../config'
import { BarSeriesStyle } from './bar-series-style'
import { LineSeriesStyle } from './line-series-style'
import { DefaultSeriesOutlineColor } from '../../../../../../../utils/default'
import { styled } from 'jimu-theme'
interface SeriesItemProps {
  className?: string
  value: ImmutableObject<WebChartSeries>
  onChange?: (value: ImmutableObject<WebChartSeries>) => void
  isOpen: boolean
  defaultColor?: string
  undefinedItem?: boolean
  deletable?: boolean
  onDelete?: (splitValue: string) => void
  onRequestOpen?: () => void
  onRequestClose?: () => void
}

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: var(--ref-palette-neutral-700);
`

export const SeriesItem = (props: SeriesItemProps): React.ReactElement => {
  const {
    className,
    undefinedItem = false,
    deletable = false,
    isOpen,
    value,
    defaultColor,
    onChange,
    onDelete,
    onRequestOpen,
    onRequestClose
  } = props

  const type = value.type

  const handleDeleteClick = () => {
    onDelete?.(value.id)
  }

  return (
    <>
      {
        undefinedItem && <Divider className='my-4' />
      }
      <DeletableCollapsePanel
        className={classNames('series-style-itemseries-item', className)}
        level={1}
        type='primary'
        bottomLine={false}
        label={value.name}
        isOpen={isOpen}
        deletable={deletable}
        onDelete={handleDeleteClick}
        onRequestOpen={onRequestOpen}
        onRequestClose={onRequestClose}
      >
        {
          type === 'barSeries' && (
            <BarSeriesStyle
              className='mt-4 pb-2'
              labelVisibility={!undefinedItem}
              defaultFillColor={defaultColor}
              defaultLineColor={DefaultSeriesOutlineColor}
              serie={value}
              onChange={onChange}
            />
          )
        }
        {
          type === 'lineSeries' && (
            <LineSeriesStyle
              className='mt-4 pb-2'
              labelVisibility={!undefinedItem}
              defaultFillColor={defaultColor}
              defaultLineColor={defaultColor}
              serie={value}
              onChange={onChange}
            />
          )
        }
      </DeletableCollapsePanel>
    </>
  )
}
