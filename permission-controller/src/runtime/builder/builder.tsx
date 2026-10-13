/** @jsx jsx */
import {
  AppMode,
  BrowserSizeMode,
  Immutable,
  React,
  ReactRedux,
  appActions,
  css,
  getAppStore,
  jsx,
  type IMState,
  type LayoutItemConstructorProps,
  type Size
} from 'jimu-core'
import { WidgetListPopper } from 'jimu-ui/advanced/setting-components'
import { addItemToLayout } from 'jimu-layouts/layout-builder'
import { appBuilderSync, getAppConfigAction } from 'jimu-for-builder'
import { BASE_LAYOUT_NAME } from '../../../../../../dist/widgets/common/controller/src/common/consts'
import {
  ListPlaceholder,
  ScrollList,
  WidgetAvatarCard
} from '../../../../../../dist/widgets/common/controller/src/runtime/common'
import { getListItemLength } from '../../../../../../dist/widgets/common/controller/src/runtime/common/utils'
import {
  getWidgetChildLayoutJson,
  isWidgetOpening,
  useControlledWidgets
} from '../../../../../../dist/widgets/common/controller/src/runtime/common/layout-utils'
import {
  insertWidgetToLayouts,
  isLayoutItemAcceptedForController
} from '../../../../../../dist/widgets/common/controller/src/runtime/builder/utils'
import { toggleWidget } from '../../../../../../dist/widgets/common/controller/src/runtime/runtime/utils'
import type { IMConfig, IMSizeMap } from '../../config'
import WidgetsLauncher from '../widgets-launcher'

const widgetPanelStyles = css`
  width: 300px;
  height: 300px;
  overflow-y: auto;
`

const builderStyles = css`
  position: relative;
  width: 100%;
  height: 100%;

  .permission-controller-layout {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
`

export interface BuilderProps {
  id: string
  config: IMConfig
  version?: number
  autoSize?: boolean
}

const acceptsChildWidget = (item: LayoutItemConstructorProps): boolean => {
  return !item?.manifest?.properties?.isWidgetController &&
    isLayoutItemAcceptedForController(item)
}

