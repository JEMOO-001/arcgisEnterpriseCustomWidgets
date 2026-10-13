import {
  appActions,
  getAppStore,
  i18n,
  type LayoutContextToolProps,
  type React,
  type extensionSpec
} from 'jimu-core'
import { defaultMessages } from 'jimu-ui'
import PlusOutlined from 'jimu-icons/svg/outlined/editor/plus.svg'

export default class AddWidget implements extensionSpec.ContextToolExtension {
  index = 3
  id = 'permission-controller-add-widget'
  name = 'permission-controller-add-widget'
  widgetId: string

  classes: { [widgetId: string]: React.ComponentClass<unknown> } = {}

  getGroupId () {
    return 'controller-tools'
  }

  getTitle () {
    const intl = i18n.getIntl('_jimu')
    return intl
      ? intl.formatMessage({ id: 'addWidget', defaultMessage: defaultMessages.addWidget })
      : 'Add widget'
  }

  getIcon () {
    return PlusOutlined
  }

  checked (props: LayoutContextToolProps): boolean {
    const controllerId = props.layoutItem.widgetId
    return !!getAppStore().getState().widgetsState[controllerId]?.showWidgetsPanel
  }

  onClick (props: LayoutContextToolProps): void {
    const controllerId = props.layoutItem.widgetId
    const widgetState = getAppStore().getState().widgetsState[controllerId]
    getAppStore().dispatch(appActions.widgetStatePropChange(
      controllerId,
      'showWidgetsPanel',
      !widgetState?.showWidgetsPanel
    ))
  }

  getSettingPanel (): React.ComponentClass<unknown> {
    return null
  }
}
