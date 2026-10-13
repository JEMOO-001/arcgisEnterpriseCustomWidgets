/** @jsx jsx */
import { React, ReactRedux, AppMode, jsx, css, type AllWidgetProps, type IMState } from 'jimu-core'
import { Alert, Button, Modal, ModalBody, ModalHeader, Select, TextInput } from 'jimu-ui'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { type IMConfig } from '../config'
import PopupVideoController, { type VideoSelection } from './popup-controller'
import { mediaAccessToken, type VideoRecord } from './video-service'
import { usePlayback } from './use-playback'
import { resolvePlaybackEndpoint } from '../playback-endpoint'

const playerStyle = css`
  .video-player-frame { display: block; width: 100%; height: min(60vh, 520px); min-height: 220px; border: 0; background: #000; }
  .video-player-controls { display: flex; align-items: end; gap: 12px; flex-wrap: wrap; margin-block-end: 16px; }
  .video-player-choice { flex: 1; min-width: 180px; }
  label { display: block; margin-block-end: 6px; }
  .video-player-feedback { margin-block: 12px; }
  @media (max-width: 480px) { .video-player-frame { height: 40vh; } }
`

function configurationError (config: IMConfig): string {
  if (config.tokenMode === 'shared' && !mediaAccessToken(config, '')) return 'The app owner must configure the shared media token in the widget settings.'
  if (!config.featureLayerUrl?.trim() || !config.fileNameField?.trim()) return 'Choose a feature layer and video filename field in the widget settings.'
  if (config.sourceMode === 'related' && (!Number.isInteger(config.relationshipId) || config.relationshipId < 0)) return 'Configure the relationship ID for the related video table.'
  if (!Number.isFinite(config.expiryHours) || config.expiryHours <= 0) return 'Configure a positive URL lifetime in hours.'
  try {
    if (new URL(config.featureLayerUrl).protocol !== 'https:') return 'The feature layer must use HTTPS.'
  } catch { return 'Choose a published HTTPS feature layer from the connected map.' }
  try { resolvePlaybackEndpoint(config) } catch (error) { return (error as Error).message }
  return ''
}

