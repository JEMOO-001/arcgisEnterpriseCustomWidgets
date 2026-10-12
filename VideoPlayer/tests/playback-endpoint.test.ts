import { resolvePlaybackEndpoint } from '../src/playback-endpoint'
import { requestPlaybackUrl } from '../src/runtime/video-service'
import { type Config } from '../src/config'

const defaults = jest.requireActual<Config>('../config.json')

test('an endpoint path uses the local bridge by default, including older saved configurations', () => {
  expect(resolvePlaybackEndpoint({ presignedUrlEndpoint: '/api/media/presigned-url' })).toBe('https://localhost:9052/api/media/presigned-url')
  expect(resolvePlaybackEndpoint({ presignedUrlEndpoint: '' })).toBe('https://localhost:9052/api/media/presigned-url')
})

test('a path uses a configured HTTPS host and a complete endpoint overrides it', () => {
  expect(resolvePlaybackEndpoint({ apiBaseUrl: 'https://media.example', presignedUrlEndpoint: '/api/media/presigned-url' })).toBe('https://media.example/api/media/presigned-url')
  expect(resolvePlaybackEndpoint({ apiBaseUrl: 'https://localhost:9052', presignedUrlEndpoint: 'https://production.example/sign' })).toBe('https://production.example/sign')
})

test.each([
  { apiBaseUrl: 'http://media.example', presignedUrlEndpoint: '/api/media/presigned-url' },
  { apiBaseUrl: 'not a URL', presignedUrlEndpoint: '/api/media/presigned-url' },
  { presignedUrlEndpoint: '//other.example/sign' },
  { presignedUrlEndpoint: '/\\other.example/sign' },
  { presignedUrlEndpoint: 'https://user:password@media.example/sign' }
])('invalid or ambiguous API configuration is rejected: %j', configuration => {
  expect(() => resolvePlaybackEndpoint(configuration)).toThrow('HTTPS')
})

test('playback sends the bearer request to the resolved bridge address', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, url: 'http://minio.example/video.mp4?sig=a%2Fb' }) })
  global.fetch = fetchMock
  await expect(requestPlaybackUrl({ config: defaults, video: { fileName: 'gis/media/video.mp4', title: 'Video' }, token: 'test-token', signal: new AbortController().signal }))
    .resolves.toBe('https://minio.example/video.mp4?sig=a%2Fb')
  expect(fetchMock.mock.calls[0][0]).toBe('https://localhost:9052/api/media/presigned-url')
})
