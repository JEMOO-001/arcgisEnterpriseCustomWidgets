import * as React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Widget from '../src/runtime/widget'
import { sdkBoundary } from './sdk-boundary'

const originalCategories = [
  { code: 0, name: 'القاهرة' },
  { code: 2, name: 'الجيزة' },
  { code: "O'Brien", name: "O'Brien" },
  { code: '03', name: 'String code 03' }
]
const useDataSources = [{ dataSourceId: 'lands' }]
let available = originalCategories
let dataSource: any
let goTo: jest.Mock

function renderWidget(enableMultiChoice?: boolean) {
  const props: any = { id: 'category', useDataSources, config: {
    categoryField: 'CATEGORY', mapWidgetId: 'map', buttonLabel: 'اختر المحافظة', enableMultiChoice
  } }
  return { ...render(<Widget {...props} />), props }
}

async function openMenu() {
  await screen.findByText('القاهرة', { selector: '.category-label' })
  fireEvent.click(screen.getByRole('button', { name: 'اختر المحافظة' }))
}

beforeEach(() => {
  available = originalCategories
  sdkBoundary.messages = []
  sdkBoundary.info = {}
  goTo = jest.fn().mockResolvedValue(undefined)
  const extent = { width: 10, height: 10, expand: jest.fn().mockReturnValue('padded extent') }
  dataSource = {
    getRemoteQueryParams: () => ({ where: "REGION = 'north'" }),
    getConfigQueryParams: () => ({ where: 'ACTIVE = 1' }),
    updateQueryParams: jest.fn(),
    layer: {
      fields: [{ name: 'CATEGORY', domain: { codedValues: originalCategories } }],
      queryFeatures: jest.fn(async () => ({ features: available.map(category => ({ attributes: { CATEGORY: category.code } })) })),
      queryExtent: jest.fn().mockResolvedValue({ extent })
    }
  }
  sdkBoundary.dataSource = dataSource
  sdkBoundary.mapView = { view: { goTo, zoom: 10 } }
})
afterEach(cleanup)

test('existing configuration remains single choice and Reset clears only its category filter', async () => {
  renderWidget()
  await openMenu()
  fireEvent.click(screen.getByRole('button', { name: 'القاهرة' }))
  expect(screen.getByRole('button', { name: 'القاهرة' })).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('button', { name: 'القاهرة' })).toHaveFocus()
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: 'CATEGORY = 0' }, 'category')
  fireEvent.click(screen.getByRole('button', { name: 'القاهرة' }))
  fireEvent.click(screen.getByRole('button', { name: 'إعادة تعيين' }))
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: '1=1' }, 'category')
  expect(sdkBoundary.messages.at(-1)?.str).toBe('')
  expect(screen.getByRole('button', { name: 'اختر المحافظة' })).toBeInTheDocument()
  expect(dataSource.layer.queryExtent).toHaveBeenLastCalledWith({ where: "((REGION = 'north') AND (ACTIVE = 1))" })
})

test('Multi Choice keeps the menu open, toggles codes and resets the whole selection', async () => {
  renderWidget(true)
  await openMenu()
  fireEvent.click(screen.getByRole('checkbox', { name: 'القاهرة' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'الجيزة' }))
  expect(screen.getByRole('button', { name: 'تم اختيار 2' })).toHaveAttribute('aria-expanded', 'true')
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: 'CATEGORY IN (0, 2)' }, 'category')
  expect(sdkBoundary.messages.at(-1)?.str).toBe('0,2')
  fireEvent.click(screen.getByRole('checkbox', { name: 'القاهرة' }))
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: 'CATEGORY = 2' }, 'category')
  fireEvent.click(screen.getByRole('button', { name: 'إعادة تعيين' }))
  expect(screen.getAllByRole('checkbox').every(checkbox => checkbox.getAttribute('aria-checked') === 'false')).toBe(true)
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: '1=1' }, 'category')
  expect(screen.getByRole('button', { name: 'إعادة تعيين' })).toBeDisabled()
})

test.each([false, true])('mode %s escapes apostrophes and preserves numeric-looking string codes', async multi => {
  renderWidget(multi)
  await openMenu()
  const role = multi ? 'checkbox' : 'button'
  fireEvent.click(screen.getByRole(role, { name: "O'Brien" }))
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: "CATEGORY = 'O''Brien'" }, 'category')
  if (!multi) fireEvent.click(screen.getByRole('button', { name: "O'Brien" }))
  fireEvent.click(screen.getByRole(role, { name: 'String code 03' }))
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({
    where: multi ? "CATEGORY IN ('O''Brien', '03')" : "CATEGORY = '03'"
  }, 'category')
})

test('cascading retains valid checked categories and clears the last invalid selection', async () => {
  renderWidget(true)
  await openMenu()
  fireEvent.click(screen.getByRole('checkbox', { name: 'القاهرة' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'الجيزة' }))
  available = [originalCategories[1]]
  act(() => sdkBoundary.notify({ widgetQueries: { parent: { where: 'PARENT = 1' }, category: { where: 'CATEGORY IN (0, 2)' } } }))
  await waitFor(() => expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: 'CATEGORY = 2' }, 'category'))
  expect(screen.getByRole('checkbox', { name: 'الجيزة' })).toBeChecked()
  expect(screen.queryByRole('checkbox', { name: 'القاهرة' })).not.toBeInTheDocument()
  available = []
  act(() => sdkBoundary.notify({ widgetQueries: { parent: { where: 'PARENT = 2' } } }))
  await waitFor(() => expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: '1=1' }, 'category'))
  expect(sdkBoundary.messages.at(-1)?.str).toBe('')
})

