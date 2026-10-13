import type { ImmutableObject } from 'seamless-immutable'
import type { Config as ControllerConfig } from '../../../../dist/widgets/common/controller/src/config'

export {
  DisplayType
} from '../../../../dist/widgets/common/controller/src/config'
export type {
  ActionConfig,
  IMActionConfig,
  IMSizeMap,
  SizeMap,
  WidgetAvatarCard
} from '../../../../dist/widgets/common/controller/src/config'

export interface PortalGroupInfo {
  id: string
  title: string
}

export type WidgetAccessMode = 'everyone' | 'groups'

export interface WidgetAccessRule {
  mode: WidgetAccessMode
  groups: PortalGroupInfo[]
}

export interface WidgetAccessMap {
  [widgetId: string]: WidgetAccessRule
}

export interface Config extends ControllerConfig {
  widgetAccess?: WidgetAccessMap
}

export type IMConfig = ImmutableObject<Config>