export default function Widget (props: AllWidgetProps<IMConfig>) {
  const inDesignMode = ReactRedux.useSelector((state: IMState) => state.appRuntimeInfo.appMode === AppMode.Design)
  const [mapView, setMapView] = React.useState<JimuMapView>(null)
  const [selection, setSelection] = React.useState<VideoSelection>({ status: 'idle', videos: [] })
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [token, setToken] = React.useState('')
  const [videoError, setVideoError] = React.useState('')
  const [videoStatus, setVideoStatus] = React.useState('')
  const sharedTokenMode = props.config.tokenMode === 'shared'
  const automaticMode = props.config.tokenMode === 'proxy'
  const accessToken = mediaAccessToken(props.config, token)
  const controller = React.useRef<PopupVideoController>(null)
  const playback = usePlayback(props.config)
  const clearPlayback = playback.clear
  const setupError = configurationError(props.config)
  const mapWidgetId = props.useMapWidgetIds?.[0]
  const tokenInputId = `${props.id}-media-token`
  const playerTitleId = `${props.id}-player-title`

  React.useEffect(() => {
    setVideoError('')
    setVideoStatus(playback.url ? '3. Playback URL received. Connecting to the video host…' : '')
  }, [playback.url])

  const closePlayer = () => { playback.clear(); setDialogOpen(false) }
  const openPlayer = (videos: VideoRecord[]) => {
    setSelectedIndex(0)
    setDialogOpen(true)
    if (videos.length === 1 && (automaticMode || accessToken)) void playback.play(videos[0], accessToken)
  }
  const callbacks = React.useRef({ closePlayer, openPlayer })
  callbacks.current = { closePlayer, openPlayer }

  React.useEffect(() => {
    setToken('')
    clearPlayback()
  }, [props.config.presignedUrlEndpoint, props.config.apiBaseUrl, props.config.tokenMode, props.config.sharedBearerToken, clearPlayback])

  React.useEffect(() => {
    callbacks.current.closePlayer()
    setSelection({ status: 'idle', videos: [] })
    if (!mapView || setupError) return
    let disposed = false
    void mapView.whenJimuMapViewLoaded().then(() => {
      if (disposed) return
      controller.current = new PopupVideoController({
        view: mapView.view,
        config: props.config,
        actionId: `${props.id}-play-video`,
        actionTitle: 'Play Video',
        onSelection: setSelection,
        onReset: () => { callbacks.current.closePlayer() },
        onPlay: videos => { callbacks.current.openPlayer(videos) }
      })
    }).catch(() => {
      if (!disposed) setSelection({ status: 'error', videos: [], message: 'Unable to connect to the Map widget. Check its configuration.' })
    })
    return () => { disposed = true; controller.current?.destroy(); controller.current = null }
  }, [mapView, props.config, props.id, setupError])

  const selectedVideo = selection.videos[selectedIndex]
  const showStatusPanel = inDesignMode || !mapWidgetId || Boolean(setupError) || selection.status === 'error'
  const statusText = selection.status === 'loading'
    ? 'Checking this feature’s videos…'
    : selection.status === 'ready'
      ? selection.videos.length ? `${selection.videos.length} video${selection.videos.length === 1 ? '' : 's'} available. Use Play Video in the map popup.` : 'This feature has no videos.'
      : mapView ? 'Select a feature on the map to view its videos.' : 'Waiting for the connected map…'

  return <React.Fragment>
    {mapWidgetId ? <JimuMapViewComponent useMapWidgetId={mapWidgetId} onActiveViewChange={setMapView} /> : null}
    {showStatusPanel
      ? <div className="widget-video-player p-3" css={playerStyle}>
      <h5>Feature videos</h5>
      {!mapWidgetId || setupError
        ? <Alert type="info" text={!mapWidgetId ? '[Configuration] Choose a Map widget in the settings.' : setupError.startsWith('[') ? setupError : `[Configuration] ${setupError}`} />
        : selection.status === 'error'
          ? <div><Alert type="error" text={`[Feature lookup] ${selection.message}`} /><Button className="mt-2" onClick={() => { controller.current?.refreshSelection() }}>Retry video lookup</Button></div>
          : <p role="status" aria-live="polite">{statusText}</p>}
    </div>
      : null}
    <Modal isOpen={dialogOpen} toggle={closePlayer} size="lg" centered labelledBy={playerTitleId}>
      <ModalHeader id={playerTitleId} toggle={closePlayer}>Feature videos</ModalHeader>
      <ModalBody css={playerStyle}>
        <div className="video-player-controls">
          {selection.videos.length > 1
            ? <div className="video-player-choice">
            <label htmlFor={`${props.id}-video-choice`}>Choose a video</label>
            <Select id={`${props.id}-video-choice`} value={String(selectedIndex)} onChange={event => { playback.clear(); setSelectedIndex(Number(event.target.value)) }}>
              {selection.videos.map((video, index) => <option key={`${video.fileName}-${index}`} value={index}>{video.title}</option>)}
            </Select>
          </div>
            : <p className="mb-0">{selectedVideo?.title}</p>}
        </div>
        {!automaticMode && !sharedTokenMode && !playback.url
          ? <div className="mb-3">
          <label htmlFor={tokenInputId}>Media API access token</label>
          <TextInput id={tokenInputId} type="password" value={token} autoComplete="off" spellCheck={false}
            onChange={event => { playback.clear(); setToken(event.target.value) }} placeholder="Enter your bearer token" />
          <small>Kept in memory for this widget session.</small>
        </div>
          : null}
        <Button type="primary" disabled={!selectedVideo || (!automaticMode && !accessToken) || playback.loading}
          onClick={() => { if (selectedVideo) void playback.play(selectedVideo, accessToken) }}>
          {playback.loading ? 'Preparing video…' : playback.url ? 'Request fresh URL' : 'Play video'}
        </Button>
        {playback.error ? <Alert className="video-player-feedback" type="error" text={playback.error} /> : null}
        {playback.loading ? <p className="video-player-feedback" role="status" aria-live="polite">{playback.progress || 'Preparing playback…'}</p> : null}
        {playback.url && videoError ? <Alert className="video-player-feedback" type="error" text={videoError} /> : null}
        {playback.url && !videoError ? <p className="video-player-feedback" role="status" aria-live="polite">{videoStatus}</p> : null}
        {playback.url
          ? <video key={playback.url} className="video-player-frame mt-3" src={playback.url}
          title={selectedVideo?.title || 'Feature video'} controls autoPlay playsInline preload="metadata"
          onLoadedMetadata={() => { setVideoError(''); setVideoStatus('3. Video loaded. Use the player controls if playback does not start automatically.') }}
          onPlaying={() => { setVideoError(''); setVideoStatus('4. Playing video.') }}
          onStalled={() => { setVideoStatus('3. Video loading stalled. Check the video-host request in the browser Network tab.') }}
          onError={event => {
            const code = event.currentTarget.error?.code
            const reason = code === 1 ? 'Video loading was aborted.' : code === 2 ? 'A network error interrupted the video download.' : code === 3 ? 'The browser could not decode this video.' : code === 4 ? 'The video source is unavailable or its format/codec is unsupported.' : 'The browser could not load the video.'
            setVideoError(`[Video loading${code ? ` — media error ${code}` : ''}] The API returned a playback URL, but playback stopped while loading or decoding the video. ${reason} Check the video request in the browser Network tab for connection, certificate, HTTP status, or expired-link details.`)
          }} />
          : null}
      </ModalBody>
    </Modal>
  </React.Fragment>
}