test('switching Multi Choice off keeps one valid selection and Escape restores focus', async () => {
  const mounted = renderWidget(true)
  await openMenu()
  fireEvent.click(screen.getByRole('checkbox', { name: 'القاهرة' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'الجيزة' }))
  mounted.rerender(<Widget {...mounted.props} config={{ ...mounted.props.config, enableMultiChoice: false }} />)
  await waitFor(() => expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: 'CATEGORY = 0' }, 'category'))
  fireEvent.keyDown(screen.getByRole('button', { name: 'القاهرة', pressed: true }), { key: 'Escape' })
  expect(screen.getByRole('button', { name: 'القاهرة' })).toHaveFocus()
  expect(screen.getByRole('button', { name: 'القاهرة' })).toHaveAttribute('aria-expanded', 'false')
})

test('late map extents from earlier checkbox choices cannot override the latest selection', async () => {
  let finishFirst: (extent: any) => void
  dataSource.layer.queryExtent.mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve }))
  renderWidget(true)
  await openMenu()
  fireEvent.click(screen.getByRole('checkbox', { name: 'القاهرة' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'الجيزة' }))
  await waitFor(() => expect(goTo).toHaveBeenCalledTimes(1))
  await act(async () => { finishFirst!({ extent: { width: 1, height: 1, expand: () => 'obsolete extent' } }) })
  expect(goTo).toHaveBeenCalledTimes(1)
  expect(goTo).not.toHaveBeenCalledWith('obsolete extent')
})

test('an older cascading response cannot restore categories removed by the latest parent filter', async () => {
  renderWidget(true)
  await openMenu()
  fireEvent.click(screen.getByRole('checkbox', { name: 'القاهرة' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'الجيزة' }))
  let finishOlder: (features: any) => void
  dataSource.layer.queryFeatures.mockImplementationOnce(() => new Promise(resolve => { finishOlder = resolve }))
  act(() => sdkBoundary.notify({ widgetQueries: { parent: { where: 'PARENT = 1' } } }))
  available = [originalCategories[1]]
  act(() => sdkBoundary.notify({ widgetQueries: { parent: { where: 'PARENT = 2' } } }))
  await waitFor(() => expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: 'CATEGORY = 2' }, 'category'))
  await act(async () => { finishOlder!({ features: [{ attributes: { CATEGORY: 0 } }] }) })
  expect(screen.queryByRole('checkbox', { name: 'القاهرة' })).not.toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'الجيزة' })).toBeChecked()
})

test('Reset does not reuse its old category expression after a parent filter is removed', async () => {
  dataSource.getRemoteQueryParams = () => ({ where: '1=1' })
  dataSource.getConfigQueryParams = () => ({ where: '1=1' })
  renderWidget(true)
  await openMenu()
  fireEvent.click(screen.getByRole('checkbox', { name: 'القاهرة' }))
  dataSource.layer.definitionExpression = 'CATEGORY = 0'
  act(() => sdkBoundary.notify({ widgetQueries: { parent: { where: 'PARENT = 1' } } }))
  await waitFor(() => expect(dataSource.layer.queryFeatures.mock.calls.at(-1)[0].where).toContain('PARENT = 1'))
  act(() => sdkBoundary.notify({ widgetQueries: {} }))
  await waitFor(() => expect(dataSource.layer.queryFeatures).toHaveBeenLastCalledWith(expect.objectContaining({ where: '1=1' })))
  fireEvent.click(screen.getByRole('button', { name: 'إعادة تعيين' }))
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: '1=1' }, 'category')
  expect(dataSource.layer.queryExtent).toHaveBeenLastCalledWith({ where: '1=1' })
})

test.each([false, true])('mode %s selects from label text and the full row without double toggling', async multi => {
  renderWidget(multi)
  await openMenu()
  fireEvent.click(screen.getByText('القاهرة', { selector: '.category-label' }))
  expect(dataSource.updateQueryParams).toHaveBeenCalledTimes(1)
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: 'CATEGORY = 0' }, 'category')
  if (!multi) fireEvent.click(screen.getByRole('button', { name: 'القاهرة', expanded: false }))
  const selectedRow = multi
    ? screen.getByRole('checkbox', { name: 'القاهرة' })
    : screen.getByRole('button', { name: 'القاهرة', pressed: true })
  expect(selectedRow.querySelector('.category-checkbox') !== null).toBe(multi)
  expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  fireEvent.click(selectedRow)
  expect(dataSource.updateQueryParams).toHaveBeenCalledTimes(2)
  expect(dataSource.updateQueryParams).toHaveBeenLastCalledWith({ where: multi ? '1=1' : 'CATEGORY = 0' }, 'category')
})
