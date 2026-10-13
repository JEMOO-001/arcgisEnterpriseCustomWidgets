/** @jsx jsx */
import {
  React,
  jsx,
  type ImmutableArray,
  type IntlShape,
  type IMThemeVariables,
  type SerializedStyles,
  css,
  polished,
  LoadingType,
  getAppStore,
  SessionManager
} from 'jimu-core'
import {
  defaultMessages as jimuUIDefaultMessages,
  Button,
  TextInput,
  Switch,
  Checkbox,
  Alert,
  ConfirmDialog,
  Loading
} from 'jimu-ui'
import { SettingSection, SettingRow, SidePopper } from 'jimu-ui/advanced/setting-components'
import { Tree, TreeItemActionType, TreeAlignmentType, type TreeItemType } from 'jimu-ui/basic/list-tree'
import { dataComponentsUtils } from 'jimu-ui/advanced/data-source-selector'
import { TrashOutlined } from 'jimu-icons/outlined/editor/trash'
import { PlusOutlined } from 'jimu-icons/outlined/editor/plus'
import { CloseOutlined } from 'jimu-icons/outlined/editor/close'
import { DownOutlined } from 'jimu-icons/outlined/directional/down'
import { SharedGroupOutlined } from 'jimu-icons/outlined/application/shared-group'
import defaultMessages from './translations/default'
import ViewMemberPicker from './view-member-picker'
import { type ViewConfig, type ViewGroupInfo, type LayersConfig, type TreeFields, LayerHonorModeType } from '../config'

const messages = Object.assign({}, defaultMessages, jimuUIDefaultMessages)
const VIEW_TREE_ROOT = 'root item for view field tree'
const SEARCH_DEBOUNCE = 300
type GroupSearchScope = 'my' | 'organization'
type GroupRelationship = 'owner' | 'member' | 'organization'

// a lightweight, serializable projection of a portal group used for the picker UI and config
interface GroupOption {
  id: string
  title: string
  thumbnail?: string
  relationship: GroupRelationship
}

interface Props {
  views: ImmutableArray<ViewConfig>
  viewsEnabled: boolean
  layersConfig: ImmutableArray<LayersConfig>
  intl: IntlShape
  theme: IMThemeVariables
  onViewsChange: (views: ViewConfig[]) => void
  onViewsEnabledChange: (enabled: boolean) => void
}

interface State {
  activeViewId: string
  viewEditorFocusNode: HTMLElement
  nameDrafts: { [viewId: string]: string }
  groupQuery: { [viewId: string]: string }
  groupScope: { [viewId: string]: GroupSearchScope }
  groupResults: { [viewId: string]: GroupOption[] }
  groupNextStart: { [viewId: string]: number }
  groupSelections: { [viewId: string]: GroupOption[] }
  groupSearching: { [viewId: string]: boolean }
  groupLoadError: { [viewId: string]: boolean }
  deleteViewId: string
}

const genId = () => `view_${Date.now()}_${Math.floor(Math.random() * 10000)}`

export default class ViewManager extends React.PureComponent<Props, State> {
  searchTimers: { [viewId: string]: ReturnType<typeof setTimeout> }
  searchSeq: { [viewId: string]: number }

  constructor (props: Props) {
    super(props)
    this.state = {
      activeViewId: '',
      viewEditorFocusNode: null,
      nameDrafts: {},
      groupQuery: {},
      groupScope: {},
      groupResults: {},
      groupNextStart: {},
      groupSelections: {},
      groupSearching: {},
      groupLoadError: {},
      deleteViewId: ''
    }
    this.searchTimers = {}
    this.searchSeq = {}
  }

  viewListTrigger = React.createRef<HTMLDivElement>()

  componentWillUnmount () {
    Object.keys(this.searchTimers).forEach(viewId => {
      clearTimeout(this.searchTimers[viewId])
    })
  }

  formatMessage = (id: string, values?: { [key: string]: any }) => {
    return this.props.intl.formatMessage(
      { id: id, defaultMessage: messages[id] },
      values
    )
  }

