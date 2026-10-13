import { playbackUrl, requestPlaybackUrl, videoRecords } from '../src/runtime/video-service'
import { type Config } from '../src/config'
const defaults = jest.requireActual<Config>('../config.json')

const config: Config = { ...defaults, tokenMode: 'viewer', sourceMode: 'related', responseUrlField: 'url', presignedUrlEndpoint: 'https://media.example/api/media/presigned-url' }
const video = { fileName: 'gis/media/a video.mp4', title: 'Entrance' }

afterEach(() => { jest.restoreAllMocks() })

test('HTTPS conversion preserves signed path and query bytes exactly', () => {
  expect(playbackUrl('http://minio/gis/a%20video.mp4?X-Signature=a%2fb+z&x=1&x=2', true))
    .toBe('https://minio/gis/a%20video.mp4?X-Signature=a%2fb+z&x=1&x=2')
})

test.each(['javascript:alert(1)', 'data:text/html,test', 'ftp://minio/file.mp4', 'https://user:password@minio/file.mp4'])('unsafe playback address %s is rejected', address => {
  expect(() => playbackUrl(address, true)).toThrow()
})

test('empty video rows do not create playable entries and missing titles use filenames', () => {
  expect(videoRecords([{ VideoFileName: null }, { VideoFileName: ' ' }, { VideoFileName: 'gis/media/a.mp4', VideoTitle: 'Entrance' }, { VideoFileName: 'gis/media/b.mp4' }], { fileNameField: 'VideoFileName', titleField: 'VideoTitle' }))
    .toEqual([{ fileName: 'gis/media/a.mp4', title: 'Entrance' }, { fileName: 'gis/media/b.mp4', title: 'b.mp4' }])
})

test('playback posts the exact stored reference and reads the selected response field', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://external.example/a.mp4', localUrl: 'http://minio/a.mp4?sig=a%2Fb' }) })
  global.fetch = fetchMock
  const address = await requestPlaybackUrl({ config: { ...config, responseUrlField: 'localUrl' }, video, token: 'session-token', signal: new AbortController().signal })
  expect(address).toBe('https://minio/a.mp4?sig=a%2Fb')
  const sentRequest = fetchMock.mock.calls[0][1] as RequestInit
  expect(JSON.parse(sentRequest.body as string)).toEqual({ fileName: video.fileName, expiryHours: 24 })
  expect(sentRequest.headers).toMatchObject({ Authorization: 'Bearer session-token' })
})

test('an upload endpoint stored in the video field is reported before making a media request', async () => {
  const fetchMock = jest.fn()
  global.fetch = fetchMock
  await expect(requestPlaybackUrl({ config, video: { fileName: 'http://172.20.70.34:9051/api/media/upload', title: 'Incorrect reference' }, token: 'token', signal: new AbortController().signal })).rejects.toThrow('fileName returned by the upload API')
  expect(fetchMock).not.toHaveBeenCalled()
})

test.each([401, 403, 500])('HTTP %s fails without creating a player URL', async status => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status })
  await expect(requestPlaybackUrl({ config, video, token: 'token', signal: new AbortController().signal })).rejects.toThrow()
})

test.each([{ success: false, url: 'https://minio/a.mp4' }, { success: true, localUrl: 'https://minio/a.mp4' }, null])('unsuccessful or incomplete API response %j fails', async payload => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload })
  await expect(requestPlaybackUrl({ config, video, token: 'token', signal: new AbortController().signal })).rejects.toThrow('configured URL field')
})
