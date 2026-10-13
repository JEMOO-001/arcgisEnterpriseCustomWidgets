/** @jsx jsx */
import {
  React,
  ReactRedux,
  SessionManager,
  css,
  getAppStore,
  jsx,
  type IMState
} from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import {
  Button,
  Checkbox,
  Label,
  Option,
  Select,
  TextInput
} from 'jimu-ui'
import {
  SettingRow,
  SettingSection
} from 'jimu-ui/advanced/setting-components'
import ControllerSetting, {
  useControlledWidgets
} from '../../../../../dist/widgets/common/controller/src/setting/setting'
import { BASE_LAYOUT_NAME } from '../../../../../dist/widgets/common/controller/src/common/consts'
import type {
  IMConfig,
  PortalGroupInfo,
  WidgetAccessMap,
  WidgetAccessMode,
  WidgetAccessRule
} from '../config'

type GroupScope = 'my' | 'organization'

interface GroupOption extends PortalGroupInfo {
  owner?: string
}

const settingStyle = css`
  .permission-access-section {
    border-top: 1px solid var(--ref-palette-neutral-400);
  }

  .permission-widget-card {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--ref-palette-neutral-400);
    border-radius: 4px;
  }

  .permission-help {
    color: var(--ref-palette-neutral-1100);
    font-size: 12px;
    line-height: 1.4;
  }

  .permission-group-list {
    width: 100%;
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--ref-palette-neutral-400);
    border-radius: 3px;
  }

  .permission-group-row {
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--ref-palette-neutral-300);

    &:last-child {
      border-bottom: none;
    }
  }

  .permission-selected-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px;
    margin-top: 4px;
    border-radius: 3px;
    background: var(--ref-palette-neutral-300);
  }
`

const toMutableAccessMap = (value: IMConfig['widgetAccess']): WidgetAccessMap => {
  if (!value) return {}
  return (value as any).asMutable
    ? (value as any).asMutable({ deep: true })
    : { ...value } as WidgetAccessMap
}

const toMutableGroups = (rule?: WidgetAccessRule): PortalGroupInfo[] => {
  const groups = rule?.groups as any
  if (!groups) return []
  return groups.asMutable ? groups.asMutable({ deep: true }) : [...groups]
}

