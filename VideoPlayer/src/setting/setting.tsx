import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { Alert, Button, Select, TextInput, NumericInput, Switch } from 'jimu-ui'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { type Config, type IMConfig } from '../config'
import { automaticApiBaseUrl, automaticEndpointPath, defaultEndpointPath, localApiBaseUrl, resolvePlaybackEndpoint } from '../playback-endpoint'
import { useMapFields } from './use-map-fields'
import { featureServiceLayerUrl, mediaAccessToken } from '../runtime/video-service'

export default function Setting (props: AllWidgetSettingProps<IMConfig>) {
  const { config } = props
  const [mapView, setMapView] = React.useState<JimuMapView>(null)
  const [sharedTokenDraft, setSharedTokenDraft] = React.useState(config.sharedBearerToken || '')
  React.useEffect(() => { setSharedTokenDraft(config.sharedBearerToken || '') }, [config.sharedBearerToken])
  const metadata = useMapFields(mapView, config)
  const mapWidgetId = props.useMapWidgetIds?.[0]
  const update = <K extends keyof Config,>(key: K, next: Config[K]) => {
    props.onSettingChange({ id: props.id, config: config.set(key, next) })
  }
  const changeAuthentication = (mode: Config['tokenMode']) => {
    let next = config.merge({ tokenMode: mode, sharedBearerToken: '' })
    if (mode === 'proxy' && (!config.presignedUrlEndpoint || config.presignedUrlEndpoint === defaultEndpointPath || config.presignedUrlEndpoint === `${localApiBaseUrl}${defaultEndpointPath}`)) {
      next = next.set('presignedUrlEndpoint', automaticEndpointPath)
      if (!config.apiBaseUrl || config.apiBaseUrl === localApiBaseUrl) next = next.set('apiBaseUrl', automaticApiBaseUrl)
    } else if (mode !== 'proxy' && config.presignedUrlEndpoint === automaticEndpointPath && config.apiBaseUrl === automaticApiBaseUrl) {
      next = next.merge({ presignedUrlEndpoint: defaultEndpointPath, apiBaseUrl: localApiBaseUrl })
    }
    props.onSettingChange({ id: props.id, config: next })
  }
  const textField = (key: 'presignedUrlEndpoint' | 'apiBaseUrl', label: string, hint?: string) => <SettingRow flow="wrap" label={label}>
    <TextInput className="w-100" aria-label={label} defaultValue={config[key] || (key === 'apiBaseUrl' ? config.tokenMode === 'proxy' ? automaticApiBaseUrl : localApiBaseUrl : config.tokenMode === 'proxy' ? automaticEndpointPath : defaultEndpointPath)} key={`${key}-${config[key]}`} onAcceptValue={text => { update(key, text.trim()) }} />
    {hint ? <small className="mt-1">{hint}</small> : null}
  </SettingRow>
  const fieldDropdown = (key: 'fileNameField' | 'titleField', label: string) => <SettingRow flow="wrap" label={label}>
    <Select className="w-100" aria-label={label} value={config[key] || ''} disabled={metadata.loading || !metadata.fields.length}
      onChange={event => { update(key, event.target.value) }}>
      <option value="">{key === 'titleField' ? 'Use filename as title' : 'Choose a text field'}</option>
      {config[key] && !metadata.fields.some(field => field.name === config[key]) ? <option value={config[key]} disabled>{config[key]} — unavailable</option> : null}
      {metadata.fields.map(field => <option key={field.name} value={field.name}>{field.alias && field.alias !== field.name ? `${field.alias} (${field.name})` : field.name}</option>)}
    </Select>
  </SettingRow>
  let endpointPreview: string
  let endpointError = ''
  try { endpointPreview = resolvePlaybackEndpoint(config) } catch (error) { endpointError = (error as Error).message }

  return <div>
    {mapWidgetId ? <JimuMapViewComponent useMapWidgetId={mapWidgetId} onActiveViewChange={setMapView} /> : null}
    <SettingSection title="Map and features">
      <MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds}
        onSelect={mapIds => {
          if (mapIds[0] !== mapWidgetId) {
            setMapView(null)
            props.onSettingChange({ id: props.id, useMapWidgetIds: mapIds, config: config.merge({ featureLayerUrl: '', relationshipId: null, fileNameField: '', titleField: '' }) })
          }
        }} />
      <SettingRow flow="wrap" label="Feature layer">
        <Select className="w-100" aria-label="Feature layer" value={config.featureLayerUrl || ''} disabled={!metadata.layers.length}
          onChange={event => { props.onSettingChange({ id: props.id, config: config.merge({ featureLayerUrl: event.target.value, relationshipId: null, fileNameField: '', titleField: '' }) }) }}>
          <option value="">Choose a layer from the map</option>
          {config.featureLayerUrl && !metadata.layers.some(layer => featureServiceLayerUrl(layer) === config.featureLayerUrl) ? <option value={config.featureLayerUrl} disabled>Saved layer — waiting for map</option> : null}
          {metadata.layers.map(layer => <option key={layer.id} value={featureServiceLayerUrl(layer)}>{layer.title || layer.id}</option>)}
        </Select>
        <small className="mt-1">Layers come from the active map. No REST address is needed.</small>
        {mapView && !metadata.layers.length ? <small className="mt-1">Waiting for published feature layers. Check the map’s data and your portal sign-in.</small> : null}
      </SettingRow>
    </SettingSection>
    <SettingSection title="Video association">
      <SettingRow flow="wrap" label="Association type">
        <Select aria-label="Association type" className="w-100" value={config.sourceMode}
          onChange={event => { props.onSettingChange({ id: props.id, config: config.merge({ sourceMode: event.target.value as Config['sourceMode'], relationshipId: null, fileNameField: '', titleField: '' }) }) }}>
          <option value="direct">1:1 — video field on feature</option>
          <option value="related">1:M — related video table</option>
        </Select>
      </SettingRow>
      {config.sourceMode === 'related'
        ? <SettingRow flow="wrap" label="Video table relationship">
        <Select aria-label="Video table relationship" className="w-100" value={config.relationshipId == null ? '' : String(config.relationshipId)} disabled={!metadata.relationships.length}
          onChange={event => { props.onSettingChange({ id: props.id, config: config.merge({ relationshipId: event.target.value === '' ? null : Number(event.target.value), fileNameField: '', titleField: '' }) }) }}>
          <option value="">Choose a published relationship</option>
          {config.relationshipId != null && !metadata.relationships.some(item => item.id === config.relationshipId) ? <option value={config.relationshipId} disabled>Relationship {config.relationshipId} — unavailable</option> : null}
          {metadata.relationships.map(item => <option key={item.id} value={item.id}>{item.name || `Relationship ${item.id}`} (table {item.relatedTableId})</option>)}
        </Select>
        <small className="mt-1">{!metadata.loading && config.featureLayerUrl && !metadata.relationships.length ? 'No origin relationships are published for this layer. Publish the related table and relationship with it, or use 1:1.' : 'The filename and title fields below come from this related table.'}</small>
      </SettingRow>
        : null}
      {fieldDropdown('fileNameField', 'Video filename field')}
      <small>Store the uploaded fileName, such as gis/media/video.mp4, in this field.</small>
      {fieldDropdown('titleField', 'Video title field (optional)')}
      {metadata.loading ? <p role="status">Reading fields…</p> : null}
      {metadata.error ? <div><Alert type="error" text={metadata.error} /><Button className="mt-2" onClick={metadata.retry}>Read fields again</Button></div> : null}
    </SettingSection>
    <SettingSection title="Playback API">
      <Button className="mb-2" onClick={() => {
        props.onSettingChange({ id: props.id, config: config.merge({ apiBaseUrl: 'http://172.20.70.34:9051', presignedUrlEndpoint: defaultEndpointPath, tokenMode: config.tokenMode === 'proxy' ? 'shared' : config.tokenMode || 'shared' }) })
      }}>Use direct media API</Button>
      <small className="d-block mb-2">Sets the direct 172.20.70.34:9051 API address. Configure a bearer token below. The browser may block HTTP requests from this HTTPS app.</small>
      {textField('apiBaseUrl', 'API base address', 'Enter your API host. HTTP is accepted for testing; HTTPS is needed when the browser blocks mixed content.')}
      {textField('presignedUrlEndpoint', 'Playback endpoint', config.tokenMode === 'proxy' ? 'Use /api/media/playback-url on the automatic-auth backend, or its full address.' : 'Use /api/media/presigned-url or a full address. A full address overrides the API base.')}
      {endpointError ? <Alert type="error" text={endpointError} /> : <small className="d-block" style={{ overflowWrap: 'anywhere' }}>Request address: {endpointPreview}</small>}
      {endpointPreview?.startsWith('http:') ? <Alert type="warning" text="Direct HTTP request selected. Your HTTPS app may be blocked by browser mixed-content or local-network restrictions before the API responds. Returned video URLs are upgraded separately." /> : null}
      <small className="d-block mt-1">For localhost:9052, keep the local test bridge running.</small>
      <SettingRow flow="wrap" label="Media API authentication">
        <Select className="w-100" aria-label="Media API authentication" value={config.tokenMode || 'viewer'}
          onChange={event => { changeAuthentication(event.target.value as Config['tokenMode']) }}>
          <option value="proxy">Automatic login through backend</option>
          <option value="viewer">Each viewer enters a token</option>
          <option value="shared">Shared token in app</option>
        </Select>
      </SettingRow>
      {config.tokenMode === 'proxy'
        ? <Alert type="info" text="Viewers only click Play Video. The backend logs in and renews tokens automatically. Credentials belong in the backend environment, not this app. Local testing uses https://localhost:9053; shared use needs the deployed backend address." />
        : config.tokenMode === 'shared'
          ? <div>
        <SettingRow flow="wrap" label="Shared bearer token">
          <TextInput className="w-100" aria-label="Shared bearer token" type="password" autoComplete="off" spellCheck={false}
            value={sharedTokenDraft} onChange={event => { setSharedTokenDraft(event.target.value) }}
            onAcceptValue={value => { update('sharedBearerToken', mediaAccessToken({ tokenMode: 'shared', sharedBearerToken: value }, '')) }}
            placeholder="Paste the media API bearer token" />
          <small className="mt-1">Saved with the app when you save its configuration. Viewers will not be asked for a token. Replace it here when it expires.</small>
        </SettingRow>
        <Alert type="warning" text="This token is included in the app configuration and can be read by anyone who can load the app. Masking this field does not keep it secret. Use a server-side proxy if the token must stay private." />
      </div>
          : <small>Viewers enter their own token when playing. It is kept only in memory for their widget session.</small>}
      <SettingRow flow="wrap" label="URL response field">
        <Select aria-label="URL response field" className="w-100" value={config.responseUrlField}
          onChange={event => { update('responseUrlField', event.target.value as Config['responseUrlField']) }}>
          <option value="url">url</option><option value="localUrl">localUrl</option><option value="apnUrl">apnUrl</option>
        </Select>
      </SettingRow>
      <SettingRow flow="wrap" label="URL lifetime (hours)">
        <NumericInput aria-label="URL lifetime (hours)" className="w-100" value={config.expiryHours} min={1} precision={0}
          onChange={hours => { if (Number.isFinite(hours) && hours > 0) update('expiryHours', hours) }} />
      </SettingRow>
      <SettingRow label="Use HTTPS for returned video URLs">
        <Switch aria-label="Use HTTPS for returned video URLs" checked={config.useHttps}
          onChange={event => { update('useHttps', event.target.checked) }} />
      </SettingRow>
      <p className="mt-3 mb-0">The widget reads videos and requests playback URLs. Uploads stay in your external application.</p>
    </SettingSection>
  </div>
}