  getStyle = (): SerializedStyles => {
    return css`
      width: 100%;
      .view-manager-list {
        display: flex;
        flex-direction: column;
        gap: ${polished.rem(8)};
      }
      .view-list-item {
        display: flex;
        align-items: stretch;
        min-width: 0;
        border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.3));
        border-radius: ${polished.rem(4)};
        background: var(--sys-color-surface-paper, rgba(127, 127, 127, 0.08));
        overflow: hidden;
        transition: border-color 0.2s, background-color 0.2s;
        &:hover {
          border-color: var(--sys-color-primary, #007ac2);
          background: var(--sys-color-surface, rgba(127, 127, 127, 0.12));
        }
        .view-list-open {
          display: flex;
          align-items: center;
          gap: ${polished.rem(9)};
          flex: 1;
          min-width: 0;
          padding: ${polished.rem(10)};
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: inherit;
          cursor: pointer;
          &:focus-visible {
            outline: 2px solid var(--sys-color-primary, #007ac2);
            outline-offset: -2px;
          }
        }
        .view-list-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${polished.rem(30)};
          height: ${polished.rem(30)};
          flex-shrink: 0;
          border-radius: 50%;
          color: var(--sys-color-primary, #007ac2);
          background: var(--sys-color-primary-light, rgba(0, 122, 194, 0.14));
        }
        .view-list-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex: 1;
          min-width: 0;
        }
        .view-list-title {
          display: block;
          overflow: hidden;
          color: var(--sys-color-text-primary, inherit);
          font-size: ${polished.rem(13)};
          font-weight: 600;
          line-height: 1.35;
          text-align: start;
          text-overflow: ellipsis;
          unicode-bidi: plaintext;
          white-space: nowrap;
        }
        .view-list-summary {
          display: block;
          margin-top: ${polished.rem(2)};
          color: var(--sys-color-text-secondary, inherit);
          font-size: ${polished.rem(11)};
          line-height: 1.35;
          opacity: 0.72;
          text-align: left;
          unicode-bidi: isolate;
        }
        .view-list-arrow {
          flex-shrink: 0;
          opacity: 0.6;
        }
        .view-list-delete-btn {
          align-self: center;
          flex-shrink: 0;
          margin-right: ${polished.rem(5)};
          opacity: 0.72;
          &:hover {
            color: var(--sys-color-error, #d83020);
            opacity: 1;
          }
        }
      }
      .view-list-empty {
        padding: ${polished.rem(14)} ${polished.rem(10)};
        border: 1px dashed var(--sys-color-divider, rgba(127, 127, 127, 0.35));
        border-radius: ${polished.rem(4)};
        text-align: center;
        .view-list-empty-icon {
          margin-bottom: ${polished.rem(6)};
          opacity: 0.6;
        }
        .view-list-empty-title {
          font-size: ${polished.rem(12)};
          font-weight: 600;
        }
        .view-list-empty-description {
          margin-top: ${polished.rem(3)};
          font-size: ${polished.rem(11)};
          line-height: 1.4;
          opacity: 0.68;
        }
      }
      .view-editor-scroll {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overscroll-behavior: contain;
        .view-card {
          margin: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          &:hover {
            border-color: transparent;
          }
          .view-card-body {
            padding: 0;
            border-top: 0;
          }
          .group-access-panel {
            margin: 0;
            padding: ${polished.rem(16)};
            border: 0;
            border-bottom: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
            border-radius: 0;
            background: transparent;
          }
        }
        .view-editor-section {
          padding: ${polished.rem(16)};
          border-bottom: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
        }
        .view-editor-section-title {
          margin-bottom: ${polished.rem(10)};
          font-size: ${polished.rem(13)};
          font-weight: 600;
        }
      }
        .view-manager-desc {
          font-size: ${polished.rem(12)};
          opacity: 0.75;
          margin-bottom: ${polished.rem(10)};
          line-height: 1.4;
        }
        .view-card {
          border: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.12));
          border-radius: ${polished.rem(6)};
          margin-bottom: ${polished.rem(10)};
          background: var(--sys-color-surface, rgba(255, 255, 255, 0.04));
          overflow: hidden;
          transition: border-color 0.2s;
          &:hover {
            border-color: var(--sys-color-primary, #007ac2);
          }
          .view-card-body {
            padding: ${polished.rem(10)};
            border-top: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.08));
          }
          .view-section-label {
            font-weight: 600;
            font-size: ${polished.rem(12)};
            margin: ${polished.rem(10)} 0 ${polished.rem(4)} 0;
            opacity: 0.9;
          }
          .group-access-panel {
            margin-top: ${polished.rem(10)};
            padding: ${polished.rem(10)};
            border: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.15));
            border-radius: ${polished.rem(6)};
            background: var(--sys-color-surface-paper, rgba(255, 255, 255, 0.06));
          }
          .group-access-header {
            display: flex;
            align-items: flex-start;
            gap: ${polished.rem(8)};
            .group-access-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: ${polished.rem(30)};
              height: ${polished.rem(30)};
              flex-shrink: 0;
              border-radius: 50%;
              color: var(--sys-color-primary, #007ac2);
              background: var(--sys-color-primary-light, rgba(0, 122, 194, 0.14));
            }
            .group-access-copy {
              flex: 1;
              min-width: 0;
            }
            .group-access-title {
              font-size: ${polished.rem(13)};
              font-weight: 600;
              line-height: 1.3;
            }
            .group-access-help {
              margin-top: ${polished.rem(2)};
              font-size: ${polished.rem(11)};
              line-height: 1.4;
              opacity: 0.72;
            }
            .group-selected-count {
              flex-shrink: 0;
              padding: ${polished.rem(2)} ${polished.rem(7)};
              border-radius: ${polished.rem(10)};
              background: var(--sys-color-surface, rgba(255, 255, 255, 0.1));
              font-size: ${polished.rem(11)};
              font-weight: 600;
              white-space: nowrap;
            }
          }
          .group-selected-label,
          .group-picker-label {
            display: block;
            margin-top: ${polished.rem(10)};
            margin-bottom: ${polished.rem(4)};
            font-size: ${polished.rem(11)};
            font-weight: 600;
          }
          .group-scope-selector {
            display: flex;
            width: 100%;
            margin-top: ${polished.rem(10)};
            border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.3));
            border-radius: ${polished.rem(4)};
            overflow: hidden;
            .group-scope-button {
              flex: 1;
              min-width: 0;
              min-height: ${polished.rem(32)};
              padding: ${polished.rem(5)} ${polished.rem(7)};
              border: 0;
              border-inline-end: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.3));
              background: transparent;
              color: inherit;
              font: inherit;
              font-size: ${polished.rem(11)};
              cursor: pointer;
              &:last-child {
                border-inline-end: 0;
              }
              &:hover {
                background: var(--sys-color-surface, rgba(127, 127, 127, 0.12));
              }
              &:focus-visible {
                position: relative;
                outline: 2px solid var(--sys-color-primary, #007ac2);
                outline-offset: -2px;
              }
              &[aria-pressed='true'] {
                color: var(--sys-color-primary, #007ac2);
                background: var(--sys-color-primary-light, rgba(0, 122, 194, 0.14));
                font-weight: 600;
              }
            }
          }
          .group-scope-help {
            margin-top: ${polished.rem(5)};
            font-size: ${polished.rem(10)};
            line-height: 1.4;
            opacity: 0.7;
          }
          .group-empty-state {
            display: flex;
            align-items: flex-start;
            gap: ${polished.rem(8)};
            margin-top: ${polished.rem(10)};
            padding: ${polished.rem(9)};
            border: 1px dashed var(--sys-color-divider, rgba(255, 255, 255, 0.18));
            border-radius: ${polished.rem(5)};
            .group-empty-icon {
              flex-shrink: 0;
              margin-top: ${polished.rem(1)};
              opacity: 0.65;
            }
            .group-empty-title {
              font-size: ${polished.rem(12)};
              font-weight: 600;
            }
            .group-empty-description {
              margin-top: ${polished.rem(2)};
              font-size: ${polished.rem(11)};
              line-height: 1.4;
              opacity: 0.7;
            }
          }
          .group-chips {
            display: flex;
            flex-direction: column;
            gap: ${polished.rem(6)};
            margin: ${polished.rem(6)} 0;
          }
          .group-chip {
            display: flex;
            align-items: center;
            gap: ${polished.rem(6)};
            width: 100%;
            padding: ${polished.rem(6)} ${polished.rem(8)};
            border-radius: ${polished.rem(4)};
            background: var(--sys-color-surface-paper, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
            font-size: ${polished.rem(12)};
            max-width: 100%;
            .group-chip-thumb {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              object-fit: cover;
              flex-shrink: 0;
            }
            .group-chip-title {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .group-chip-remove {
              flex-shrink: 0;
              width: ${polished.rem(22)};
              height: ${polished.rem(22)};
              min-height: ${polished.rem(22)};
              padding: 0;
              opacity: 0.7;
              &:hover {
                opacity: 1;
              }
            }
          }
          .group-search-results {
            border: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.15));
            border-radius: ${polished.rem(4)};
            max-height: ${polished.rem(180)};
            overflow-y: auto;
            margin-top: ${polished.rem(4)};
            background: var(--sys-color-surface, rgba(127, 127, 127, 0.08));
            .group-search-item {
              display: flex;
              align-items: center;
              gap: ${polished.rem(8)};
              padding: ${polished.rem(6)} ${polished.rem(8)};
              cursor: pointer;
              width: 100%;
              margin: 0;
              border: 0;
              background: transparent;
              color: inherit;
              font: inherit;
              text-align: inherit;
              &:hover:not(.is-disabled) {
                background: rgba(255, 255, 255, 0.08);
              }
              &:focus-within {
                outline: 2px solid var(--sys-color-primary, #007ac2);
                outline-offset: -2px;
              }
              &.is-disabled {
                cursor: default;
                opacity: 0.6;
              }
              .group-search-checkbox {
                flex-shrink: 0;
              }
              .group-search-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
              }
              .group-search-title {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: ${polished.rem(12)};
              }
              .group-search-action {
                flex-shrink: 0;
                padding: ${polished.rem(1)} ${polished.rem(5)};
                border-radius: ${polished.rem(8)};
                background: var(--sys-color-surface-paper, rgba(127, 127, 127, 0.12));
                font-size: ${polished.rem(11)};
                font-weight: 600;
              }
            }
            .group-search-empty {
              padding: ${polished.rem(8)};
              font-size: ${polished.rem(12)};
              opacity: 0.6;
            }
          }
          .group-picker-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${polished.rem(8)};
            margin-top: ${polished.rem(7)};
            .group-selection-count {
              min-width: 0;
              font-size: ${polished.rem(11)};
              opacity: 0.75;
            }
          }
          .group-search-status {
            display: flex;
            align-items: center;
            gap: ${polished.rem(6)};
            min-height: ${polished.rem(24)};
            margin-top: ${polished.rem(4)};
            font-size: ${polished.rem(11)};
            opacity: 0.75;
          }
          .view-layer-block {
            margin-top: ${polished.rem(10)};
            border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
            border-radius: ${polished.rem(4)};
            overflow: hidden;
            .view-layer-header {
              display: flex;
              align-items: center;
              gap: ${polished.rem(8)};
              padding: ${polished.rem(8)};
              background: var(--sys-color-surface-paper, rgba(127, 127, 127, 0.08));
            }
            .view-layer-title {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              font-size: ${polished.rem(12)};
              font-weight: 600;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .view-layer-count {
              flex-shrink: 0;
              font-size: ${polished.rem(10)};
              opacity: 0.68;
            }
            .view-layer-webmap-note {
              padding: ${polished.rem(8)};
              font-size: ${polished.rem(11)};
              font-style: italic;
              opacity: 0.6;
            }
            .view-field-tree {
              max-height: ${polished.rem(240)};
              overflow-y: auto;
              width: 100%;
              padding: ${polished.rem(4)};
              .tree-item {
                justify-content: space-between;
                align-items: center;
                font-size: ${polished.rem(12)};
              }
            }
          }
      }
    `
  }

