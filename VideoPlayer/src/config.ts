import { type ImmutableObject } from 'jimu-core'

export interface Config {
  sourceMode: 'direct' | 'related'
  featureLayerUrl: string
  relationshipId: number | null
  fileNameField: string
  titleField: string
  presignedUrlEndpoint: string
  apiBaseUrl?: string
  tokenMode?: 'viewer' | 'shared' | 'proxy'
  sharedBearerToken?: string
  responseUrlField: 'url' | 'localUrl' | 'apnUrl'
  expiryHours: number
  useHttps: boolean
}

export type IMConfig = ImmutableObject<Config>
