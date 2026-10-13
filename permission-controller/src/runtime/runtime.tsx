import { React, hooks } from 'jimu-core'
import { getListItemLength } from '../../../../../dist/widgets/common/controller/src/runtime/common/utils'
import { ScrollList } from '../../../../../dist/widgets/common/controller/src/runtime/common/scroll-list'
import { WidgetAvatarCard } from '../../../../../dist/widgets/common/controller/src/runtime/common'
import { BASE_LAYOUT_NAME } from '../../../../../dist/widgets/common/controller/src/common/consts'
import { isWidgetOpening } from '../../../../../dist/widgets/common/controller/src/runtime/common/layout-utils'
import { toggleWidget } from '../../../../../dist/widgets/common/controller/src/runtime/runtime/utils'
import type { IMConfig } from '../config'
import WidgetsLauncher from './widgets-launcher'
import { usePermittedWidgets } from './use-permitted-widgets'

export interface RuntimeProps {
  id: string
  config: IMConfig
  version?: number
  autoSize?: boolean
}

export const Runtime = (props: RuntimeProps) => {
  const { id, config, version, autoSize } = props
  const onlyOpenOne = config.behavior?.onlyOpenOne
  const vertical = config.behavior?.vertical
  const card = config?.appearance?.card
  const itemLength = getListItemLength(card as any, config?.appearance?.space)
  const mobile = hooks.useCheckSmallBrowserSizeMode()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const widgets = usePermittedWidgets(id, BASE_LAYOUT_NAME, config)
  const widgetIds = Object.keys(widgets)
  const openingWidgets = widgetIds.filter(widgetId => isWidgetOpening(widgets[widgetId]))

  const handleOpenWidget = React.useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    const widgetId = evt.currentTarget.dataset?.widgetid
    if (!widgetId) return
    const keepOneOpened = mobile ? true : onlyOpenOne
    if (!openingWidgets.includes(widgetId)) evt.stopPropagation()
    toggleWidget(id, widgetId, openingWidgets, keepOneOpened)
  }, [id, mobile, onlyOpenOne, openingWidgets])

  const createItem = React.useCallback((widgetId: string, className: string) => {
    return (
      <WidgetAvatarCard
        {...card as any}
        key={widgetId}
        className={`${className} layout-item`}
        widgetid={widgetId}
        markerEnabled={false}
        active={openingWidgets.includes(widgetId)}
        onClick={handleOpenWidget}
      />
    )
  }, [card, handleOpenWidget, openingWidgets])

  return (
    <div className='controller-runtime w-100 h-100'>
      <WidgetsLauncher id={id} config={config} version={version} rootRef={rootRef} widgets={widgets} />
      <ScrollList
        ref={rootRef}
        className='runtime--scroll-list'
        vertical={vertical}
        itemLength={itemLength}
        space={config.appearance?.space}
        autoHideArrow
        autoSize={autoSize}
        lists={widgetIds}
        createItem={createItem}
      />
    </div>
  )
}