const PermissionAccessSetting = (props: AllWidgetSettingProps<IMConfig>) => {
  const { id, config, onSettingChange } = props
  const controlledWidgets = useControlledWidgets(id, BASE_LAYOUT_NAME)
  const widgetJsons = ReactRedux.useSelector((state: IMState) =>
    state.appStateInBuilder?.appConfig?.widgets ?? state.appConfig.widgets
  )
  const widgetIds = controlledWidgets.map(item => item.value).asMutable()
  const [selectedWidgetId, setSelectedWidgetId] = React.useState(widgetIds[0] ?? '')
  const [scope, setScope] = React.useState<GroupScope>('my')
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<GroupOption[]>([])
  const [searching, setSearching] = React.useState(false)
  const [searchError, setSearchError] = React.useState(false)

  React.useEffect(() => {
    if (!widgetIds.includes(selectedWidgetId)) {
      setSelectedWidgetId(widgetIds[0] ?? '')
    }
  }, [selectedWidgetId, widgetIds])

  React.useEffect(() => {
    setResults([])
    setSearchError(false)
  }, [selectedWidgetId, scope])

  const selectedWidget = controlledWidgets.find(item => item.value === selectedWidgetId)
  const selectedWidgetJson = widgetJsons?.[selectedWidgetId]
  const isEdit01 = selectedWidgetJson?.manifest?.name === 'edit01'
  const accessMap = toMutableAccessMap(config.widgetAccess)
  const storedRule = accessMap[selectedWidgetId]
  const rule: WidgetAccessRule = storedRule ?? { mode: 'everyone', groups: [] }
  const selectedGroups = toMutableGroups(rule)

  const updateRule = React.useCallback((nextRule: WidgetAccessRule) => {
    if (!selectedWidgetId) return
    const nextAccess = {
      ...toMutableAccessMap(config.widgetAccess),
      [selectedWidgetId]: nextRule
    }
    onSettingChange({ id, config: config.set('widgetAccess', nextAccess) })
  }, [config, id, onSettingChange, selectedWidgetId])

  const handleModeChange = (mode: WidgetAccessMode) => {
    updateRule({ mode, groups: selectedGroups })
  }

  const toggleGroup = (group: GroupOption, checked: boolean) => {
    const nextGroups = checked
      ? (selectedGroups.some(item => item.id === group.id)
          ? selectedGroups
          : [...selectedGroups, { id: group.id, title: group.title }])
      : selectedGroups.filter(item => item.id !== group.id)
    updateRule({ mode: 'groups', groups: nextGroups })
  }

  const searchGroups = React.useCallback(async () => {
    setSearching(true)
    setSearchError(false)
    try {
      const state = getAppStore().getState() as any
      const portalUrl = (state.portalUrl || 'https://www.arcgis.com').replace(/\/+$/, '')
      const session = SessionManager.getInstance().getSessionByUrl(portalUrl) as any
      const token = session?.token
      const orgId = state.portalSelf?.id || state.user?.orgId
      const clean = query.trim().replace(/[\\":+()\[\]{}^~*?]/g, ' ')
      const words = clean.split(/\s+/).filter(Boolean)
      const titleQuery = words.map(word => `title:${word}*`).join(' AND ')
      const params = new URLSearchParams({
        num: '50',
        start: '1',
        sortField: 'title',
        sortOrder: 'asc',
        f: 'json'
      })

      if (scope === 'my') {
        params.set('searchUserAccess', 'groupMember')
        if (titleQuery) params.set('q', titleQuery)
      } else {
        const organizationQuery = orgId
          ? (titleQuery ? `orgid:${orgId} AND (${titleQuery})` : `orgid:${orgId}`)
          : (titleQuery || '*')
        params.set('q', organizationQuery)
      }
      if (token) params.set('token', token)

      const response = await fetch(`${portalUrl}/sharing/rest/community/groups`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data?.error) throw new Error(data.error.message || 'Portal search failed')
      setResults((data?.results || []).map((group: any) => ({
        id: group.id,
        title: group.title,
        owner: group.owner
      })))
    } catch (error) {
      console.error('Unable to search portal groups.', error)
      setResults([])
      setSearchError(true)
    } finally {
      setSearching(false)
    }
  }, [query, scope])

  return (
    <SettingSection className='permission-access-section' title='Widget access'>
      {widgetIds.length === 0 && (
        <SettingRow>
          <div className='permission-help'>Add one or more widgets to configure their visibility.</div>
        </SettingRow>
      )}

      {widgetIds.length > 0 && (
        <React.Fragment>
          <SettingRow label='Child widget' flow='wrap'>
            <Select
              className='w-100'
              value={selectedWidgetId}
              onChange={event => { setSelectedWidgetId(event.target.value) }}
            >
              {controlledWidgets.map(item => (
                <Option key={item.value} value={item.value}>{item.label || item.value}</Option>
              ))}
            </Select>
          </SettingRow>

          <SettingRow>
            <div className='permission-widget-card'>
              <Label className='font-weight-bold mb-2 d-block'>
                {selectedWidget?.label || selectedWidgetId}
              </Label>

              {isEdit01 && (
                <div className='permission-help'>
                  Visibility is calculated automatically from this edit01 widget&apos;s editing privilege,
                  permission views, Portal groups, allowed users, and editable fields.
                </div>
              )}

              {!isEdit01 && (
                <React.Fragment>
                  <Label className='mb-1 d-block'>Who can see this widget?</Label>
                  <Select
                    className='w-100'
                    value={rule.mode}
                    onChange={event => { handleModeChange(event.target.value as WidgetAccessMode) }}
                  >
                    <Option value='everyone'>Everyone with access</Option>
                    <Option value='groups'>Selected Portal groups</Option>
                  </Select>

                  {rule.mode === 'groups' && (
                    <React.Fragment>
                      {selectedGroups.length === 0 && (
                        <div className='permission-help mt-2'>
                          No groups selected. The widget remains visible to everyone until a group is selected.
                        </div>
                      )}

                      {selectedGroups.map(group => (
                        <div className='permission-selected-group' key={group.id}>
                          <span>{group.title}</span>
                          <Button
                            size='sm'
                            type='tertiary'
                            onClick={() => { toggleGroup({ ...group }, false) }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}

                      <Label className='mt-3 mb-1 d-block'>Find Portal groups</Label>
                      <Select
                        className='w-100 mb-2'
                        value={scope}
                        onChange={event => { setScope(event.target.value as GroupScope) }}
                      >
                        <Option value='my'>My accessible groups</Option>
                        <Option value='organization'>Organization groups</Option>
                      </Select>
                      <TextInput
                        className='w-100 mb-2'
                        value={query}
                        placeholder='Search groups by name…'
                        onChange={event => { setQuery(event.target.value) }}
                        onKeyDown={event => {
                          if (event.key === 'Enter') void searchGroups()
                        }}
                      />
                      <Button
                        className='w-100'
                        type='secondary'
                        disabled={searching}
                        onClick={() => { void searchGroups() }}
                      >
                        {searching ? 'Searching…' : 'Search groups'}
                      </Button>

                      {searchError && (
                        <div className='permission-help mt-2'>Unable to load Portal groups.</div>
                      )}

                      {results.length > 0 && (
                        <div className='permission-group-list mt-2'>
                          {results.map(group => {
                            const checked = selectedGroups.some(item => item.id === group.id)
                            return (
                              <Label className='permission-group-row mb-0' key={group.id}>
                                <Checkbox
                                  checked={checked}
                                  onChange={event => { toggleGroup(group, event.target.checked) }}
                                />
                                <span className='ml-2'>{group.title}</span>
                              </Label>
                            )
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  )}
                </React.Fragment>
              )}
            </div>
          </SettingRow>
        </React.Fragment>
      )}
    </SettingSection>
  )
}

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  return (
    <div css={settingStyle}>
      <ControllerSetting {...props as any} />
      <PermissionAccessSetting {...props} />
    </div>
  )
}

export default Setting
