import {
  React,
  appActions,
  getAppStore,
  hooks,
  ReactRedux,
  type IMRuntimeInfos,
  type IMState,
  type Size
} from 'jimu-core'
import {
  DEFAULT_PANEL_SIZE,
  DEFAULT_PANEL_SPACE,
  DEFAULT_WIDGET_START_POSITION
} from '../../../../../dist/widgets/common/controller/src/common/consts'
import { isWidgetOpening } from '../../../../../dist/widgets/common/controller/src/runtime/common/layout-utils'
import { MobileWidgetLuncher } from '../../../../../dist/widgets/common/controller/src/runtime/runtime/mobile-widget-luncher'
import { MultipleWidgetsLuncher } from '../../../../../dist/widgets/common/controller/src/runtime/runtime/multiple-widgets-luncher'
import { SingleWidgetsLuncher } from '../../../../../dist/widgets/common/controller/src/runtime/runtime/single-widget-luncher'
import {
  useContainerMapId,
  useWhetherWidgetVisible
} from '../../../../../dist/widgets/common/controller/src/runtime/runtime/widgets-launcher'
import { getWidgetCardNode } from '../../../../../dist/widgets/common/controller/src/runtime/runtime/utils'
import type { IMConfig } from '../config'

interface WidgetsLauncherProps {
  id: string
  config: IMConfig
  version: number
  rootRef: React.RefObject<HTMLDivElement>
  widgets: IMRuntimeInfos
  onResizeStop?: (widgetId: string, size: Size) => void
}

export default function WidgetsLauncher (props: WidgetsLauncherProps) {
  const { id, config, version, rootRef, widgets, onResizeStop } = props
  const mobile = hooks.useCheckSmallBrowserSizeMode()
  const onlyOpenOne = config.behavior?.onlyOpenOne
  const arrangement = config?.behavior?.arrangement ?? 'floating'
  const singleFloatingMode = onlyOpenOne && arrangement === 'floating'
  const multiFloatingMode = !onlyOpenOne && arrangement === 'floating'
  const widgetIds = Object.keys(widgets)
  const openingWidgets = widgetIds.filter(widgetId => isWidgetOpening(widgets[widgetId]))

  const handleCloseWidget = React.useCallback((widgetId: string) => {
    if (!widgetId) return
    getAppStore().dispatch(appActions.closeWidget(widgetId))
    getWidgetCardNode(widgetId)?.focus()
    getAppStore().dispatch(appActions.selectionChanged(null))
  }, [])

  const containerMapId = useContainerMapId(id)
  const placement = !config.behavior?.vertical ? 'bottom' : 'right-start'
  const displayType = config.behavior?.displayType
  const isRTL = getAppStore()?.getState()?.appContext?.isRTL
  const start = React.useMemo(() => isRTL
    ? { ...DEFAULT_WIDGET_START_POSITION, x: document.body.clientWidth - DEFAULT_PANEL_SIZE.width - DEFAULT_WIDGET_START_POSITION.x }
    : DEFAULT_WIDGET_START_POSITION, [isRTL])
  const space = React.useMemo(() => isRTL
    ? { ...DEFAULT_PANEL_SPACE, x: -DEFAULT_PANEL_SPACE.x }
    : DEFAULT_PANEL_SPACE, [isRTL])
  const size = config.behavior?.size
  const currentPageId = ReactRedux.useSelector((state: IMState) => state.appRuntimeInfo.currentPageId)

  hooks.useUpdateEffect(() => {
    getAppStore().dispatch(appActions.resetWidgetsState(widgetIds))
  }, [version, currentPageId])

  const visible = useWhetherWidgetVisible(id)
  const isInBuilder = ReactRedux.useSelector((state: IMState) => state.appContext.isInBuilder)
  const widgetIdsKey = widgetIds.join('|')
  const openStarts = React.useMemo(() => {
    return (config.behavior?.openStarts as unknown as string[] || [])
      .filter(widgetId => widgetIds.includes(widgetId))
    // widgetIdsKey represents the permission-filtered child set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.behavior?.openStarts, widgetIdsKey])
  const openStartsKey = openStarts.join('|')
  const openingWidgetsKey = openingWidgets.join('|')
  const openedAtStartRef = React.useRef('')

  React.useEffect(() => {
    if (!visible) {
      openedAtStartRef.current = ''
      const openingWidgetIds = openingWidgetsKey ? openingWidgetsKey.split('|') : []
      getAppStore().dispatch(appActions.closeWidgets(openingWidgetIds))
      return
    }
    if (isInBuilder || openStarts.length === 0 || openedAtStartRef.current === openStartsKey) return

    const timer = setTimeout(() => {
      getAppStore().dispatch(appActions.openWidgets(openStarts, id))
      openedAtStartRef.current = openStartsKey
    }, 1000)
    return () => { clearTimeout(timer) }
  }, [id, isInBuilder, openStarts, openStartsKey, openingWidgetsKey, visible])

  return (
    <React.Fragment>
      {mobile && <MobileWidgetLuncher containerMapId={containerMapId} controllerId={id} widgets={widgets} onClose={handleCloseWidget} />}
      {!mobile && singleFloatingMode && <SingleWidgetsLuncher sizes={size} root={rootRef.current} placement={placement} controllerId={id} widgets={widgets} onResizeStop={onResizeStop} onClose={handleCloseWidget} />}
      {!mobile && multiFloatingMode && <MultipleWidgetsLuncher sizes={size} mode={displayType} start={start} spaceX={space.x} spaceY={space.y} controllerId={id} widgets={widgets} onResizeStop={onResizeStop} onClose={handleCloseWidget} />}
    </React.Fragment>
  )
}