  getMutableViews = (): ViewConfig[] => {
    const { views } = this.props
    if (!views) return []
    return views.asMutable ? views.asMutable({ deep: true }) : (views as any)
  }

  updateViews = (newViews: ViewConfig[]) => {
    this.props.onViewsChange(newViews)
  }

  addView = (focusNode: HTMLElement) => {
    const views = this.getMutableViews()
    const newView: ViewConfig = {
      id: genId(),
      name: `${this.formatMessage('viewDefaultName')} ${views.length + 1}`,
      groups: [],
      editableFields: {}
    }
    this.updateViews([...views, newView])
    this.setState({ activeViewId: newView.id, viewEditorFocusNode: focusNode })
  }

  openViewEditor = (viewId: string, focusNode: HTMLElement) => {
    this.setState({ activeViewId: viewId, viewEditorFocusNode: focusNode })
  }

  closeViewEditor = () => {
    this.setState({ activeViewId: '' })
  }

  requestDeleteView = (viewId: string) => {
    this.setState({ deleteViewId: viewId })
  }

  confirmDeleteView = () => {
    const { deleteViewId } = this.state
    if (this.searchTimers[deleteViewId]) {
      clearTimeout(this.searchTimers[deleteViewId])
      delete this.searchTimers[deleteViewId]
    }
    this.searchSeq[deleteViewId] = (this.searchSeq[deleteViewId] || 0) + 1
    const views = this.getMutableViews().filter(v => v.id !== deleteViewId)
    this.updateViews(views)
    this.setState(prev => ({
      deleteViewId: '',
      activeViewId: prev.activeViewId === deleteViewId ? '' : prev.activeViewId
    }))
  }

  cancelDeleteView = () => {
    this.setState({ deleteViewId: '' })
  }

