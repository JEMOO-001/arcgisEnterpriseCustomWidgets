/** @jsx jsx */
import { React, jsx, css, polished, type IntlShape } from 'jimu-core'
import { Alert, Button, Checkbox, Option, Select, TextInput } from 'jimu-ui'
import type { ViewConfig, ViewUserInfo } from '../config'
import defaultMessages from './translations/default'
import { loadGroupMembers } from './group-members'

interface Props {
  view: ViewConfig
  intl: IntlShape
  onChange: (mode: 'all' | 'specific', users: ViewUserInfo[]) => void
}

const style = css`
  .member-help {
    margin-top: ${polished.rem(6)};
    font-size: ${polished.rem(12)};
    line-height: 1.5;
  }
  .member-label {
    display: block;
    margin-top: ${polished.rem(12)};
    margin-bottom: ${polished.rem(4)};
    font-size: ${polished.rem(12)};
    font-weight: 600;
  }
  .member-results {
    margin-top: ${polished.rem(8)};
    max-height: ${polished.rem(240)};
    overflow-y: auto;
    border: 1px solid var(--sys-color-divider);
    border-radius: ${polished.rem(4)};
  }
  .member-row {
    display: flex;
    align-items: center;
    gap: ${polished.rem(8)};
    padding: ${polished.rem(8)};
    margin: 0;
    cursor: pointer;
    &:hover { background: var(--sys-color-surface-paper); }
    &:focus-within { outline: 2px solid var(--sys-color-primary); outline-offset: -2px; }
  }
  .member-copy { min-width: 0; overflow-wrap: anywhere; }
  .member-username { display: block; font-size: ${polished.rem(11)}; }
  .member-selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${polished.rem(8)};
    padding-block: ${polished.rem(4)};
  }
`

export default function ViewMemberPicker ({ view, intl, onChange }: Props) {
  const message = (id: string, values?: { [key: string]: any }) =>
    intl.formatMessage({ id, defaultMessage: defaultMessages[id] }, values)
  const mode = view.memberAccess ?? 'all'
  const selected = view.allowedUsers || []
  const groupKey = JSON.stringify(view.groups.map(group => group.id).sort())
  const [query, setQuery] = React.useState('')
  const [retry, setRetry] = React.useState(0)
  const [result, setResult] = React.useState<{
    groupKey: string
    members: ViewUserInfo[]
    loading: boolean
    failed: boolean
  }>({ groupKey: '', members: [], loading: false, failed: false })

  React.useEffect(() => {
    if (mode !== 'specific') return
    const groupIds = JSON.parse(groupKey) as string[]
    if (groupIds.length === 0) return
    const controller = new AbortController()
    let active = true
    const timer = setTimeout(() => { controller.abort() }, 30000)
    setResult({ groupKey, members: [], loading: true, failed: false })
    loadGroupMembers(groupIds, controller.signal).then(members => {
      if (active) setResult({ groupKey, members, loading: false, failed: false })
    }).catch(() => {
      if (active) setResult({ groupKey, members: [], loading: false, failed: true })
    }).finally(() => { clearTimeout(timer) })
    return () => {
      active = false
      clearTimeout(timer)
      controller.abort()
    }
  }, [groupKey, mode, retry])

  const current = result.groupKey === groupKey
  const loading = view.groups.length > 0 && (!current || result.loading)
  const members = current ? result.members : []
  const filtered = members.filter(member =>
    `${member.username} ${member.fullName || ''}`.toLowerCase().includes(query.trim().toLowerCase())
  )
  const toggle = (member: ViewUserInfo, checked: boolean) => {
    const others = selected.filter(user => user.username.toLowerCase() !== member.username.toLowerCase())
    onChange('specific', checked ? [...others, member] : others)
  }

  return (
    <section className='view-editor-section' css={style} aria-labelledby={`view-members-${view.id}`}>
      <label id={`view-members-${view.id}`} className='view-editor-section-title d-block' htmlFor={`member-mode-${view.id}`}>
        {message('viewMembersTitle')}
      </label>
      <Select
        id={`member-mode-${view.id}`}
        className='w-100'
        value={mode}
        onChange={event => { onChange(event.target.value as 'all' | 'specific', selected) }}
      >
        <Option value='all'>{message('allGroupMembers')}</Option>
        <Option value='specific'>{message('specificGroupMembers')}</Option>
      </Select>
      <div className='member-help'>{message(mode === 'all' ? 'allGroupMembersHelp' : 'specificGroupMembersHelp')}</div>
      {mode === 'specific' && (
        <React.Fragment>
          {selected.length === 0 && <Alert withIcon open type='warning' className='mt-2 w-100' text={message('noSelectedMembers')} />}
          {selected.length > 0 && (
            <React.Fragment>
              <div className='member-label'>{message('selectedMembersCount', { count: selected.length })}</div>
              {selected.map(member => (
                <div className='member-selected' key={member.username.toLowerCase()}>
                  <span className='member-copy'>
                    <span dir='auto'>{member.fullName || member.username}</span>
                    {member.fullName && <span className='member-username' dir='auto'>{member.username}</span>}
                  </span>
                  <Button
                    type='tertiary'
                    size='sm'
                    aria-label={message('removeNamedMember', { name: member.username })}
                    onClick={() => { toggle(member, false) }}
                  >{message('removeMember')}</Button>
                </div>
              ))}
            </React.Fragment>
          )}
          {view.groups.length === 0
            ? <div className='member-help'>{message('selectGroupsForMembers')}</div>
            : <React.Fragment>
                <label className='member-label' htmlFor={`member-search-${view.id}`}>{message('searchGroupMembers')}</label>
                <TextInput
                  id={`member-search-${view.id}`}
                  className='w-100'
                  value={query}
                  placeholder={message('searchMembersPlaceholder')}
                  onChange={event => { setQuery(event.target.value) }}
                  allowClear
                />
                {loading && <div className='member-help' role='status'>{message('loadingGroupMembers')}</div>}
                {current && result.failed && (
                  <React.Fragment>
                    <Alert withIcon open type='warning' className='mt-2 w-100' text={message('groupMembersLoadError')} />
                    <Button className='mt-2' size='sm' onClick={() => { setRetry(value => value + 1) }}>{message('retryMembers')}</Button>
                  </React.Fragment>
                )}
                {!loading && !result.failed && filtered.length === 0 && <div className='member-help' role='status'>{message('noGroupMembersFound')}</div>}
                {!loading && filtered.length > 0 && (
                  <div className='member-results' role='group' aria-label={message('searchGroupMembers')}>
                    {filtered.map(member => (
                      <label className='member-row' key={member.username.toLowerCase()}>
                        <Checkbox
                          checked={selected.some(user => user.username.toLowerCase() === member.username.toLowerCase())}
                          aria-label={message('selectNamedMember', { name: member.username })}
                          onChange={event => { toggle(member, event.target.checked) }}
                        />
                        <span className='member-copy'>
                          <span dir='auto'>{member.fullName || member.username}</span>
                          {member.fullName && <span className='member-username' dir='auto'>{member.username}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </React.Fragment>}
        </React.Fragment>
      )}
    </section>
  )
}
