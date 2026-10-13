import { React } from 'jimu-core'
import { type Config } from '../config'
import { requestPlaybackUrl, type VideoRecord } from './video-service'

export function usePlayback (config: Config) {
  const [url, setUrl] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const sequence = React.useRef(0)
  const pending = React.useRef<AbortController>(null)

  const clear = React.useCallback(() => {
    ++sequence.current
    pending.current?.abort()
    setUrl('')
    setError('')
    setLoading(false)
  }, [])

  const play = React.useCallback(async (video: VideoRecord, token: string) => {
    clear()
    const requestSequence = sequence.current
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    let timedOut = false
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort() }, config.tokenMode === 'proxy' ? 90000 : 30000)
    try {
      const playback = await requestPlaybackUrl({ config, video, token, signal: controller.signal })
      if (requestSequence === sequence.current && !controller.signal.aborted) setUrl(playback)
    } catch (error) {
      if (requestSequence !== sequence.current || (controller.signal.aborted && !timedOut)) return
      setError(timedOut ? 'The media API took too long to respond. Try again.' : error instanceof Error ? error.message : 'Unable to request a video URL. Try again.')
    } finally {
      window.clearTimeout(timeout)
      if (requestSequence === sequence.current) setLoading(false)
    }
  }, [clear, config])

  React.useEffect(() => () => { ++sequence.current; pending.current?.abort() }, [])
  return { url, loading, error, clear, play }
}
