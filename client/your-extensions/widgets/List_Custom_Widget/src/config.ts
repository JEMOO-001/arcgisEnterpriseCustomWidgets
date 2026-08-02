import { type ImmutableObject } from 'jimu-core'

export interface Config {
  categoryField: string
  mapWidgetId: string
  title?: string
  buttonLabel?: string
  allItemsLabel?: string
}

export type IMConfig = ImmutableObject<Config>