export const Builder = ({ id, config, version, autoSize }: BuilderProps) => {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const insertingRef = React.useRef(false)
  const widgets = useControlledWidgets(id, BASE_LAYOUT_NAME)
  const widgetIds = Object.keys(widgets)
  const openingWidgets = widgetIds.filter(widgetId => isWidgetOpening(widgets[widgetId]))
  const layout = ReactRedux.useSelector((state: IMState) => {
    const layouts = state.appConfig.widgets?.[id]?.layouts?.[BASE_LAYOUT_NAME]
    const currentLayout = getWidgetChildLayoutJson(id, BASE_LAYOUT_NAME)
    return { currentLayout, layouts }
  })
  const widgetsState = ReactRedux.useSelector((state: IMState) => state.widgetsState[id])
  const showWidgetsPanel = !!widgetsState?.showWidgetsPanel
  const browserSizeMode = ReactRedux.useSelector((state: IMState) => state.browserSizeMode)
  const isExpressMode = ReactRedux.useSelector((state: IMState) =>
    state.appRuntimeInfo.appMode === AppMode.Express
  )
  const mobile = browserSizeMode === BrowserSizeMode.Small
  const vertical = config?.behavior?.vertical
  const itemStyle = config?.appearance?.card
  const space = config?.appearance?.space ?? 0
  const itemLength = getListItemLength(itemStyle as any, space)

  const closeWidgetsPanel = React.useCallback(() => {
    getAppStore().dispatch(appActions.widgetStatePropChange(id, 'showWidgetsPanel', false))
  }, [id])

  const handleSelect = React.useCallback(async (item: LayoutItemConstructorProps) => {
    if (!acceptsChildWidget(item) || insertingRef.current) return

    insertingRef.current = true
    try {
      if (isExpressMode) {
        const state = getAppStore().getState()
        const sizeModeLayouts = state.appConfig.widgets?.[id]?.layouts?.[BASE_LAYOUT_NAME]
        const childLayouts = Object.values(sizeModeLayouts || {})
          .map(layoutId => state.appConfig.layouts?.[layoutId])
          .filter(Boolean)
        if (childLayouts.length === 0) throw new Error('Child layouts are unavailable.')
        await insertWidgetToLayouts(childLayouts, item, childLayouts[0].order?.length ?? 0)
      } else {
        const childLayout = getWidgetChildLayoutJson(id, BASE_LAYOUT_NAME)
        if (!childLayout) throw new Error('Child layout is unavailable.')

        let appConfigAction = getAppConfigAction()
        const result = await addItemToLayout(appConfigAction.appConfig, item, childLayout.id)
        appConfigAction = getAppConfigAction(result.updatedAppConfig)
        appConfigAction.adjustOrderOfItem(result.layoutInfo, childLayout.order?.length ?? 0)
        appConfigAction.editLayoutItemProperty(result.layoutInfo, 'bbox', {})
        getAppStore().dispatch(appActions.layoutChanged(appConfigAction.appConfig, { layoutId: childLayout.id }))
      }
      // Keep the picker open, matching Esri's Widget Controller, so several
      // widgets can be added in one pass.
    } catch (error) {
      console.error('Unable to add a widget to Permission Controller.', error)
    } finally {
      insertingRef.current = false
    }
  }, [id, isExpressMode])

  React.useEffect(() => {
    if (browserSizeMode !== BrowserSizeMode.Small || widgetsState?.showWidgetsPanel === undefined) return
    appBuilderSync.publishSidePanelToApp({
      type: 'widget',
      isPlaceholder: false,
      isItemAccepted: acceptsChildWidget,
      onSelect: handleSelect,
      keepPanel: true,
      active: showWidgetsPanel
    })
  }, [browserSizeMode, handleSelect, showWidgetsPanel, widgetsState?.showWidgetsPanel])

  const updateWidgetConfig = React.useCallback((nextConfig: IMConfig) => {
    getAppConfigAction().editWidgetConfig(id, nextConfig).exec()
  }, [id])

  const removeWidget = React.useCallback((widgetId: string) => {
    const childLayout = getWidgetChildLayoutJson(id, BASE_LAYOUT_NAME)
    const layoutItemId = Object.keys(childLayout?.content || {})
      .find(itemId => childLayout.content[itemId]?.widgetId === widgetId)
    if (!childLayout || !layoutItemId) return

    appBuilderSync.publishConfirmDeleteToApp({ layoutId: childLayout.id, layoutItemId })
  }, [id])

  const handleItemClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const widgetId = event.currentTarget.dataset?.widgetid
    if (!widgetId) return
    if (!openingWidgets.includes(widgetId)) event.stopPropagation()
    toggleWidget(id, widgetId, openingWidgets, mobile ? true : config.behavior?.onlyOpenOne)
  }, [config.behavior?.onlyOpenOne, id, mobile, openingWidgets])

  const onWidgetSizeChanged = React.useCallback((widgetId: string, size: Size) => {
    if (!widgetId) return
    let sizes = config?.behavior.size || Immutable({}) as IMSizeMap
    sizes = sizes.set(widgetId, size)
    updateWidgetConfig(config.setIn(['behavior', 'size'], sizes))
  }, [config, updateWidgetConfig])

  const createItem = React.useCallback((widgetId: string, className: string) => (
    <WidgetAvatarCard
      {...itemStyle as any}
      key={widgetId}
      className={`${className} layout-item align-items-center`}
      widgetid={widgetId}
      markerEnabled
      active={openingWidgets.includes(widgetId)}
      onClick={handleItemClick}
      onMarkerClick={() => { removeWidget(widgetId) }}
    />
  ), [handleItemClick, itemStyle, openingWidgets, removeWidget])

  return (
    <div className='controller-builder' css={builderStyles} ref={rootRef}>
      <WidgetsLauncher
        id={id}
        config={config}
        version={version}
        rootRef={rootRef}
        widgets={widgets}
        onResizeStop={onWidgetSizeChanged}
      />

      <div
        className='permission-controller-layout controller-layout'
        data-layoutid={layout.currentLayout?.id}
      >
        {widgetIds.length === 0
          ? <ListPlaceholder
              vertical={vertical}
              space={vertical ? space : itemStyle?.labelGrowth}
              size={itemStyle?.avatar?.size}
            />
          : <ScrollList
              className='layout-item-list'
              vertical={vertical}
              itemLength={itemLength}
              space={space}
              autoHideArrow
              autoSize={autoSize}
              autoScrollEnd
              lists={widgetIds}
              createItem={createItem}
            />}
      </div>

      {showWidgetsPanel && browserSizeMode !== BrowserSizeMode.Small && rootRef.current && (
        <WidgetListPopper
          css={widgetPanelStyles}
          placement='right-start'
          referenceElement={rootRef.current}
          isAccepted={acceptsChildWidget}
          onSelect={handleSelect}
          onClose={closeWidgetsPanel}
        />
      )}
    </div>
  )
}
