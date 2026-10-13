import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type * as ReactTypes from 'react'
import { React, type AllWidgetProps } from 'jimu-core'
import Widget from '../src/runtime/widget'
import { type Config, type IMConfig } from '../src/config'
import { type VideoRecord } from '../src/runtime/video-service'

const defaults = jest.requireActual<Config>('../config.json')
const mockMapView = { view: {}, whenJimuMapViewLoaded: async () => null }
const videos = [{ fileName: 'gis/media/a.mp4', title: 'Entrance' }]
let mockOpenPlayer: (videos: VideoRecord[]) => void
let mockAppMode = 'RUN'
let mockChangeSelection: (selection: unknown) => void
const mockRefreshSelection = jest.fn()

jest.mock('jimu-core', () => {
  const react = jest.requireActual<typeof ReactTypes>('react')
  return {
    React: react,
    jsx: react.createElement,
    css: () => '',
    AppMode: { Design: 'DESIGN', Run: 'RUN' },
    ReactRedux: { useSelector: (selector: (state: unknown) => unknown) => selector({ appRuntimeInfo: { appMode: mockAppMode } }) }
  }
})

jest.mock('jimu-arcgis', () => {
  const react = jest.requireActual<typeof ReactTypes>('react')
  return {
    JimuMapViewComponent: ({ onActiveViewChange }: { onActiveViewChange: (view: unknown) => void }) => {
      react.useEffect(() => { onActiveViewChange(mockMapView) }, [onActiveViewChange])
      return null
    }
  }
}, { virtual: true })

jest.mock('jimu-ui', () => {
  const react = jest.requireActual<typeof ReactTypes>('react')
  const content = ({ children }: { children: ReactTypes.ReactNode }) => react.createElement('div', null, children)
  return {
    Alert: ({ text }: { text: string }) => react.createElement('p', null, text),
    Button: ({ children, disabled, onClick }: { children: ReactTypes.ReactNode, disabled: boolean, onClick: () => void }) => react.createElement('button', { disabled, onClick }, children),
    Modal: ({ isOpen, children }: { isOpen: boolean, children: ReactTypes.ReactNode }) => isOpen ? react.createElement('div', null, children) : null,
    ModalBody: content,
    ModalHeader: content,
    Select: (props: ReactTypes.SelectHTMLAttributes<HTMLSelectElement>) => react.createElement('select', props),
    TextInput: (props: ReactTypes.InputHTMLAttributes<HTMLInputElement>) => react.createElement('input', props)
  }
}, { virtual: true })

jest.mock('../src/runtime/popup-controller', () => ({
  __esModule: true,
  default: class {
    constructor (connection: { onSelection: (selection: unknown) => void, onPlay: (videos: VideoRecord[]) => void }) {
      mockOpenPlayer = connection.onPlay
      mockChangeSelection = connection.onSelection
      connection.onSelection({ status: 'ready', videos })
    }

    destroy = jest.fn()
    refreshSelection = mockRefreshSelection
  }
}))

function showWidget (changes: Partial<Config>) {
  const props = {
    id: 'video-widget',
    useMapWidgetIds: ['map-widget'],
    config: { ...defaults, featureLayerUrl: 'https://gis.example/FeatureServer/0', ...changes }
  } as unknown as AllWidgetProps<IMConfig>
  render(<Widget {...props} />)
}

beforeEach(() => { mockOpenPlayer = undefined; mockAppMode = 'RUN' })

test('a configured widget renders no standalone status panel in the running app while retaining its popup action', async () => {
  showWidget({})
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  expect(screen.queryByRole('heading', { name: 'Feature videos' })).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByText(/Select a feature on the map/)).toBeNull()
})

test('the builder retains the setup panel so the widget can be selected and configured', async () => {
  mockAppMode = 'DESIGN'
  showWidget({})
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  expect(screen.getByRole('heading', { name: 'Feature videos' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toContain('Use Play Video in the map popup')
})

test('lookup failures still provide feedback and a retry control in the running app', async () => {
  showWidget({})
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  act(() => { mockChangeSelection({ status: 'error', videos: [], message: 'Layer unavailable' }) })
  expect(screen.getByText('[Feature lookup] Layer unavailable')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Retry video lookup' }))
  expect(mockRefreshSelection).toHaveBeenCalledTimes(1)
})

test('shared authentication opens playback without a viewer token prompt and sends the configured token', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://minio.example/video.mp4' }) })
  global.fetch = fetchMock
  showWidget({ tokenMode: 'shared', sharedBearerToken: 'Bearer shared-test-token' })
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  act(() => { mockOpenPlayer(videos) })
  await waitFor(() => { expect(screen.getByTitle('Entrance').getAttribute('src')).toBe('https://minio.example/video.mp4') })
  expect(screen.queryByLabelText('Media API access token')).toBeNull()
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer shared-test-token')
})

test('automatic backend authentication opens playback without any app token or viewer prompt', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://minio.example/automatic.mp4' }) })
  global.fetch = fetchMock
  showWidget({ tokenMode: 'proxy', sharedBearerToken: '' })
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  act(() => { mockOpenPlayer(videos) })
  await waitFor(() => { expect(screen.getByTitle('Entrance').getAttribute('src')).toBe('https://minio.example/automatic.mp4') })
  expect(screen.queryByLabelText('Media API access token')).toBeNull()
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
})

test('a rejected automatic backend request never asks the viewer for a media token', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 })
  showWidget({ tokenMode: 'proxy', sharedBearerToken: '' })
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  act(() => { mockOpenPlayer(videos) })
  await waitFor(() => { expect(screen.getByText(/automatic playback backend rejected/)).toBeTruthy() })
  expect(screen.queryByLabelText('Media API access token')).toBeNull()
})

test('a rejected shared token asks the owner to update settings without asking viewers for credentials', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 })
  showWidget({ tokenMode: 'shared', sharedBearerToken: 'expired-test-token' })
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  act(() => { mockOpenPlayer(videos) })
  await waitFor(() => { expect(screen.getByText(/Ask the app owner to replace it/)).toBeTruthy() })
  expect(screen.queryByLabelText('Media API access token')).toBeNull()
  expect(screen.queryByTitle('Entrance')).toBeNull()
})

test('older configurations keep the per-viewer token prompt and never use a saved token implicitly', async () => {
  const fetchMock = jest.fn()
  global.fetch = fetchMock
  showWidget({ tokenMode: undefined, sharedBearerToken: 'unused-test-token' })
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  act(() => { mockOpenPlayer(videos) })
  expect(screen.getByLabelText('Media API access token')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('video-load failures explain that the API succeeded and identify the browser media error', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, url: 'https://minio.example/video.mp4' }) })
  showWidget({ tokenMode: 'shared', sharedBearerToken: 'test-value' })
  await waitFor(() => { expect(mockOpenPlayer).toBeDefined() })
  act(() => { mockOpenPlayer(videos) })
  const player = await screen.findByTitle('Entrance')
  Object.defineProperty(player, 'error', { value: { code: 4 }, configurable: true })
  fireEvent.error(player)
  expect(screen.getByText(/\[Video loading — media error 4\]/).textContent).toContain('API returned a playback URL')
  expect(screen.getByText(/format\/codec is unsupported/)).toBeTruthy()
  fireEvent.loadedMetadata(player)
  expect(screen.queryByText(/\[Video loading — media error 4\]/)).toBeNull()
  expect(screen.getByText(/Video loaded/)).toBeTruthy()
})
