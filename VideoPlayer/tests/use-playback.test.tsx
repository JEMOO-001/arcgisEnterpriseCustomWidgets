import { renderHook, act, waitFor } from '@testing-library/react'
import { usePlayback } from '../src/runtime/use-playback'
import { type Config } from '../src/config'
import type * as React from 'react'
const defaults = jest.requireActual<Config>('../config.json')

jest.mock('jimu-core', () => ({ React: jest.requireActual<typeof React>('react') }))

const config: Config = { ...defaults, tokenMode: 'viewer', sourceMode: 'related', responseUrlField: 'url', presignedUrlEndpoint: 'https://media.example/api/media/presigned-url' }

test('a previous video request cannot replace the more recently requested video', async () => {
  let finishFirst: (response: unknown) => void
  global.fetch = jest.fn()
    .mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve }))
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://minio/new.mp4' }) })
  const { result } = renderHook(() => usePlayback(config))
  act(() => { void result.current.play({ fileName: 'old.mp4', title: 'Old' }, 'token') })
  await act(async () => { await result.current.play({ fileName: 'new.mp4', title: 'New' }, 'token') })
  await act(async () => { finishFirst({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://minio/old.mp4' }) }) })
  expect(result.current.url).toBe('https://minio/new.mp4')
})

test('clearing the selection cancels pending playback without displaying its eventual response', async () => {
  let finishRequest: (response: unknown) => void
  global.fetch = jest.fn().mockImplementation(() => new Promise(resolve => { finishRequest = resolve }))
  const { result } = renderHook(() => usePlayback(config))
  act(() => { void result.current.play({ fileName: 'a.mp4', title: 'A' }, 'token') })
  act(() => { result.current.clear() })
  await act(async () => { finishRequest({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://minio/a.mp4' }) }) })
  expect(result.current.url).toBe('')
  expect(result.current.loading).toBe(false)
})

test('an expired bearer token leaves playback stopped with a recoverable error', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 })
  const { result } = renderHook(() => usePlayback(config))
  act(() => { void result.current.play({ fileName: 'a.mp4', title: 'A' }, 'expired') })
  await waitFor(() => { expect(result.current.error).toContain('access token') })
  expect(result.current.url).toBe('')
  expect(result.current.loading).toBe(false)
})
