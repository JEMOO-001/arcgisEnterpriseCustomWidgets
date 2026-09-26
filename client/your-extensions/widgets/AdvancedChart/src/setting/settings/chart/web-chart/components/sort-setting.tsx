/** @jsx jsx */
import { css, Immutable, type ImmutableArray, jsx, hooks } from 'jimu-core'
import { Button, defaultMessages, Select } from 'jimu-ui'
import { parseOrderByField } from '../../../../../utils/common'
import { SortAscendingOutlined } from 'jimu-icons/outlined/directional/sort-ascending'
import { SortDescendingOutlined } from 'jimu-icons/outlined/directional/sort-descending'
export type Order = 'ASC' | 'DESC'

interface SelectedOption {
  name: string
  value: string
}

export interface SorteSettingProps {
  'aria-label'?: string
  value: string
  disabled?: boolean
  fields?: ImmutableArray<SelectedOption>
  onChange: (value: string) => void
}

const style = css`
  .sort-select {
    width: 85%;
  }
  .order-arrow {
    width: 26px;
    height: 26px;
  }
`

export const SorteSetting = (props: SorteSettingProps): React.ReactElement => {
  const { disabled = false, value = ' ASC', fields = Immutable([]), 'aria-label': ariaLabel, onChange } = props
  const [field, order] = parseOrderByField(value)

  const handleOrderChange = (order: Order): void => {
    onChange(`${field} ${order}`)
  }
  const handleFieldChange = (evt: React.MouseEvent<HTMLSelectElement>): void => {
    const field = evt.currentTarget.value
    onChange(`${field} ${order}`)
  }

  return (
    <div className='sorted w-100' css={style}>
      <div className='field-row d-flex align-items-center justify-content-between'>
        <Select
          size='sm'
          className='sort-select'
          value={field}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={handleFieldChange}
        >
          {fields.map((item, index) => (
            <option key={index} value={item.value}>
              {item.name}
            </option>
          ))}
        </Select>
        <OrderArrow
          disabled={disabled}
          value={order as Order}
          onChange={handleOrderChange}
        />
      </div>
    </div>
  )
}

interface OrderArrowProps {
  value: Order
  disabled?: boolean
  onChange: (value: Order) => void
}

export const OrderArrow = ({ disabled = false, value = 'ASC', onChange }: OrderArrowProps): React.ReactElement => {
  const translate = hooks.useTranslation(defaultMessages)
  const label = translate(value === 'ASC' ? 'ascending' : 'decending')

  const handleClick = (): void => {
    onChange(value === 'DESC' ? 'ASC' : 'DESC')
  }

  return (
    <Button title={label} aria-label={label} disabled={disabled} type='tertiary' className='order-arrow' size='sm' icon onClick={handleClick}>
      {value === 'ASC' && <SortAscendingOutlined />}
      {value !== 'ASC' && <SortDescendingOutlined />}
    </Button>
  )
}