  onNameDraftChange = (viewId: string, value: string) => {
    this.setState(prev => ({ nameDrafts: { ...prev.nameDrafts, [viewId]: value } }))
  }

  commitName = (viewId: string) => {
    const currentView = this.getMutableViews().find(view => view.id === viewId)
    if (!currentView) return
    const draft = (this.state.nameDrafts[viewId] ?? currentView.name).trim()
    const acceptedName = draft || currentView.name
    if (acceptedName !== currentView.name) {
      const views = this.getMutableViews().map(view => view.id === viewId ? { ...view, name: acceptedName } : view)
      this.updateViews(views)
    }
    this.setState(prev => ({ nameDrafts: { ...prev.nameDrafts, [viewId]: acceptedName } }))
  }

  // ---------------- portal group search ----------------
  onGroupQueryChange = (viewId: string, value: string) => {
    this.setState(prev => ({
      groupQuery: { ...prev.groupQuery, [viewId]: value },
      groupResults: { ...prev.groupResults, [viewId]: [] },
      groupNextStart: { ...prev.groupNextStart, [viewId]: -1 },
      groupSearching: { ...prev.groupSearching, [viewId]: true },
      groupLoadError: { ...prev.groupLoadError, [viewId]: false }
    }))
    if (this.searchTimers[viewId]) clearTimeout(this.searchTimers[viewId])
    this.searchTimers[viewId] = setTimeout(() => {
      this.searchGroups(viewId, value)
    }, SEARCH_DEBOUNCE)
  }

  onGroupScopeChange = (viewId: string, scope: GroupSearchScope) => {
    if ((this.state.groupScope[viewId] ?? 'my') === scope) return
    if (this.searchTimers[viewId]) {
      clearTimeout(this.searchTimers[viewId])
      delete this.searchTimers[viewId]
    }
    const query = this.state.groupQuery[viewId] ?? ''
    this.setState(prev => ({
      groupScope: { ...prev.groupScope, [viewId]: scope },
      groupResults: { ...prev.groupResults, [viewId]: [] },
      groupNextStart: { ...prev.groupNextStart, [viewId]: -1 },
      groupLoadError: { ...prev.groupLoadError, [viewId]: false }
    }), () => { this.searchGroups(viewId, query, scope) })
  }

  getPortalContext = () => {
    const state = getAppStore()?.getState() as any
    const portalUrl = (state?.portalUrl || 'https://www.arcgis.com').replace(/\/+$/, '')
    const session = SessionManager.getInstance().getSessionByUrl(portalUrl)
    return {
      state,
      portalUrl,
      token: session?.token || state?.token
    }
  }

  getLegacyThumbnailName = (thumbnailUrl?: string): string => {
    if (!thumbnailUrl) return ''
    try {
      const infoPath = new URL(thumbnailUrl).pathname.split('/info/')[1] || ''
      return decodeURIComponent(infoPath.split('/').pop() || '')
    } catch {
      return ''
    }
  }

  getGroupThumbnailUrl = (group: Pick<ViewGroupInfo, 'id' | 'thumbnail' | 'thumbnailUrl'>): string => {
    const thumbnail = group.thumbnail || this.getLegacyThumbnailName(group.thumbnailUrl)
    if (!thumbnail) return ''
    const { portalUrl, token } = this.getPortalContext()
    const path = `${portalUrl}/sharing/rest/community/groups/${encodeURIComponent(group.id)}/info/${encodeURIComponent(thumbnail)}`
    return token ? `${path}?token=${encodeURIComponent(token)}` : path
  }

