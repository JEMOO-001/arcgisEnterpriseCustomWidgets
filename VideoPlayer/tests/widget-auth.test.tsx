import { act, render, screen, waitFor } from '@testing-library/react'
import type * as ReactTypes from 'react'
import { React, type AllWidgetProps } from 'jimu-core'
import Widget from '../src/runtime/widget'
import { type Config, type IMConfig } from '../src/config'
import { type VideoRecord } from '../src/runtime/video-service'

const defaults = jest.requireActual<Config>('../config.json')
const mockMapView = { view: {}, whenJimuMapViewLoaded: async () => null }
const videos = [{ fileName: 'gis/media/a.mp4', title: 'Entrance' }]
let mockOpenPlayer: (videos: VideoRecord[]) => void

jest.mock('jimu-core', () => {
  const react = jest.requireActual<typeof ReactTypes>('react')
  return { React: react, jsx: react.createElement, css: () => '' }
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
      connection.onSelection({ status: 'ready', videos })
    }

    destroy = jest.fn()
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

beforeEach(() => { mockOpenPlayer = undefined })

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
