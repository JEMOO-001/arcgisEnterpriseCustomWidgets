import { type JimuFieldType, React, hooks } from 'jimu-core'
import { CategoryType } from '../../../../../../../../config'
import { ByFieldColorList } from './by-field'
import { ByGroupColorList, type ByGroupColorListProps } from './by-group'
import defaultMessages from '../../../../../../../translations/default'
import { SidePopperTooltip } from '../../../../../../components'
interface ColorListProps extends ByGroupColorListProps {
  open?: boolean
  trigger?: HTMLElement
  useFeatureLayerDataSource?: boolean
  categoryFieldType: JimuFieldType
  onRequestClose?: () => void
  categoryType: CategoryType
}

const totalNumberLimit = 50
const numberPerLoads = 20
export const ColorList = (props: ColorListProps) => {
  const { open, trigger, onRequestClose, categoryType, useFeatureLayerDataSource, categoryFieldType, value, onChange, onColorsChange, ...others } = props
  const translate = hooks.useTranslation(defaultMessages)
  const tooltip = categoryType === CategoryType.ByGroup ? translate('sliceColorTip', { numberPerLoads, totalNumberLimit }) : ''

  return <SidePopperTooltip
    trigger={trigger}
    backToFocusNode={trigger}
    position='right'
    isOpen={open}
    title={translate('sliceColor')}
    tooltip={tooltip}
    toggle={onRequestClose}
  >
    {categoryType === CategoryType.ByGroup && (
      <ByGroupColorList
        value={value}
        useFeatureLayerDataSource={useFeatureLayerDataSource}
        categoryFieldType={categoryFieldType}
        onColorsChange={onColorsChange}
        onChange={onChange}
        {...others}
      />
    )}
    {categoryType === CategoryType.ByField && (
      <ByFieldColorList
        onColorsChange={onColorsChange}
        value={value}
        onChange={onChange}
      />
    )}
  </SidePopperTooltip>
}