  searchGroups = async (
    viewId: string,
    text: string,
    scope: GroupSearchScope = this.state.groupScope[viewId] ?? 'my',
    start = 1
  ) => {
    const seq = (this.searchSeq[viewId] || 0) + 1
    this.searchSeq[viewId] = seq
    const isStale = () => this.searchSeq[viewId] !== seq
    this.setState(prev => ({
      groupSearching: { ...prev.groupSearching, [viewId]: true },
      groupLoadError: { ...prev.groupLoadError, [viewId]: false }
    }))
    try {
      const { state, portalUrl, token } = this.getPortalContext()
      const orgId = state?.portalSelf?.id || state?.user?.orgId

      // strip lucene special chars and require every word to match the group title
      const clean = (text || '').trim().replace(/[\\":+()\[\]{}^~*?]/g, ' ')
      const words = clean.split(/\s+/).filter(word => !!word)
      const titleQuery = words.map(word => `title:${word}*`).join(' AND ')

      const restUrl = `${portalUrl}/sharing/rest/community/groups`
      const params = new URLSearchParams({
        num: '50',
        start: start.toString(),
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

      const response = await fetch(`${restUrl}?${params.toString()}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      if (result?.error) throw new Error(result.error.message || 'Portal search failed')
      if (isStale()) return

      const username = (state?.user?.username || '').toLowerCase()
      const groups: GroupOption[] = (result?.results || []).map((g: any) => {
        const relationship: GroupRelationship = username && g.owner?.toLowerCase() === username
          ? 'owner'
          : scope === 'my' ? 'member' : 'organization'
        return {
          id: g.id,
          title: g.title,
          thumbnail: g.thumbnail || undefined,
          relationship
        }
      })
      this.setState(prev => {
        const currentResults = start > 1 ? (prev.groupResults[viewId] ?? []) : []
        const knownIds = new Set(currentResults.map(group => group.id))
        const nextResults = [...currentResults, ...groups.filter(group => !knownIds.has(group.id))]
        return {
          groupResults: { ...prev.groupResults, [viewId]: nextResults },
          groupNextStart: { ...prev.groupNextStart, [viewId]: result?.nextStart ?? -1 },
          groupSearching: { ...prev.groupSearching, [viewId]: false }
        }
      })
    } catch (err) {
      console.error(err)
      if (isStale()) return
      this.setState(prev => ({
        groupResults: start === 1 ? { ...prev.groupResults, [viewId]: [] } : prev.groupResults,
        groupNextStart: { ...prev.groupNextStart, [viewId]: -1 },
        groupSearching: { ...prev.groupSearching, [viewId]: false },
        groupLoadError: { ...prev.groupLoadError, [viewId]: true }
      }))
    }
  }

  toggleGroupSelection = (viewId: string, group: GroupOption, checked: boolean) => {
    this.setState(prev => {
      const selected = prev.groupSelections[viewId] ?? []
      const next = checked
        ? (selected.some(item => item.id === group.id) ? selected : [...selected, group])
        : selected.filter(item => item.id !== group.id)
      return { groupSelections: { ...prev.groupSelections, [viewId]: next } }
    })
  }

  addSelectedGroupsToView = (viewId: string) => {
    const selected = this.state.groupSelections[viewId] ?? []
    if (selected.length === 0) return
    const views = this.getMutableViews().map(v => {
      if (v.id !== viewId) return v
      const existingIds = new Set(v.groups.map(group => group.id))
      const additions: ViewGroupInfo[] = selected
        .filter(group => !existingIds.has(group.id))
        .map(group => ({ id: group.id, title: group.title, thumbnail: group.thumbnail }))
      return additions.length > 0 ? { ...v, groups: [...v.groups, ...additions] } : v
    })
    this.updateViews(views)
    // clear the picker state for this view and drop any in-flight search response
    if (this.searchTimers[viewId]) {
      clearTimeout(this.searchTimers[viewId])
      delete this.searchTimers[viewId]
    }
    this.searchSeq[viewId] = (this.searchSeq[viewId] || 0) + 1
    this.setState(prev => ({
      groupQuery: { ...prev.groupQuery, [viewId]: '' },
      groupResults: { ...prev.groupResults, [viewId]: [] },
      groupNextStart: { ...prev.groupNextStart, [viewId]: -1 },
      groupSelections: { ...prev.groupSelections, [viewId]: [] },
      groupSearching: { ...prev.groupSearching, [viewId]: false }
    }))
  }

  removeGroupFromView = (viewId: string, groupId: string) => {
    const views = this.getMutableViews().map(v => {
      if (v.id !== viewId) return v
      return { ...v, groups: v.groups.filter(g => g.id !== groupId) }
    })
    this.updateViews(views)
  }

  // ---------------- field selection ----------------
  toggleFieldForView = (viewId: string, layerId: string, fieldNames: string[]) => {
    const views = this.getMutableViews().map(v => {
      if (v.id !== viewId) return v
      return { ...v, editableFields: { ...v.editableFields, [layerId]: fieldNames } }
    })
    this.updateViews(views)
  }

  getLayerFieldSource = (layer: LayersConfig): TreeFields[] => {
    // layersConfig arrives deep-immutable from the config store, even though the
    // LayersConfig type declares plain arrays
    const grouped = layer.groupedFields as any
    if (grouped?.asMutable) return grouped.asMutable({ deep: true })
    if (grouped?.length) return grouped
    const show = layer.showFields as any
    if (show?.asMutable) return show.asMutable({ deep: true })
    return show || []
  }

  buildFieldTree = (layer: LayersConfig, allowed: string[]): TreeItemType => {
    const { theme } = this.props
    const source = this.getLayerFieldSource(layer)
    const toItem = (items: TreeFields[]): TreeItemType[] => {
      return (items || []).map((item, index) => {
        const isGroup = !!item.children
        const fieldKey = item.jimuName || item.name || `field_${index}`
        const checked = isGroup
          ? undefined
          : allowed.includes(item.jimuName || item.name)
        return {
          itemKey: isGroup ? `group_${item.groupKey ?? item.name ?? index}` : fieldKey,
          itemStateChecked: checked,
          itemStateTitle: item.alias || item.jimuName || item.name,
          itemStateIcon: isGroup ? undefined : dataComponentsUtils.getIconFromFieldType(item.type, theme),
          itemStateDetailContent: item,
          // only disable checkbox if the field is explicitly marked non-editable
          isCheckboxDisabled: isGroup ? false : !(item.editable ?? true),
          itemStateCommands: [],
          ...(isGroup ? { itemChildren: toItem(item.children) } : {})
        } as TreeItemType
      })
    }
    return {
      itemKey: VIEW_TREE_ROOT,
      itemStateTitle: VIEW_TREE_ROOT,
      itemChildren: toItem(source)
    }
  }

  // collect checked leaf jimuNames from an updated tree root
  collectCheckedFields = (root: TreeItemType): string[] => {
    const result: string[] = []
    const walk = (items: TreeItemType[]) => {
      (items || []).forEach(item => {
        if (item.itemChildren?.length) {
          walk(item.itemChildren)
        } else if (item.itemStateChecked) {
          const jimuName = item.itemStateDetailContent?.jimuName || item.itemStateDetailContent?.name || item.itemKey
          if (jimuName && jimuName !== VIEW_TREE_ROOT) result.push(jimuName)
        }
      })
    }
    walk(root?.itemChildren)
    return result
  }

  getFieldTreeActionMap = () => {
    return {
      overrideItemBlockInfo: () => {
        // same block structure as layer-config's field tree so checkboxes and the
        // children toggle render the same way everywhere in this widget
        return {
          name: TreeItemActionType.RenderOverrideItem,
          children: [{
            name: TreeItemActionType.RenderOverrideItemDroppableContainer,
            children: [{
              name: TreeItemActionType.RenderOverrideItemContent,
              children: [{
                name: TreeItemActionType.RenderOverrideItemBody,
                children: [{
                  name: TreeItemActionType.RenderOverrideItemMainLine,
                  children: [{
                    name: TreeItemActionType.RenderOverrideItemDraggableContainer,
                    children: [{
                      name: TreeItemActionType.RenderOverrideItemChildrenToggle
                    }, {
                      name: TreeItemActionType.RenderOverrideItemIcon
                    }, {
                      name: TreeItemActionType.RenderOverrideItemTitle
                    }]
                  }]
                }]
              }]
            }, {
              name: TreeItemActionType.RenderOverrideItemSubitems
            }]
          }]
        }
      }
    }
  }

  // ---------------- derived state / warnings ----------------
  countViewFields = (view: ViewConfig): number => {
    let count = 0
    const editableFields = view.editableFields || {}
    Object.keys(editableFields).forEach(layerId => {
      count += (editableFields[layerId] || []).length
    })
    return count
  }

  // layers that have fields but are not editable in ANY view.
  // layers honoring webmap settings are skipped: views intentionally do not apply there.
  getLayersWithNoEditableFields = (): string[] => {
    const mutableViews = this.getMutableViews()
    const layers = this.getMutableLayers()
    const result: string[] = []
    layers.forEach(layer => {
      if (layer.layerHonorMode === LayerHonorModeType.Webmap) return
      const fields = this.getLayerFieldSource(layer)
      if (!fields?.length) return
      const hasAny = mutableViews.some(view => (view.editableFields?.[layer.id] || []).length > 0)
      if (!hasAny) result.push(layer.name)
    })
    return result
  }

  getMutableLayers = (): LayersConfig[] => {
    const { layersConfig } = this.props
    if (!layersConfig) return []
    return layersConfig.asMutable ? layersConfig.asMutable({ deep: true }) : (layersConfig as any)
  }

  // ---------------- render helpers ----------------
  renderGroupChips = (view: ViewConfig) => {
    return (
      <div className='group-chips'>
        {view.groups.map(g => {
          const thumbnailUrl = this.getGroupThumbnailUrl(g)
          return (
            <span key={g.id} className='group-chip'>
              {thumbnailUrl
                ? <img
                    className='group-chip-thumb'
                    src={thumbnailUrl}
                    alt=''
                    width={24}
                    height={24}
                    onError={(evt: any) => { evt.currentTarget.style.display = 'none' }}
                  />
                : <SharedGroupOutlined size='s' aria-hidden='true' />}
              <span className='group-chip-title' title={g.title}>{g.title}</span>
              <Button
                size='sm'
                type='tertiary'
                icon
                className='group-chip-remove'
                title={this.formatMessage('removeGroup')}
                aria-label={`${this.formatMessage('removeGroup')}: ${g.title}`}
                onClick={() => { this.removeGroupFromView(view.id, g.id) }}
              >
                <CloseOutlined size='s' />
              </Button>
            </span>
          )
        })}
      </div>
    )
  }

  getGroupRelationshipLabel = (relationship: GroupRelationship): string => {
    switch (relationship) {
      case 'owner':
        return this.formatMessage('groupOwnerBadge')
      case 'member':
        return this.formatMessage('groupMemberBadge')
      default:
        return this.formatMessage('groupOrganizationBadge')
    }
  }

  renderGroupPicker = (view: ViewConfig) => {
    const { groupQuery, groupScope, groupResults, groupNextStart, groupSelections, groupSearching, groupLoadError } = this.state
    const query = groupQuery[view.id] ?? ''
    const scope = groupScope[view.id] ?? 'my'
    const results = groupResults[view.id] ?? []
    const nextStart = groupNextStart[view.id] ?? -1
    const selections = groupSelections[view.id] ?? []
    const searching = !!groupSearching[view.id]
    const loadError = !!groupLoadError[view.id]
    const inputId = `group-search-${view.id}`
    const scopeId = `group-source-${view.id}`
    return (
      <React.Fragment>
        <div id={scopeId} className='group-picker-label'>{this.formatMessage('groupSourceLabel')}</div>
        <div className='group-scope-selector' role='group' aria-labelledby={scopeId}>
          <button
            type='button'
            className='group-scope-button'
            aria-pressed={scope === 'my'}
            onClick={() => { this.onGroupScopeChange(view.id, 'my') }}
          >
            {this.formatMessage('myGroupsScope')}
          </button>
          <button
            type='button'
            className='group-scope-button'
            aria-pressed={scope === 'organization'}
            onClick={() => { this.onGroupScopeChange(view.id, 'organization') }}
          >
            {this.formatMessage('organizationGroupsScope')}
          </button>
        </div>
        <div className='group-scope-help'>
          {this.formatMessage(scope === 'my' ? 'myGroupsScopeHelp' : 'organizationGroupsScopeHelp')}
        </div>
        <label className='group-picker-label' htmlFor={inputId}>
          {this.formatMessage('addPortalGroup')}
        </label>
        <TextInput
          id={inputId}
          name={`portal-groups-${view.id}`}
          size='sm'
          className='w-100'
          value={query}
          placeholder={this.formatMessage('searchGroupsPlaceholder')}
          aria-label={this.formatMessage('searchGroupsPlaceholder')}
          autoComplete='off'
          onChange={evt => { this.onGroupQueryChange(view.id, evt.target.value) }}
          onFocus={() => { this.searchGroups(view.id, query, scope) }}
          allowClear
        />
        {searching &&
          <div className='group-search-status' role='status' aria-live='polite'>
            <Loading type={LoadingType.Secondary} width={16} height={16} />
            <span>{this.formatMessage('searchingGroups')}</span>
          </div>
        }
        {loadError &&
          <Alert withIcon open type='warning' className='w-100 mt-1' text={this.formatMessage('groupsLoadError')} />
        }
        {!loadError && results.length > 0 &&
          <div className='group-search-results' role='group' aria-label={this.formatMessage('groupSearchResults')}>
            {results.map(g => {
              const alreadyAdded = view.groups.some(x => x.id === g.id)
              const isSelected = selections.some(x => x.id === g.id)
              const thumbnailUrl = this.getGroupThumbnailUrl(g)
              return (
                <label
                  key={g.id}
                  className={`group-search-item${alreadyAdded ? ' is-disabled' : ''}`}
                >
                  <Checkbox
                    className='group-search-checkbox'
                    checked={alreadyAdded || isSelected}
                    disabled={alreadyAdded}
                    aria-label={this.formatMessage('selectNamedGroup', { name: g.title })}
                    onChange={evt => { this.toggleGroupSelection(view.id, g, evt.target.checked) }}
                  />
                  {thumbnailUrl
                    ? <img
                        className='group-search-thumb'
                        src={thumbnailUrl}
                        alt=''
                        width={20}
                        height={20}
                        onError={(evt: any) => { evt.currentTarget.style.display = 'none' }}
                      />
                    : <SharedGroupOutlined size='m' aria-hidden='true' />}
                  <span className='group-search-title' title={g.title}>{g.title}</span>
                  <span className='group-search-action'>
                    {alreadyAdded
                      ? this.formatMessage('groupAdded')
                      : isSelected
                        ? this.formatMessage('groupSelected')
                        : this.getGroupRelationshipLabel(g.relationship)}
                  </span>
                </label>
              )
            })}
          </div>
        }
        {!loadError && nextStart > 0 &&
          <Button
            size='sm'
            type='tertiary'
            className='w-100 mt-1'
            disabled={searching}
            onClick={() => { this.searchGroups(view.id, query, scope, nextStart) }}
          >
            {this.formatMessage('loadMoreGroups')}
          </Button>
        }
        {!searching && !loadError && query && results.length === 0 &&
          <div className='group-search-results'>
            <div className='group-search-empty'>{this.formatMessage('noGroupsFound')}</div>
          </div>
        }
        {(results.length > 0 || selections.length > 0) &&
          <div className='group-picker-actions'>
            <span className='group-selection-count' role='status' aria-live='polite'>
              {this.formatMessage('groupsPendingCount', { count: selections.length })}
            </span>
            <Button
              size='sm'
              type='primary'
              disabled={selections.length === 0}
              onClick={() => { this.addSelectedGroupsToView(view.id) }}
            >
              {this.formatMessage('addSelectedGroups', { count: selections.length })}
            </Button>
          </div>
        }
      </React.Fragment>
    )
  }

  renderViewListItem = (view: ViewConfig) => {
    const groupCount = view.groups.length
    const fieldCount = this.countViewFields(view)
    return (
      <div key={view.id} className='view-list-item'>
        <button
          type='button'
          className='view-list-open'
          aria-label={this.formatMessage('editViewTitle', { name: view.name })}
          onClick={evt => { this.openViewEditor(view.id, evt.currentTarget) }}
        >
          <span className='view-list-icon'>
            <SharedGroupOutlined size='m' aria-hidden='true' />
          </span>
          <span className='view-list-copy'>
            <span className='view-list-title' dir='auto' title={view.name}>{view.name}</span>
            <span className='view-list-summary' dir='ltr'>
              {this.formatMessage('viewAccessSummary', { groups: groupCount, fields: fieldCount })}
            </span>
            {view.memberAccess === 'specific' && <span className='view-list-summary'>
              {this.formatMessage('selectedMembersCount', { count: view.allowedUsers?.length || 0 })}
            </span>}
          </span>
          <DownOutlined autoFlip rotate={-90} className='view-list-arrow' aria-hidden='true' />
        </button>
        <Button
          size='sm'
          type='tertiary'
          icon
          className='view-list-delete-btn'
          title={this.formatMessage('deleteView')}
          aria-label={`${this.formatMessage('deleteView')}: ${view.name}`}
          onClick={() => { this.requestDeleteView(view.id) }}
        >
          <TrashOutlined />
        </Button>
      </div>
    )
  }

  renderViewDetails = (view: ViewConfig) => {
    const nameValue = this.state.nameDrafts[view.id] ?? view.name
    const nameInputId = `view-name-${view.id}`
    return (
      <section className='view-editor-section' aria-labelledby={`view-details-title-${view.id}`}>
        <div id={`view-details-title-${view.id}`} className='view-editor-section-title'>
          {this.formatMessage('viewDetailsSection')}
        </div>
        <label className='view-section-label d-block' htmlFor={nameInputId}>
          {this.formatMessage('viewNameLabel')}
        </label>
        <TextInput
          id={nameInputId}
          name={`view-name-${view.id}`}
          size='sm'
          className='w-100'
          value={nameValue}
          aria-label={this.formatMessage('viewNameLabel')}
          autoComplete='off'
          onChange={evt => { this.onNameDraftChange(view.id, evt.target.value) }}
          onAcceptValue={() => { this.commitName(view.id) }}
        />
      </section>
    )
  }

  renderAccessSection = (view: ViewConfig) => {
    const groupCount = view.groups.length
    return (
      <section className='group-access-panel' aria-labelledby={`group-access-title-${view.id}`}>
        <div className='group-access-header'>
          <span className='group-access-icon'><SharedGroupOutlined size='m' aria-hidden='true' /></span>
          <div className='group-access-copy'>
            <div id={`group-access-title-${view.id}`} className='group-access-title'>{this.formatMessage('portalGroupsLabel')}</div>
            <div className='group-access-help'>{this.formatMessage('portalGroupsHelp')}</div>
          </div>
          <span className='group-selected-count'>{this.formatMessage('groupSelectedCount', { count: groupCount })}</span>
        </div>

        {groupCount === 0
          ? <div className='group-empty-state'>
              <SharedGroupOutlined className='group-empty-icon' size='m' aria-hidden='true' />
              <div>
                <div className='group-empty-title'>{this.formatMessage('noGroupsEmptyTitle')}</div>
                <div className='group-empty-description'>{this.formatMessage('noGroupsEmptyDescription')}</div>
              </div>
            </div>
          : <React.Fragment>
              <div className='group-selected-label'>{this.formatMessage('selectedGroupsLabel')}</div>
              {this.renderGroupChips(view)}
            </React.Fragment>
        }
        {this.renderGroupPicker(view)}
      </section>
    )
  }

  renderLayerFieldBlock = (view: ViewConfig, layer: LayersConfig) => {
    const fields = this.getLayerFieldSource(layer)
    if (!fields?.length) return null
    if (layer.layerHonorMode === LayerHonorModeType.Webmap) {
      return (
        <div key={layer.id} className='view-layer-block'>
          <div className='view-layer-header'><div className='view-layer-title' title={layer.name}>{layer.name}</div></div>
          <div className='view-layer-webmap-note'>{this.formatMessage('webmapLayerNote')}</div>
        </div>
      )
    }
    const allowed: string[] = view.editableFields?.[layer.id] || []
    const rootItemJson = this.buildFieldTree(layer, allowed)
    return (
      <div key={layer.id} className='view-layer-block'>
        <div className='view-layer-header'>
          <div className='view-layer-title' title={layer.name}>{layer.name}</div>
          <span className='view-layer-count'>{this.formatMessage('fieldsCount', { count: allowed.length })}</span>
        </div>
        <Tree
          className='view-field-tree'
          rootItemJson={rootItemJson}
          treeAlignmentType={TreeAlignmentType.Intact}
          isMultiSelection
          checkboxLinkage
          onUpdateItem={(actionData, refComponent) => {
            const itemJsons = actionData?.itemJsons || refComponent?.props?.itemJsons
            if (!itemJsons || !itemJsons.length) return
            const rootItem = itemJsons[itemJsons.length - 1]
            this.toggleFieldForView(view.id, layer.id, this.collectCheckedFields(rootItem))
          }}
          {...this.getFieldTreeActionMap()}
        />
      </div>
    )
  }

  renderEditableFieldsSection = (view: ViewConfig) => {
    const fieldCount = this.countViewFields(view)
    return (
      <section className='view-editor-section' aria-labelledby={`editable-fields-title-${view.id}`}>
        <div className='group-access-header'>
          <div className='group-access-copy'>
            <div id={`editable-fields-title-${view.id}`} className='view-editor-section-title mb-0'>
              {this.formatMessage('editableFieldsLabel')}
            </div>
          </div>
          <span className='group-selected-count'>{this.formatMessage('fieldsCount', { count: fieldCount })}</span>
        </div>
        {fieldCount === 0 &&
          <Alert withIcon open type='warning' className='w-100 mt-2' text={this.formatMessage('noFieldsWarning')} />
        }
        {this.getMutableLayers().map(layer => this.renderLayerFieldBlock(view, layer))}
      </section>
    )
  }

  renderViewEditor = (view: ViewConfig) => {
    return (
      <div className='h-100' css={this.getStyle()}>
        <div className='view-editor-scroll'>
          <div className='view-card'>
            <div className='view-card-body'>
              {this.renderViewDetails(view)}
              {this.renderAccessSection(view)}
              <ViewMemberPicker
                key={view.id}
                view={view}
                intl={this.props.intl}
                onChange={(memberAccess, allowedUsers) => {
                  this.updateViews(this.getMutableViews().map(item => item.id === view.id
                    ? { ...item, memberAccess, allowedUsers }
                    : item))
                }}
              />
              {this.renderEditableFieldsSection(view)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { viewsEnabled } = this.props
    const mutableViews = this.getMutableViews()
    const activeView = mutableViews.find(view => view.id === this.state.activeViewId)
    const deleteView = mutableViews.find(v => v.id === this.state.deleteViewId)
    const layersNoFields = this.getLayersWithNoEditableFields()

    return (
      <SettingSection
        role='group'
        aria-label={this.formatMessage('viewsSection')}
        title={this.formatMessage('viewsSection')}
      >
        <SettingRow label={this.formatMessage('enableViews')} flow='wrap'>
          <Switch
            className='can-x-switch'
            checked={!!viewsEnabled}
            onChange={evt => {
              this.props.onViewsEnabledChange(evt.target.checked)
              if (!evt.target.checked) this.closeViewEditor()
            }}
            aria-label={this.formatMessage('enableViews')}
          />
        </SettingRow>

        {viewsEnabled &&
          <SettingRow flow='wrap'>
            <div ref={this.viewListTrigger} className='view-manager-body' css={this.getStyle()}>
              <div className='view-manager-desc'>
                {this.formatMessage('viewsDescription')}
              </div>

              {mutableViews.length > 0 && layersNoFields.length > 0 &&
                <Alert
                  withIcon
                  open
                  type='warning'
                  className='w-100 mb-2'
                  text={this.formatMessage('layersNoEditable', { layers: layersNoFields.join(', ') })}
                />
              }

              {mutableViews.length > 0
                ? <div className='view-manager-list'>
                    {mutableViews.map(view => this.renderViewListItem(view))}
                  </div>
                : <div className='view-list-empty'>
                    <SharedGroupOutlined className='view-list-empty-icon' size='l' aria-hidden='true' />
                    <div className='view-list-empty-title'>{this.formatMessage('viewsEmptyTitle')}</div>
                    <div className='view-list-empty-description'>{this.formatMessage('viewsEmptyDescription')}</div>
                  </div>
              }

              <Button
                size='sm'
                type='primary'
                onClick={evt => { this.addView(evt.currentTarget) }}
                className='w-100 mt-2 d-flex align-items-center justify-content-center'
              >
                <PlusOutlined className='mr-1' />
                {this.formatMessage('addView')}
              </Button>
            </div>
          </SettingRow>
        }

        <SidePopper
          isOpen={!!viewsEnabled && !!activeView}
          position='right'
          toggle={this.closeViewEditor}
          trigger={this.viewListTrigger?.current}
          backToFocusNode={this.state.viewEditorFocusNode}
          title={activeView?.name}
          aria-label={activeView ? this.formatMessage('editViewTitle', { name: activeView.name }) : this.formatMessage('viewsSection')}
        >
          {activeView && this.renderViewEditor(activeView)}
        </SidePopper>

        {deleteView &&
          <ConfirmDialog
            level='warning'
            title={this.formatMessage('deleteViewConfirmTitle')}
            hasNotShowAgainOption={false}
            content={this.formatMessage('deleteViewConfirmTips')}
            onConfirm={this.confirmDeleteView}
            onClose={this.cancelDeleteView}
          />
        }
      </SettingSection>
    )
  }
}
