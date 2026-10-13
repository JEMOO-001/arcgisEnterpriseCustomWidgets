/** @jsx jsx */
import {
  AppMode,
  React,
  ReactRedux,
  css,
  hooks,
  jsx,
  type AllWidgetProps,
  type IMState,
  type IMThemeButtonStylesByState
} from 'jimu-core'
import { styleUtils } from 'jimu-ui'
import {
  WIDGET_ITEM_SIZES
} from '../../../../../dist/widgets/common/controller/src/common/consts'
import { versionManager } from '../../../../../dist/widgets/common/controller/src/version-manager'
import type { IMConfig } from '../config'
import { Runtime } from './runtime'

export type ControllerWidgetProps = AllWidgetProps<IMConfig>

const useStyle = (autoSize: boolean, autoWidth: boolean, autoHeight: boolean) => {
  const minWidth = !autoSize ? WIDGET_ITEM_SIZES.sm : 0
  const minHeight = !autoSize ? WIDGET_ITEM_SIZES.sm : 0
  const px = autoWidth ? '5px' : 0
  const py = autoHeight ? '5px' : 0
  return React.useMemo(() => css`
    overflow: visible;
    white-space: nowrap;
    .controller-container {
      width: 100%;
      height: 100%;
      padding: ${py} ${px};
      min-width: ${minWidth}px;
      min-height: ${minHeight}px;
    }
  `, [minHeight, minWidth, px, py])
}

const useAdvancedStyle = (variant: IMThemeButtonStylesByState, advanced: boolean) => {
  const regular = variant?.default
  const active = variant?.active
  const hover = variant?.hover
  return React.useMemo(() => {
    if (!advanced) return css``
    return css`
      .avatar-card:not(.add-widget-btn) {
        ${regular && css`
          > .avatar > .avatar-button {
            background-color: ${regular.bg};
            border-color: ${regular.bg};
          }
          > .avatar-label {
            color: ${regular.color};
            font-style: ${regular?.italic ? 'italic' : 'normal'};
            font-weight: ${regular?.bold ? 'bold' : 'normal'};
            text-decoration: ${styleUtils.toCSSTextUnderLine({ underline: regular.underline, strike: regular.strike })};
          }
        `}
        ${hover && css`
          &:hover {
            > .avatar > .avatar-button {
              background-color: ${hover.bg};
              border-color: ${hover.bg};
            }
            > .avatar-label {
              color: ${hover.color};
              font-style: ${hover?.italic ? 'italic' : 'normal'};
              font-weight: ${hover?.bold ? 'bold' : 'normal'};
              text-decoration: ${styleUtils.toCSSTextUnderLine({ underline: hover.underline, strike: hover.strike })};
            }
          }
        `}
        ${active && css`
          > .avatar > .avatar-button {
            &:not(:disabled):not(.disabled):active,
            &:not(:disabled):not(.disabled).active,
            &[aria-expanded='true'] {
              background-color: ${active.bg};
              border-color: ${active.bg};
            }
          }
          > .avatar::after { background-color: ${active.bg}; }
          > .avatar-label {
            color: ${active.color};
            font-style: ${active?.italic ? 'italic' : 'normal'};
            font-weight: ${active?.bold ? 'bold' : 'normal'};
            text-decoration: ${styleUtils.toCSSTextUnderLine({ underline: active.underline, strike: active.strike })};
          }
        `}
      }
    `
  }, [active, advanced, hover, regular])
}

const PermissionController = (props: ControllerWidgetProps) => {
  const {
    builderSupportModules,
    id,
    config,
    onInitResizeHandler,
    autoWidth,
    autoHeight
  } = props
  const vertical = config?.behavior?.vertical
  const autoSize = vertical ? autoHeight : autoWidth
  const isInBuilder = ReactRedux.useSelector((state: IMState) => state.appContext.isInBuilder)
  const appMode = ReactRedux.useSelector((state: IMState) => state.appRuntimeInfo.appMode)
  const isBuilder = isInBuilder && appMode !== AppMode.Run
  const Builder = isBuilder && builderSupportModules?.widgetModules?.Builder
  const [version, setVersion] = React.useState(0)

  React.useEffect(() => {
    onInitResizeHandler?.(null, null, () => { setVersion(value => value + 1) })
  }, [onInitResizeHandler])
  hooks.useUpdateEffect(() => {
    setVersion(value => value + 1)
  }, [config?.behavior?.onlyOpenOne, config?.behavior?.displayType, appMode])

  const style = useStyle(autoSize, autoWidth, autoHeight)
  const advancedStyle = useAdvancedStyle(
    config?.appearance?.card?.variant,
    config?.appearance?.advanced
  )

  return (
    <div className='widget-controller permission-widget-controller jimu-widget rw-controller' css={[style, advancedStyle]}>
      <div className='controller-container'>
        {!isBuilder && <Runtime id={id} version={version} config={config} autoSize={autoSize} />}
        {isBuilder && Builder && (
          <Builder id={id} config={config} version={version} autoSize={autoSize} />
        )}
      </div>
    </div>
  )
}

PermissionController.versionManager = versionManager

export default PermissionController
