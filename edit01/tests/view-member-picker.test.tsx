/** @jsx jsx */
import { React, jsx, createIntl } from 'jimu-core'
import { fireEvent, waitFor } from '@testing-library/react'
import { withStoreThemeIntlRender } from 'jimu-for-test'
import ViewMemberPicker from '../src/setting/view-member-picker'
import { loadGroupMembers } from '../src/setting/group-members'
import type { ViewConfig } from '../src/config'
import messages from '../src/setting/translations/default'

jest.mock('../src/setting/group-members', () => ({ loadGroupMembers: jest.fn() }))
const load = loadGroupMembers as jest.Mock
const intl = createIntl({ locale: 'en', messages })
const render = withStoreThemeIntlRender(false, undefined, 'en', messages)
const initialView: ViewConfig = {
  id: 'view1', name: 'Page 1', groups: [{ id: 'g1', title: 'Shared editors' }],
  editableFields: { layer1: ['field1'] }
}

describe('Allowed users setting', () => {
  beforeEach(() => { load.mockReset() })

  it('preserves legacy mode and supports selecting/removing multiple members with a deny-empty warning', async () => {
    load.mockResolvedValue([
      { username: 'editor1', fullName: 'First Editor' },
      { username: 'editor2', fullName: 'Second Editor' }
    ])
    const onChange = jest.fn()
    const Harness = () => {
      const [view, setView] = React.useState(initialView)
      return <ViewMemberPicker view={view} intl={intl} onChange={(memberAccess, allowedUsers) => {
        onChange(memberAccess, allowedUsers)
        setView({ ...view, memberAccess, allowedUsers })
      }} />
    }
    const screen = render(<Harness />)
    expect(load).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Allowed users' }))
    fireEvent.click(await screen.findByText('Specific members'))
    expect(screen.getByText(messages.noSelectedMembers)).toBeTruthy()
    fireEvent.click(await screen.findByLabelText('Select editor1'))
    fireEvent.click(screen.getByLabelText('Select editor2'))
    expect(onChange).toHaveBeenLastCalledWith('specific', [
      { username: 'editor1', fullName: 'First Editor' },
      { username: 'editor2', fullName: 'Second Editor' }
    ])
    fireEvent.change(screen.getByRole('textbox', { name: 'Group members' }), { target: { value: 'editor2' } })
    expect(screen.queryByLabelText('Select editor1')).toBeNull()
    fireEvent.click(screen.getByLabelText('Remove editor1'))
    expect(onChange).toHaveBeenLastCalledWith('specific', [{ username: 'editor2', fullName: 'Second Editor' }])
    fireEvent.click(screen.getByRole('button', { name: 'Allowed users' }))
    fireEvent.click(await screen.findByText('All members of selected groups'))
    expect(onChange).toHaveBeenLastCalledWith('all', [{ username: 'editor2', fullName: 'Second Editor' }])
  })

  it('offers retry on Portal failure and ignores late results after changing groups', async () => {
    load.mockRejectedValueOnce(new Error('Permission denied'))
    const props = { intl, onChange: jest.fn() }
    const screen = render(<ViewMemberPicker {...props} view={{ ...initialView, memberAccess: 'specific' }} />)
    expect(await screen.findByText(messages.groupMembersLoadError)).toBeTruthy()
    let resolveOld: (members: any[]) => void
    load.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    fireEvent.click(screen.getByText('Retry'))
    await waitFor(() => { expect(load).toHaveBeenCalledTimes(2) })
    load.mockResolvedValueOnce([{ username: 'new-member' }])
    screen.rerender(<ViewMemberPicker {...props} view={{ ...initialView, memberAccess: 'specific', groups: [{ id: 'g2', title: 'Other group' }] }} />)
    expect(await screen.findByLabelText('Select new-member')).toBeTruthy()
    resolveOld([{ username: 'old-member' }])
    await waitFor(() => { expect(screen.queryByLabelText('Select old-member')).toBeNull() })
    expect(props.onChange).not.toHaveBeenCalled()
  })
})
