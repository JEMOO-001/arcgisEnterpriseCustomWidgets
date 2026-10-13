/** @jsx jsx */
import {
  React,
  jsx,
  type AllWidgetProps,
  classNames,
  type QueriableDataSource,
  DataSourceStatus,
  type IMState,
  dataSourceUtils,
  DataSourceManager,
  type DataRecord,
  type AppMode,
  type DataSource,
  defaultMessages as jimuCoreMessages,
  appActions,
  privilegeUtils,
  esri,
  lodash,
  SessionManager,
  ServiceManager,
  getAppStore,
  type QueryParams,
  type IMRuntimeInfos,
  WidgetState,
  AllDataSourceTypes,
  type ImageryLayerDataSource
} from 'jimu-core'
import {
  EditModeType,
  type IMConfig,
  LayerHonorModeType,
  SparkChangedType,
  SnapSettingMode,
  type ViewConfig
} from '../config'
import {
  type FeatureDataRecord,
  type FeatureLayerDataSource,
  JimuMapViewComponent,
  type JimuMapView,
  ADD_TO_MAP_DATA_ID_PREFIX
} from 'jimu-arcgis'
import defaultMessages from './translations/default'
import {
  defaultMessages as jimuUIDefaultMessages,
  Button,
  Select,
  WidgetPlaceholder,
  TextInput,
  Loading
} from 'jimu-ui'
import { getStyle } from './style'
import EditItemDataSource from './edit-item-ds'
import { PlusOutlined } from 'jimu-icons/outlined/editor/plus'
import { InfoOutlined } from 'jimu-icons/outlined/suggested/info'
import FeatureForm from 'esri/widgets/FeatureForm'
import Editor from 'esri/widgets/Editor'
import FeatureLayer from 'esri/layers/FeatureLayer'
import OrientedImageryLayer from 'esri/layers/OrientedImageryLayer'
import FormTemplate from 'esri/form/FormTemplate'
import FieldElement from 'esri/form/elements/FieldElement'
import GroupElement from 'esri/form/elements/GroupElement'
import type RelationshipElement from 'esri/form/elements/RelationshipElement'
import Graphic from 'esri/Graphic'
import Query from 'esri/rest/support/Query'
import { versionManager } from '../version-manager'
import { WarningOutlined } from 'jimu-icons/outlined/suggested/warning'
import * as reactiveUtils from 'esri/core/reactiveUtils'
import { SearchOutlined } from 'jimu-icons/outlined/editor/search'
import {
  getActivePermissionViews,
  hasEffectiveEditAccess,
  isViewsRestricted,
  loadCurrentUserGroupIds
} from '../common/permission'

import editPlaceholderIcon from './assets/icons/placeholder-edit-geometry-empty.svg'
const CSS = {
  base: 'esri-item-list',
  widget: 'esri-widget',
  header: 'esri-editor__header',
  formHeader: 'esri-feature-form__form-header',
  description: 'esri-feature-form__description-text',
  controls: 'esri-editor__controls',
  buttonDisabled: 'esri-button--disabled',
  heading: 'esri-widget__heading',
  featureForm: 'esri-feature-form',
  filterContainer: 'esri-item-list__filter-container',
  filterPlaceholder: 'esri-item-list__filter-placeholder',
  filterPlaceholderText: 'esri-item-list__filter-placeholder-text',
  scroller: 'esri-editor__scroller',
  content: 'esri-editor__content',
  list: 'esri-item-list__list',
  group: 'esri-item-list__group',
  noMatchesMessage: 'esri-item-list__no-matches-message',
  itemLabel: 'esri-item-list__list-item-label',
  itemContainer: 'esri-item-list__list-item-container',
  item: 'esri-item-list__list-item',
  groupHeader: 'esri-item-list__group-header',
  interactive: 'esri-interactive',
  backButton: 'esri-editor__back-button',
  title: 'esri-editor__title',
  leftArrowIcon: 'esri-icon-left',

  widgetHeading: 'esri-widget__heading',
  warningOption: 'esri-editor__warning-option',
  warningOptionPrimary: 'esri-editor__warning-option--primary',
  warningOptionPositive: 'esri-editor__warning-option--positive',

  progressBar: 'esri-editor__progress-bar',
  promptDanger: 'esri-editor__prompt--danger',
  promptHeader: 'esri-editor__prompt__header',
  promptHeaderHeading: 'esri-editor__prompt__header__heading',
  promptMessage: 'esri-editor__prompt__message',
  promptDivider: 'esri-editor__prompt__divider',
  promptActions: 'esri-editor__prompt__actions',
  loader: 'esri-feature-table__loader',
  loaderContainer: 'esri-feature-table__loader-container'
}
const messages = Object.assign({}, defaultMessages, jimuUIDefaultMessages, jimuCoreMessages)

export interface Props {
  appMode: AppMode
  widgetsRuntimeInfo: IMRuntimeInfos
  userIdentityKey: string
}

export interface GroupFeature {
  id: string
  label: string
  items: __esri.Graphic[]
}

export interface ControlButton {
  label: string
  type: 'default' | 'primary' | 'secondary' | 'tertiary'
  clickHandler: () => void
  disabled?: boolean
}

export enum ModifyType {
  new = 'NEW',
  update = 'UPDATE'
}

export interface State {
  jimuMapView: JimuMapView
  dataSources: { [dsId: string]: DataSource }
  outputDataSourceIsNotReady: { [dsId: string]: boolean }
  editFeatures: { [dsId: string]: DataRecord[] }
  activeId: string
  featureFormStep: 'empty' | 'list' | 'form' | 'new'
  filterText: string
  formPrivileges: 'full' | 'none' | 'normal'
  formEditable?: boolean
  delConfirm: boolean
  attrUpdating: boolean
  formChange: boolean
  formSubmittable: boolean
  loading: boolean
  selectionStartWorkflow: boolean
  currentUserGroupIds: string[]
  currentUserGroupIdsReady: boolean
  currentUserGroupIdentityKey: string
}

export default class Widget extends React.PureComponent<
AllWidgetProps<IMConfig> & Props,
State
> {
  edit: __esri.FeatureForm | __esri.Editor
  refs: {
    editContainer: HTMLDivElement
    formHeaderContainer: HTMLDivElement
  }

  dsManager: DataSourceManager
  removeLayerOnce: boolean
  selectedIds: { [dsId: string]: string[] }
  currentRequestId: number
  timerFn: any
  editorSelectFeature: boolean
  editorNotBackButton: boolean
  relationships: { [layerId: string]: any }
  changeBeforeRender: any
  loadChangeAfterRenderTimer: any
  loadingGroups: boolean
  groupLoadVersion: number
  isUnmounted: boolean

  static mapExtraStateProps = (
    state: IMState,
    props: AllWidgetProps<IMConfig>
  ): Props => {
    return {
      appMode: state?.appRuntimeInfo?.appMode,
      widgetsRuntimeInfo: state?.widgetsRuntimeInfo,
      userIdentityKey: `${state?.portalUrl || ''}|${state?.user?.username || ''}`
    }
  }

  constructor (props) {
    super(props)

    this.state = {
      jimuMapView: undefined,
      dataSources: {},
      outputDataSourceIsNotReady: {},
      editFeatures: {},
      activeId: undefined,
      featureFormStep: 'empty',
      filterText: '',
      formPrivileges: 'normal',
      formEditable: false,
      delConfirm: false,
      attrUpdating: false,
      formChange: false,
      formSubmittable: true,
      loading: false,
      selectionStartWorkflow: false,
      currentUserGroupIds: [],
      currentUserGroupIdsReady: false,
      currentUserGroupIdentityKey: ''
    }
    this.dsManager = DataSourceManager.getInstance()
    this.removeLayerOnce = false
    this.selectedIds = {}
    this.currentRequestId = 0
    this.timerFn = null
    this.editorSelectFeature = false
    this.editorNotBackButton = false
    this.relationships = {}
    this.changeBeforeRender = undefined
    this.loadChangeAfterRenderTimer = undefined
    this.loadingGroups = false
    this.groupLoadVersion = 0
    this.isUnmounted = false
  }

  static versionManager = versionManager

  async componentDidUpdate (prevProps: AllWidgetProps<IMConfig> & Props, prevState: State) {
    const { id, config, widgetsRuntimeInfo } = this.props
    const { editFeatures, dataSources, activeId, jimuMapView, featureFormStep } = this.state
    const {
      editMode, layersConfig, selfSnapping, featureSnapping, defaultSelfEnabled, defaultFeatureEnabled, defaultSnapLayers,
      snapSettingMode, tooltip, templateFilter, relatedRecords, liveDataEditing
    } = config
    const { editFeatures: preEditFeatures } = prevState
    const { config: preConfig, widgetsRuntimeInfo: preWidgetsRuntimeInfo } = prevProps
    const {
      editMode: preEditMode, layersConfig: preLayersConfig, selfSnapping: preSelf, featureSnapping: preFeature, defaultSelfEnabled: preDefaultSelfEnabled, defaultFeatureEnabled: preDefaultFeatureEnabled,
      defaultSnapLayers: preDefaultSnapLayers, snapSettingMode: preSnapSettingMode, tooltip: preTooltip, templateFilter: preTemplateFilter,
      relatedRecords: preRelatedRecords, liveDataEditing: preLiveDataEditing
    } = preConfig
    // widget controller open/close
    const isGeoMode = editMode === EditModeType.Geometry
    // Edit is in controller
    const currentWidgetState = widgetsRuntimeInfo[id].state
    const prevWidgetState = preWidgetsRuntimeInfo[id].state
    const inConfigEditFeatures = this.getInLayersConfigFeatures(editFeatures, layersConfig)
    const flatEditFeatures = this.flatMapArray(inConfigEditFeatures)
    const editCount = flatEditFeatures.length
    if (isGeoMode) {
      if (prevWidgetState === WidgetState.Opened && currentWidgetState === WidgetState.Closed) {
        const edit = this.edit as __esri.Editor
        if (edit?.activeWorkflow) edit?.cancelWorkflow()
      } else if (prevWidgetState === WidgetState.Closed && currentWidgetState === WidgetState.Opened && editCount !== 0) {
        this.setState({ selectionStartWorkflow: true }, () => {
          this.startWorkFlowWhenAwait()
        })
      }
    }
    // The 'editFeatures' not equal to 0, 'preEditFeatures' are different from 'editFeatures',indicates that some selections change to other selections.
    // In this case, even if the state becomes 'ready', there is no need to deselect dataSource
    const preInConfigEditFeatures = this.getInLayersConfigFeatures(preEditFeatures, preLayersConfig)
    const flatPreEditFeatures = this.flatMapArray(preInConfigEditFeatures)
    const newEditCount = flatEditFeatures.length
    const preEditCount = flatPreEditFeatures.length
    if (newEditCount !== 0 && preEditCount !== 0 && !this.getWhetherArrayIsShallowEqual(flatEditFeatures, flatPreEditFeatures)) {
      this.editorNotBackButton = true
    } else {
      this.editorNotBackButton = false
    }
    const settingChange = !lodash.isDeepEqual(preLayersConfig, layersConfig)
    const liveDataEnableChange = liveDataEditing !== preLiveDataEditing
    const relatedRecordsChange = relatedRecords !== preRelatedRecords
    const generalSettingChange = liveDataEnableChange || relatedRecordsChange
    if (layersConfig.length === 0) this.destroyEdit()
    const editModeChange = preEditMode !== editMode
    if (editModeChange) this.destroyEdit()
    // liveData and relatedRecords need to new editor
    if (settingChange || generalSettingChange) {
      if (isGeoMode) {
        this.newOrUpdateEditor(ModifyType.new, undefined, relatedRecordsChange)
      } else {
        const edit = this.edit as __esri.FeatureForm
        const selectedDs = Object.keys(editFeatures)
        const hasSelected = layersConfig.some(config => selectedDs.includes(config.id))
        const inConfigEditFeatures = this.getInLayersConfigFeatures(editFeatures, layersConfig)
        const flatEditFeatures = this.flatMapArray(inConfigEditFeatures)
        const editCount = flatEditFeatures.length
        if (edit?.formTemplate && layersConfig.length !== 0) {
          const activeConfig = layersConfig.asMutable({ deep: true }).find(item => item.id === activeId)
          // layerHonorMode change
          if (activeConfig?.layerHonorMode === LayerHonorModeType.Webmap) {
            const dataSource = dataSources[activeId]
            edit.formTemplate = (dataSource as any)?.layer?.formTemplate
          } else if (edit?.formTemplate) {
            const formElements = this.constructFormElements()
            const formTemplate = new FormTemplate({
              elements: formElements
            })
            edit.formTemplate = formTemplate
          }
          const elements = edit?.formTemplate?.elements
          if (elements?.length === 0) {
            document.getElementById(`edit-container-${id}`)?.classList.add('esri-hidden')
          } else if (editCount !== 0 && featureFormStep === 'form') {
            document.getElementById(`edit-container-${id}`)?.classList.remove('esri-hidden')
          }
        } else if (layersConfig.length !== 0 && hasSelected) {
          // some featur has been selected before mode change
          if (editCount === 1) {
            const dataSource = dataSources?.[selectedDs[0]]
            const graphic = dataSource.getSelectedRecords()?.[0] as any
            if (!graphic) return
            this.renderFeatureForm(dataSource as QueriableDataSource, graphic)
          } else if (editCount > 1 || editCount === 0) {
            document.getElementById(`edit-container-${id}`)?.classList.add('esri-hidden')
          }
        }
      }
    }
    // views: make sure the user's portal group membership is loaded once views become active
    // (covers both first mount and views being switched on later via config)
    const viewsBecameRestricted = this.isViewsRestricted() && !isViewsRestricted(preConfig)
    const permissionIdentityChanged = this.isViewsRestricted() &&
      this.props.userIdentityKey !== prevProps.userIdentityKey
    if (viewsBecameRestricted || permissionIdentityChanged) {
      this.groupLoadVersion++
      if (this.state.currentUserGroupIdsReady || this.state.currentUserGroupIds.length > 0) {
        this.setState({
          currentUserGroupIds: [],
          currentUserGroupIdsReady: false,
          currentUserGroupIdentityKey: ''
        })
      } else {
        this.loadCurrentUserGroups()
      }
    } else if (this.isViewsRestricted() && !this.state.currentUserGroupIdsReady) {
      this.loadCurrentUserGroups()
    }
    // group membership resolved after the form was first rendered: rebuild the current form
    // template so view-based field permissions are applied (avoids a flash of editable fields)
    if (!prevState.currentUserGroupIdsReady && this.state.currentUserGroupIdsReady && this.isViewsRestricted()) {
      const edit = this.edit as __esri.FeatureForm
      if (!isGeoMode && edit && !edit.destroyed && edit.formTemplate) {
        const activeConfigItem = layersConfig.asMutable({ deep: true }).find(item => item.id === activeId)
        // layers honoring the webmap form config are intentionally not restricted by views
        if (activeConfigItem?.layerHonorMode !== LayerHonorModeType.Webmap) {
          edit.formTemplate = new FormTemplate({ elements: this.constructFormElements() })
        }
      }
    }
    // snap config change
    const flexibleMode = snapSettingMode === SnapSettingMode.Flexible
    const snapOn = selfSnapping || featureSnapping
    const snappingControlsOpen = flexibleMode && snapOn
    const settingsOpen = snappingControlsOpen || tooltip
    const snapChange = (selfSnapping !== preSelf) || (featureSnapping !== preFeature) || (defaultSelfEnabled !== preDefaultSelfEnabled) ||
      (defaultFeatureEnabled !== preDefaultFeatureEnabled) || (defaultSnapLayers !== preDefaultSnapLayers) || (snapSettingMode !== preSnapSettingMode)
    if (snapChange) {
      const defaultSnapSources = await this.getDefaultSnapSources(jimuMapView, defaultSnapLayers)
      if (this.edit && isGeoMode) {
        const editor = (this.edit as Editor)
        const orgVisibleElements = editor.visibleElements
        const newVisibleElements = {
          ...orgVisibleElements,
          settingsMenu: settingsOpen,
          tooltipsToggle: tooltip,
          snappingControls: snappingControlsOpen,
          snappingControlsElements: {
            enabledToggle: true,
            selfEnabledToggle: selfSnapping,
            featureEnabledToggle: featureSnapping
          }
        }
        const orgSnappingOptions = editor.snappingOptions
        const newSnappingOptions: any = {
          ...orgSnappingOptions,
          enabled: defaultSelfEnabled || defaultFeatureEnabled,
          selfEnabled: defaultSelfEnabled,
          featureEnabled: defaultFeatureEnabled,
          featureSources: defaultSnapSources
        }
        editor.visibleElements = newVisibleElements
        editor.snappingOptions = newSnappingOptions
      }
    }
    // tooltip config change
    if (tooltip !== preTooltip) {
      if (this.edit && isGeoMode) {
        const editor = (this.edit as Editor)
        editor.visibleElements.tooltipsToggle = tooltip
        editor.visibleElements.settingsMenu = settingsOpen
      }
    }
    // template filter config change
    if (templateFilter !== preTemplateFilter) {
      if (this.edit && isGeoMode) {
        const editor = (this.edit as Editor)
        editor.supportingWidgetDefaults = {
          featureTemplates: {
            visibleElements: {
              filter: templateFilter
            }
          }
        }
      }
    }
    const removeLayerFlag = this.props?.stateProps?.removeLayerFlag || false
    if (removeLayerFlag && !this.removeLayerOnce) {
      this.props.dispatch(
        appActions.widgetStatePropChange(id, 'removeLayerFlag', false)
      )
      const newEditFeatures = Object.assign({}, editFeatures)
      const idArray = Object.keys(newEditFeatures)
      idArray.forEach(id => {
        if (!layersConfig.find(config => config.id === id)) {
          delete newEditFeatures[id]
        }
      })
      const inConfigEditFeatures = this.getInLayersConfigFeatures(newEditFeatures, layersConfig)
      const flatEditFeatures = this.flatMapArray(inConfigEditFeatures)
      const editCount = flatEditFeatures.length
      const step = editCount > 1 ? 'list' : editCount === 1 ? 'form' : 'empty'
      if (step === 'form') {
        this.removeLayerOnce = true
        const dsId = flatEditFeatures[0]?.dataSource?.belongToDataSource?.id
        document.getElementById(`edit-container-${id}`)?.classList.remove('esri-hidden')
        this.renderFeatureForm(dataSources[dsId] as QueriableDataSource, flatEditFeatures[0])
      } else if (step === 'list') {
        document.getElementById(`edit-container-${id}`)?.classList.add('esri-hidden')
      }
      this.setState({ editFeatures: newEditFeatures, featureFormStep: step })
    }
  }

  componentDidMount () {
    this.isUnmounted = false
    this.loadCurrentUserGroups()
  }

  // views only restrict attribute editing, and only when enabled with at least one view configured.
  // In geometry mode views are intentionally ignored: the setting UI is hidden there, so silently
  // applying stale restrictions would be surprising and there is no UI to fix them.
  isViewsRestricted = () => {
    return isViewsRestricted(this.props.config)
  }

  // fetch the signed-in user's portal group ids once, used to resolve which "views" apply.
  // Fix: the previous version called `esri/portal/Portal.getDefault().load()` directly, which
  // can trigger ArcGIS's interactive sign-in flow. Inside the Experience Builder preview/embed
  // iframe that popup is usually blocked, so the promise never resolves or rejects — it just
  // hangs — and since nothing ever set `currentUserGroupIdsReady`, the widget stayed on the
  // "views resolving" Loading spinner forever. Two fixes:
  //  1) Read the already-signed-in user from the app's own Redux store first
  //     (`getAppStore().state.user`) — this is the same session the rest of the app/widget
  //     already uses, it's synchronous, and it never opens a new sign-in prompt.
  //  2) Whatever path is used, always resolve within a bounded time (5s) via Promise.race,
  //     so a slow/hanging network call can never leave the widget stuck on Loading again.
  loadCurrentUserGroups = async () => {
    if (!this.isViewsRestricted()) {
      this.setState({
        currentUserGroupIdsReady: true,
        currentUserGroupIdentityKey: this.props.userIdentityKey || ''
      })
      return
    }
    if (this.loadingGroups) return
    this.loadingGroups = true
    const loadVersion = this.groupLoadVersion
    try {
      const groupIds = await loadCurrentUserGroupIds()
      if (!this.isUnmounted && loadVersion === this.groupLoadVersion) {
        this.setState({
          currentUserGroupIds: groupIds,
          currentUserGroupIdsReady: true,
          currentUserGroupIdentityKey: this.props.userIdentityKey || ''
        })
      }
    } catch (err) {
      console.error(err)
      if (!this.isUnmounted && loadVersion === this.groupLoadVersion) {
        this.setState({
          currentUserGroupIds: [],
          currentUserGroupIdsReady: true,
          currentUserGroupIdentityKey: this.props.userIdentityKey || ''
        })
      }
    } finally {
      this.loadingGroups = false
      if (!this.isUnmounted && loadVersion !== this.groupLoadVersion &&
        this.isViewsRestricted() && !this.state.currentUserGroupIdsReady) {
        this.loadCurrentUserGroups()
      }
    }
  }

  // Multi-view membership: a user may belong to groups assigned to several views.
  // We grant the UNION of editable fields across every view the user matches, so adding
  // a view can only grant extra field edit rights and never remove rights granted by
  // another view ("first match wins" was rejected: view order would become a hidden,
  // order-dependent permission rule). A user matching no view gets no edit rights at all.
  isGroupIdentityCurrent = (): boolean => {
    return !this.props.userIdentityKey ||
      this.state.currentUserGroupIdentityKey === this.props.userIdentityKey
  }

  getActiveViews = (): ViewConfig[] => {
    if (!this.isGroupIdentityCurrent()) return []
    return getActivePermissionViews(
      this.props.config,
      this.state.currentUserGroupIds,
      getAppStore()?.getState()?.user
    )
  }

  // filter groupedFields per the active views' allowed fields for this layer
  // fields outside active views are hidden completely from the form
  // no matching view (views enabled but user in no view group) => 0 fields (all hidden)
  applyViewToGroupedFields = (groupedFields: any[], layerId: string) => {
    if (!this.isViewsRestricted() || !groupedFields) return groupedFields
    const allowedFieldNames = new Set<string>()
    this.getActiveViews().forEach(view => {
      (view.editableFields?.[layerId] || []).forEach(name => { allowedFieldNames.add(name) })
    })
    const filterItem = (item) => {
      if (item.children) {
        const filteredChildren = item.children.filter(child => allowedFieldNames.has(child.jimuName || child.name))
        if (filteredChildren.length === 0) return null
        return {
          ...item,
          children: filteredChildren.map(child => ({ ...child, editAuthority: true }))
        }
      }
      if (allowedFieldNames.has(item.jimuName || item.name)) {
        return { ...item, editAuthority: true }
      }
      return null
    }
    return groupedFields.map(filterItem).filter(item => item !== null)
  }

  // true while the user's group membership is still resolving, so the widget shows a
  // loading state instead of a form that might flash "editable" fields for a moment
  isViewsLoading = () => {
    return this.isViewsRestricted() &&
      (!this.state.currentUserGroupIdsReady || !this.isGroupIdentityCurrent())
  }

  // checks whether the current user has editing rights based on their Portal role/privilege
  // and assigned views. If not, the widget completely hides itself in runtime mode.
  hasUserEditAccess = (): boolean => {
    const state = getAppStore()?.getState() as any
    return hasEffectiveEditAccess(
      this.props.config,
      state?.user,
      this.state.currentUserGroupIds,
      this.state.currentUserGroupIdsReady && this.isGroupIdentityCurrent(),
      {
        isBuilder: !!(window as any)?.jimuConfig?.isBuilder,
        // Preserve the existing widget behavior while membership resolves: the form
        // renders its loading state, whereas the controller uses fail-closed behavior.
        allowWhileGroupsLoad: true
      }
    )
  }

  componentWillUnmount () {
    this.isUnmounted = true
    const { config } = this.props
    const { editMode } = config
    const isGeoMode = editMode === EditModeType.Geometry
    if (this.edit && !this.edit.destroyed && isGeoMode) {
      const edit = this.edit as __esri.Editor
      edit?.cancelWorkflow && edit.cancelWorkflow()
    }
  }

  getWhetherArrayIsShallowEqual = (arr1: any[], arr2: any[]): boolean => {
    let isEqual = false
    if (arr1 && arr2 && arr1.length === arr2.length) {
      isEqual = !arr1.some((v, i) => v !== arr2[i])
    }
    return isEqual
  }

  handleActiveViewChange = async (jimuMapView: JimuMapView) => {
    this.setState({ jimuMapView }, () => {
      const view = jimuMapView?.view
      view?.when(() => {
        view?.on('layerview-create', event => {
          const newLayer = event.layer
          if (newLayer?.listMode === 'hide') {
            const editor = this.edit as Editor
            this.newOrUpdateEditor(editor?.layerInfos ? ModifyType.update : ModifyType.new, jimuMapView)
          }
        })
        view?.map.layers.on('after-add', event => {
          const addItem = event.item
          if (addItem?.id.includes(ADD_TO_MAP_DATA_ID_PREFIX)) {
            this.newOrUpdateEditor(ModifyType.new)
          }
        })
      })
      if (!jimuMapView) {
        this.destroyEdit()
      } else {
        this.newOrUpdateEditor(ModifyType.new, jimuMapView)
      }
    })
  }

  formatMessage = (id: string, values?: { [key: string]: any }) => {
    return this.props.intl.formatMessage(
      { id: id, defaultMessage: messages[id] },
      values
    )
  }

  destroyEdit = () => {
    this.edit && !this.edit.destroyed && this.edit.destroy()
  }

  flatMapArray = (editFeatures) => {
    // flat editFeatures
    const flatEditFeatures = []
    for (const dsId in editFeatures) {
      if (editFeatures?.[dsId]) {
        flatEditFeatures.push(...editFeatures[dsId])
      }
    }
    return flatEditFeatures
  }

  flatMapArrayWithView = (editFeatures, jimuMapView: JimuMapView) => {
    const flatEditFeatures = []
    const mapDsId = jimuMapView?.dataSourceId
    for (const dsId in editFeatures) {
      if (dsId.indexOf(mapDsId) === 0 && editFeatures?.[dsId]) {
        flatEditFeatures.push(...editFeatures[dsId])
      }
    }
    return flatEditFeatures
  }

  createEditForm = async (dataSourceId: string, dsChange: boolean, newRequestId?: number) => {
    const { dataSources, editFeatures } = this.state
    const { id, config } = this.props
    const { layersConfig } = config
    const dataSource = dataSources[dataSourceId] as QueriableDataSource
    // update editFeatures for some change cause by url
    const newEditFeatures = editFeatures
    if (dataSource) {
      newEditFeatures[dataSourceId] = dataSource.getSelectedRecords()
    }
    const inConfigEditFeatures = this.getInLayersConfigFeatures(newEditFeatures, layersConfig)
    const flatEditFeatures = this.flatMapArray(inConfigEditFeatures)
    const editCount = flatEditFeatures.length
    const step = editCount > 1 ? 'list' : editCount === 1 ? 'form' : 'empty'
    this.setState({ featureFormStep: step })
    // create FeatureForm or change edit feature
    if (editCount === 1) {
      const graphic = dataSource.getSelectedRecords()?.[0] as any
      const objectIdField = dataSource.getIdField() || 'OBJECTID'
      const recordQuery = graphic
        ? `${objectIdField} IN (${graphic.getId()})`
        : ''
      const fullGraphic = await dataSource.query({
        where: recordQuery,
        returnGeometry: true,
        notAddFieldsToClient: true,
        outFields: ['*']
      } as QueryParams).then(result => {
        return result?.records?.[0]
      })
      // Deselect one by one until the last one, if not the current DS, needs special treatment
      if (!fullGraphic) return
      if (dsChange || !this.edit || this.edit?.destroyed) {
        this.renderFeatureForm(dataSource, fullGraphic, newRequestId)
      } else {
        document.getElementById(`edit-container-${id}`)?.classList.remove('esri-hidden')
        this.createOrUpdateheader(dataSource, (fullGraphic as FeatureDataRecord)?.feature)
        const edit = this.edit as __esri.FeatureForm
        if (!edit) return
        const graphicFeature = await dataSourceUtils.changeToJSAPIGraphic((fullGraphic as FeatureDataRecord)?.feature)
        edit.feature = graphicFeature
      }
    } else if (editCount > 1 || editCount === 0) { // list or no data
      document.getElementById(`edit-container-${id}`)?.classList.add('esri-hidden')
    }
  }

  getDsAccessibleInfo = (url: string) => {
    if (!url) return Promise.resolve(false)
    const request = esri.restRequest.request
    return request(`${url}?f=json`).then(info => {
      if (Object.keys(info).includes('error')) {
        return false
      } else {
        return true
      }
    }).catch((err) => {
      return false
    })
  }

  getPrivilege = () => {
    return privilegeUtils.checkExbAccess(privilegeUtils.CheckTarget.Experience).then(exbAccess => {
      return exbAccess?.capabilities?.canEditFeature
    })
  }

  getIsAdvancedPermission = async (editorLayer, dataSource?): Promise<boolean> => {
    const { dataSources } = this.state
    const currentLayerDs = dataSource || dataSources[Object.keys(dataSources).find(dsId => dsId.includes(editorLayer.id))]
    if (!currentLayerDs) return false
    const layerItemInfo = await currentLayerDs?.fetchItemInfo().then(info => {
      return info
    }).catch(err => {
      console.error(err)
    })
    if (!layerItemInfo) return false
    // user is admin/owner, or user and item are in the same update org
    // If there is no portalUrl, it means it's non-hosted (sampleserver6)
    const portalUrl = ServiceManager.getInstance().getServerInfoByServiceUrl(layerItemInfo.url)?.owningSystemUrl
    if (!portalUrl) return false
    const sessionForItem = SessionManager.getInstance().getSessionByUrl(portalUrl)
    // If there is no session, it means there was no pop-up login
    if (!sessionForItem) return false
    const user = await sessionForItem.getUser()
    const isAdmin = user?.role === 'org_admin' && layerItemInfo?.isOrgItem
    const isOwner = layerItemInfo.owner === user?.username
    const isInUpdatedGroup = await privilegeUtils.isItemInTheUpdatedGroup(layerItemInfo.id, sessionForItem)
    return isAdmin || isOwner || isInUpdatedGroup
  }

  sendSparkMsg = (changedType: SparkChangedType, layerName: string) => {
    const sendDiscussionAsync = (window as any)?.Capacitor?.Plugins?.Spark?.sendDiscussionAsync
    if (sendDiscussionAsync) {
      const appUrl = window.location.href
      sendDiscussionAsync({
        title: `${changedType} data to ${layerName}`,
        content: appUrl
      })
    }
  }

  getTimezone = (dataSource) => {
    return dataSourceUtils.getTimezoneAPIFromRuntime(dataSource.getTimezone())
  }

  renderFeatureForm = (dataSource: QueriableDataSource, graphic?, newRequestId?) => {
    this.setState({ loading: true })
    const { activeId } = this.state
    const { config, id } = this.props
    const { editMode, layersConfig } = config
    const activeConfig = layersConfig.asMutable({ deep: true }).find(item => item.id === activeId)
    this.destroyEdit()
    this.getFeatureLayer(dataSource).then(async (layer) => {
      const donotRender = newRequestId && (newRequestId !== this.currentRequestId)
      if (donotRender) {
        this.setState({ loading: false })
        return
      }
      this.removeLayerOnce = false
      if (!layer) {
        this.setState({ loading: false })
        return
      }
      // Build container for edit
      const container = document && document.createElement('div')
      container.id = `edit-container-${id}`
      container.className = `edit-container-${id}`
      this.refs.editContainer.appendChild(container)
      let featureLayer
      if (layer.layer) {
        featureLayer = layer.layer
      } else {
        featureLayer = layer
      }
      // fetch to confirm whether it's a public source
      const accessible = await this.getDsAccessibleInfo(featureLayer?.url)
      // use exb privilege instead of api's supportsUpdateByOthers
      const privilegeEditable = await this.getPrivilege()
      // New logic of API: The user with advanced permissions can modify the configuration regardless of the configuration
      const isAdvancedPermission = await this.getIsAdvancedPermission(featureLayer, dataSource)
      // full editing privileges
      const fullEditingPrivileges = featureLayer?.userHasFullEditingPrivileges
      const layerEditingEnabled = featureLayer?.editingEnabled ?? true
      const editable = accessible || privilegeEditable
      let formPrivileges
      if (isAdvancedPermission || (fullEditingPrivileges && layerEditingEnabled)) {
        formPrivileges = 'full'
      } else if (fullEditingPrivileges && !layerEditingEnabled) {
        formPrivileges = 'none'
      } else {
        formPrivileges = 'normal'
      }
      this.setState({
        formPrivileges,
        formEditable: editable
      })
      // check if the selected feature is editable
      if (formPrivileges === 'none' || (formPrivileges === 'normal' && !activeConfig.updateRecords && !activeConfig.deleteRecords)) {
        this.setState({ loading: false, featureFormStep: 'empty' })
        return
      }
      if (editMode === EditModeType.Attribute) {
        const elements = this.constructFormElements(dataSource.id)
        const formTemplate = new FormTemplate({
          elements: elements
        })
        const graphicFeature = graphic?.feature ? await dataSourceUtils.changeToJSAPIGraphic(graphic?.feature) : undefined
        const useFeature = graphicFeature || new Graphic({
          layer: featureLayer
        })
        const useFormTemplate = activeConfig.layerHonorMode === LayerHonorModeType.Webmap
          ? (dataSource as any)?.layer?.formTemplate
          : formTemplate
        this.edit = new FeatureForm({
          container: container,
          feature: useFeature,
          layer: featureLayer,
          formTemplate: useFormTemplate,
          timeZone: this.getTimezone(dataSource)
        })
        // Render form header
        this.createOrUpdateheader(dataSource, useFeature)
        if (graphic) this.setState({ featureFormStep: 'form' })

        const editForm = this.edit
        editForm.on('submit', () => {
          const newFeature = editForm?.feature || useFeature
          if (newFeature) {
            if (newFeature?.geometry) {
              newFeature.geometry = null
            }
            // Grab updated attributes from the form.
            const updated = editForm.getValues()
            Object.keys(updated).forEach((name) => {
              newFeature.attributes[name] = updated[name]
            })
            // Setup the applyEdits parameter with updates.
            const edits = {
              updateFeatures: [newFeature]
            }
            this.applyAttributeUpdates(edits)
          }
        })

        editForm.on('value-change', (changedValue) => {
          const idField = dataSource.getIdField()
          const { feature, fieldName, value } = changedValue
          // Exclude cases where the 'value-change' is caused by dataSource select.
          // If the changed field has an idField, the change is caused by dataSource select change.
          if (fieldName === idField) return
          const formSubmittable = (this.edit.viewModel as __esri.FeatureFormViewModel)?.submittable
          this.setState({ formSubmittable })
          if (value !== feature?.attributes?.[fieldName]) {
            this.setState({ formChange: true })
          } else {
            this.setState({ formChange: false })
          }
        })

        const isTableLayer = featureLayer.isTable
        featureLayer.on('edits', event => {
          const { addedFeatures, updatedFeatures, deletedFeatures } = event
          const adds = addedFeatures && addedFeatures.length > 0
          const updates = updatedFeatures && updatedFeatures.length > 0
          const deletes = deletedFeatures && deletedFeatures.length > 0
          let changedType = SparkChangedType.Added
          if (adds) {
            changedType = SparkChangedType.Added
            const addFeature = event?.edits?.addFeatures?.[0]
            if (addFeature) {
              const idField = dataSource.getIdField()
              const record = dataSource.buildRecord(addFeature)
              const recordData = record?.getData() || {}
              record.setData({ ...recordData, [idField]: addedFeatures[0]?.objectId?.toString() })
              dataSource.afterAddRecord(record)
              if (isTableLayer) dataSource.selectRecordById(record.getId(), record)
            }
          }
          if (updates) {
            changedType = SparkChangedType.Updated
            const updateFeature = event?.edits?.updateFeatures?.[0]
            if (updateFeature) {
              const record = dataSource.buildRecord(updateFeature)
              dataSource.afterUpdateRecord(record)
            }
          }
          if (deletes) {
            changedType = SparkChangedType.Deleted
            const deleteFeature = event?.edits?.deleteFeatures?.[0]
            if (deleteFeature) {
              const record = dataSource.buildRecord(deleteFeature)
              dataSource.afterDeleteRecordById(record.getId())
            }
          }
          if (adds || updates || deletes) {
            this.sendSparkMsg(changedType, featureLayer.title)
          }
        })
        this.setState({ loading: false })
      }
    }).catch(err => {
      this.setState({ loading: false })
      this.removeLayerOnce = false
      console.error(err)
    })
  }

  createOrUpdateheader = (dataSource, feature) => {
    const { id } = this.props
    const { featureFormStep } = this.state
    const displayField = this.getLayerDisplayField(dataSource)
    const title = featureFormStep === 'new' ? this.formatMessage('addFeature') : feature?.attributes?.[displayField]
    if (!document?.getElementById(`form_heading_${id}`)) {
      const formDom = document && document.createElement('div')
      formDom.className = 'd-flex'
      formDom.innerHTML = `
        <button id='back_home_${id}' class='back-button surface-1 ${classNames(CSS.backButton)}' title='${this.formatMessage('back')}'><</button>
        <header class='${classNames(CSS.header)}'>
          <h4 id='form_heading_${id}' class='text-truncate ${classNames(CSS.heading)}' title='${title}'>${title}</h4>
        </header>
      `
      this.refs.formHeaderContainer.appendChild(formDom)
      document.getElementById(`back_home_${id}`)?.addEventListener('click', this.handleBack)
    } else {
      document.getElementById(`form_heading_${id}`).innerText = title
    }
  }

  deleteChangeDataSource = (selectedAfterDel) => {
    const { activeId, editFeatures } = this.state
    const newEditFeatures = Object.assign({}, editFeatures)
    newEditFeatures[activeId] = selectedAfterDel
    this.setState({ editFeatures: newEditFeatures }, () => {
      this.createEditForm(activeId, false)
    })
  }

  applyAttributeUpdates = (params) => {
    const { dataSources, editFeatures, activeId } = this.state
    const editForm = this.edit as __esri.FeatureForm
    const dataSource = dataSources[activeId]
    const gdbVersion = (dataSource as FeatureLayerDataSource).getGDBVersion()
    const formLayer = editForm.layer as unknown as __esri.FeatureLayer
    formLayer.applyEdits(params, { gdbVersion }).then((editsResult) => {
      if (params?.deleteFeatures) {
        const selectedRecords = dataSource?.getSelectedRecords() as any
        const selectedAfterDel = selectedRecords.filter(item => item.feature.attributes !== params?.deleteFeatures[0].attributes)
        if (selectedAfterDel.length > 0) {
          this.deleteChangeDataSource(selectedAfterDel)
        } else {
          const newEditFeatures = Object.assign({}, editFeatures)
          delete newEditFeatures[activeId]
          const formHeader = this.refs.formHeaderContainer
          if (formHeader?.innerHTML) formHeader.innerHTML = ''
          this.destroyEdit()
          this.setState({ editFeatures: newEditFeatures, featureFormStep: 'empty', activeId: '' })
        }
      } else if (params?.updateFeatures) {
        this.setState({ attrUpdating: false })
      }
      this.setState({ formChange: false, formSubmittable: true })
    }).catch((error) => {
      if (params?.updateFeatures) {
        this.setState({ attrUpdating: false })
      }
      console.error(error)
    })
  }

  constructFormElements = (dsId?) => {
    let { activeId } = this.state
    if (dsId) activeId = dsId
    const { config } = this.props
    const { layersConfig } = config
    const activeConfig = layersConfig.asMutable({ deep: true }).find(item => item.id === activeId)
    if (!activeConfig) return []
    const groupedFields = this.applyViewToGroupedFields(activeConfig.groupedFields, activeConfig.id)
    const elements = groupedFields.map(item => {
      if (item?.children) {
        return new GroupElement({
          label: item.name,
          description: item.subDescription || item?.description,
          elements: item?.children.map(ele => {
            return new FieldElement({
              fieldName: ele.jimuName,
              label: ele?.alias || ele?.name,
              description: ele.subDescription || ele?.description,
              editableExpression: ele.editAuthority ? 'true' : 'false'
            })
          })
        })
      } else {
        return new FieldElement({
          fieldName: item.jimuName,
          label: item?.alias || item?.name,
          description: item.subDescription || item?.description,
          editableExpression: item.editAuthority ? 'true' : 'false'
        })
      }
    })
    return elements
  }

  onFilterChange = (evt) => {
    this.setState({ filterText: evt.target.value })
  }

  renderListItems = (editFeatures) => {
    const { filterText } = this.state
    const { config } = this.props
    const { layersConfig } = config
    const groupedSelectedFeatures = []
    for (const dsId in editFeatures) {
      const featuresArray = editFeatures[dsId]
      const dataSource = featuresArray?.[0]?.dataSource
      const beToDs = dataSource?.belongToDataSource
      const layerId = beToDs?.jimuChildId
      const layerLabel = beToDs?.layerDefinition?.name || beToDs?.layerDefinition?.description
      const displayField = this.getLayerDisplayField(dataSource)
      const objectIdField = this.getLayerObjectIdField(dataSource)
      const group = {
        id: layerId,
        label: layerLabel,
        dsId,
        items: featuresArray.filter(ele => {
          const label = ele.feature.attributes?.[displayField] || ele.feature.attributes?.[objectIdField] || ele.feature.attributes?.objectid
          const lowerCasedFilter = filterText.toLowerCase()
          return !lowerCasedFilter || label?.toString()?.toLowerCase().indexOf(lowerCasedFilter) > -1
        }).map(item => {
          const objectIdFieldValue = item.feature.attributes?.[displayField] || item.feature.attributes?.[objectIdField] || item.feature.attributes?.objectid
          return {
            id: objectIdFieldValue,
            dsId,
            label: objectIdFieldValue,
            data: item.feature
          }
        })
      }
      groupedSelectedFeatures.push(group)
    }
    let count = 0
    groupedSelectedFeatures.forEach(item => {
      count += item.items.length
    })
    // Sort the FeatureForm selection list
    groupedSelectedFeatures.sort((a, b) => {
      const aIndex = layersConfig.findIndex(config => config.layerId === a.id)
      const bIndex = layersConfig.findIndex(config => config.layerId === b.id)
      return aIndex - bIndex
    })

    if (count === 0) {
      return (
        <div className={CSS.noMatchesMessage} key='no-matches'>
          {this.formatMessage('noItemsFound')}
        </div>
      )
    }

    return (
      <div key='item-container'>
        {groupedSelectedFeatures.map(group =>
          this.renderGroup(group)
        )}
      </div>
    )
  }

  renderGroup = (group) => {
    if (group.items.length === 0) return

    return (
      <div role='group' aria-label={group.label} className={CSS.group} key={group.id}>
        <h4 className={classNames(CSS.groupHeader, CSS.heading)}>
          <span className={CSS.itemLabel}>{group.label}</span>
        </h4>
        <div className={CSS.list} role='listbox'>
          {group.items.map((item, index) =>
            this.renderItem(item, index)
          )}
        </div>
      </div>
    )
  }

  renderItem = (item, index: number) => {
    const key = `${item.dsId}__${item.label}_${index}`
    const { dataSources } = this.state

    return (
      <Button
        role='option'
        className={classNames(`w-100 border-0 ${CSS.item}`)}
        key={key}
        onClick={() => {
          clearTimeout(this.timerFn)
          this.timerFn = setTimeout(() => {
            this.renderFeatureForm(dataSources[item.dsId] as QueriableDataSource, { feature: item.data })
          }, 200)
        }}
        onDoubleClick={() => {
          clearTimeout(this.timerFn)
        }}
      >
        <div className={CSS.itemContainer}>
          <span className={CSS.itemLabel}>{item.label}</span>
        </div>
      </Button>
    )
  }

  getLayerDisplayField = (dataSource) => {
    const displayField =
      dataSource?.layer?.displayField ||
      dataSource?.layerDefinition?.displayField ||
      dataSource?.belongToDataSource?.layerDefinition?.displayField ||
      dataSource?.layer?.objectIdField ||
      dataSource?.layerDefinition?.objectIdField ||
      dataSource?.belongToDataSource?.layerDefinition?.objectIdField ||
      'OBJECTID'
    return displayField
  }

  getLayerObjectIdField = (dataSource) => {
    const objectIdField =
      dataSource?.layer?.objectIdField ||
      dataSource?.belongToDataSource?.layerDefinition?.objectIdField ||
      'OBJECTID'
    return objectIdField
  }

  renderFeatureList = (editFeatures, description: string) => {
    const { id, label, theme } = this.props
    const { filterText } = this.state
    const placeholderId = `${id}-placeholder`
    const formHeader = this.refs.formHeaderContainer
    if (formHeader?.innerHTML) formHeader.innerHTML = ''

    return (
      <div className='surface-1 border-0 h-100'>
        <div className={CSS.featureForm}>
          <div className={CSS.formHeader}>
            <h2 className={CSS.heading}>{label}</h2>
            <p className={classNames(`text-truncate ${CSS.description}`)} key='description' title={description}>
              {description}
            </p>
          </div>
        </div>
        <div className={classNames(`feature-list ${CSS.content} ${CSS.scroller}`)}>
          <div className={classNames(CSS.base, CSS.widget)}>
            <div className='d-flex align-items-center m-2'>
              <TextInput
                aria-labelledby={placeholderId}
                className='w-100'
                placeholder={this.formatMessage('search')}
                onChange={this.onFilterChange}
                value={filterText}
                prefix={<SearchOutlined color={theme.ref.palette.neutral[700]} />}
                allowClear
                title={filterText}
              />
            </div>
            <div key='content' className={classNames(CSS.scroller)}>
              {this.renderListItems(editFeatures)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderFormEmpty = (description?: string) => {
    const { id, label, config } = this.props
    const { noDataMessage, layersConfig, editMode } = config
    const formHeader = this.refs.formHeaderContainer
    if (formHeader?.innerHTML) formHeader.innerHTML = ''
    const hasValidLayer = layersConfig.length > 0
    const isAttrMode = editMode === EditModeType.Attribute
    const noLayerTips = isAttrMode ? this.formatMessage('initAttEmptyMessage') : this.formatMessage('initGeoEmptyMessage')
    const emptyTips = hasValidLayer ? (noDataMessage || this.formatMessage('noRecordTips')) : noLayerTips
    const formDom = document.getElementById(`edit-container-${id}`)
    if (formDom) formDom?.classList.add('esri-hidden')

    return (
      <div className='surface-1 border-0 h-100'>
        <div className={classNames(`editor-white-bg ${CSS.featureForm}`)}>
          <div className={CSS.formHeader}>
            <h2 className={CSS.heading}>{label}</h2>
            {hasValidLayer &&
              <p className={classNames(`text-truncate ${CSS.description}`)} key='description' title={description}>
                {description}
              </p>
            }
          </div>
        </div>
        <div className='w-100 text-center edit-blank'>
          <div className='position-absolute edit-blank-content w-100'>
            <InfoOutlined size={32} className='placeholder-icon'/>
            <p>{emptyTips}</p>
          </div>
        </div>
      </div>
    )
  }

  renderControlButtons = (buttons: ControlButton[]) => {
    return (
      <div className={classNames(`flex-row justify-content-between ${CSS.controls}`)} key='controls'>
        {buttons.map(({ disabled = false, label, type, clickHandler }, index) =>
          this.renderButton({
            label,
            class: classNames(
              { 'single-buttons': buttons.length === 1 },
              { 'multi-buttons': buttons.length > 1 },
              disabled ? CSS.buttonDisabled : null
            ),
            type,
            disabled,
            clickHandler,
            key: index
          })
        )}
      </div>
    )
  }

  handleNew = (): void => {
    const { dataSources, formPrivileges } = this.state
    const { config } = this.props
    const { layersConfig } = config
    const formPrivilegesIsFull = formPrivileges === 'full'
    const formPrivilegesIsNormal = formPrivileges === 'normal'
    let firstId
    if (formPrivilegesIsFull) {
      firstId = layersConfig.find(config => config?.isTable)?.id
    } else if (formPrivilegesIsNormal) {
      firstId = layersConfig.find(config => config?.addRecords)?.id
    }
    if (firstId) {
      const firstDataSource = dataSources?.[firstId]
      if (!firstDataSource) return
      this.setState({ featureFormStep: 'new', activeId: firstId }, () => {
        this.renderFeatureForm(firstDataSource as QueriableDataSource)
      })
    }
  }

  handleAdd = (): void => {
    const addFeature = (this.edit.viewModel as __esri.FeatureFormViewModel)?.feature
    if (addFeature) {
      const updated = (this.edit as __esri.FeatureForm).getValues()
      addFeature.attributes = updated
      const edits = {
        addFeatures: [addFeature]
      }
      this.applyAttributeUpdates(edits)
    }
  }

  handleSave = (): void => {
    (this.edit?.viewModel as __esri.FeatureFormViewModel)?.submit()
    this.setState({ attrUpdating: true })
  }

  handleDeleteConfirm = () => {
    this.setState({ delConfirm: true })
  }

  cancleDelete = () => {
    this.setState({ delConfirm: false })
  }

  handleDelete = (): void => {
    const delFeature = (this.edit.viewModel as __esri.FeatureFormViewModel).feature
    if (delFeature) {
      const edits = {
        deleteFeatures: [delFeature]
      }
      this.applyAttributeUpdates(edits)
    }
    this.setState({ delConfirm: false })
  }

  renderButton = (props) => {
    return (
      <Button
        className={props.class}
        disabled={props.disabled}
        key={props.key}
        onClick={props.clickHandler}
        type={props.type}
      >
        {props.label}
      </Button>
    )
  }

  constructFieldConfig = (groupedFields, relatedRecords: boolean, originalRelationshipElement = []) => {
    const useGroupedFields = groupedFields?.asMutable ? groupedFields.asMutable({ deep: true }) : groupedFields
    const elements: Array<GroupElement | FieldElement | RelationshipElement> = useGroupedFields.map(item => {
      if (item?.children) {
        return new GroupElement({
          label: item.name,
          description: item.subDescription || item?.description,
          elements: item?.children.map(ele => {
            return new FieldElement({
              fieldName: ele.jimuName,
              label: ele?.alias || ele?.name,
              description: ele.subDescription || ele?.description,
              editableExpression: ele.editAuthority ? 'true' : 'false'
            })
          })
        })
      } else {
        return new FieldElement({
          fieldName: item.jimuName,
          label: item?.alias || item?.name,
          description: item.subDescription || item?.description,
          editableExpression: item.editAuthority ? 'true' : 'false'
        })
      }
    })
    const newRelationshipElement = []
    if (!relatedRecords) {
      for (const element of originalRelationshipElement) {
        const newElement = element.clone()
        newElement.editableExpression = 'false'
        newRelationshipElement.push(newElement)
      }
    }
    const relationshipElement = relatedRecords ? originalRelationshipElement : newRelationshipElement
    const fullElements = relationshipElement ? elements.concat(relationshipElement) : elements
    return fullElements
  }

  editorLayerWatcher = (event, id: string, layer, layerName: string) => {
    const { dataSources, activeId } = this.state
    const dataSource = dataSources[id]
    const { addedFeatures, updatedFeatures, deletedFeatures } = event
    const adds = addedFeatures && addedFeatures.length > 0
    const updates = updatedFeatures && updatedFeatures.length > 0
    const deletes = deletedFeatures && deletedFeatures.length > 0
    let changedType = SparkChangedType.Added
    if (adds) {
      changedType = SparkChangedType.Added
      const addFeature = event?.edits?.addFeatures?.[0]
      if (addFeature) {
        const record = dataSource.buildRecord(addFeature)
        dataSource.afterAddRecord(record)
      }
    }
    if (updates) {
      changedType = SparkChangedType.Updated
      const updateFeature = event?.edits?.updateFeatures?.[0]
      const originalFeature = (this.edit.viewModel as __esri.EditorViewModel)?.featureFormViewModel?.feature || (this.edit as any)?._featureForm?.feature
      const originalAttributes = originalFeature?.attributes || {}
      const originalGeometry = originalFeature?.geometry || null
      const originalLayer = originalFeature?.layer || layer
      const newAttributes = Object.assign(originalAttributes, updateFeature?.attributes)
      updateFeature.attributes = newAttributes
      updateFeature.layer = originalLayer
      if (!updateFeature.geometry) updateFeature.geometry = originalGeometry
      if (updateFeature) {
        const record = dataSource.buildRecord(updateFeature)
        dataSource.afterUpdateRecord(record)
        const newEditFeatures = {}
        if (!activeId) return
        newEditFeatures[activeId] = [record]
        this.startWorkFlowWhenAwait(newEditFeatures)
      }
    }
    if (deletes) {
      changedType = SparkChangedType.Deleted
      const deleteFeature = event?.edits?.deleteFeatures?.[0]
      if (deleteFeature) {
        const record = dataSource.buildRecord(deleteFeature)
        dataSource.afterDeleteRecordById(record.getId())
      }
    }
    if (adds || updates || deletes) {
      this.sendSparkMsg(changedType, layerName)
    }
  }

  isLayerInfoChange = (newInfos: any[], originInfos: any[]): boolean => {
    let isChange = false
    if (newInfos?.length !== originInfos?.length) return true
    newInfos.forEach((newInfo, index) => {
      const originIndex = originInfos.findIndex(originInfo => originInfo.layer.id === newInfo.layer.id)
      if (originIndex !== index) {
        isChange = true
        return
      }
      const originInfo = originInfos[originIndex]
      if (originInfo) {
        const optionKeys = [
          'enabled',
          'addEnabled',
          'updateEnabled',
          'deleteEnabled',
          'formTemplate'
        ]
        for (const key of optionKeys) {
          if (originInfo[key] !== newInfo[key]) {
            isChange = true
            break
          }
        }
      } else {
        isChange = true
      }
    })
    return isChange
  }

  clearAllDsSelect = () => {
    const { dataSources } = this.state
    const dsKeys = Object.keys(dataSources)
    dsKeys.forEach(key => {
      dataSources[key]?.clearSelection()
    })
  }

  getDsCap = (capabilities: string, capType: string) => {
    if (capabilities) {
      return Array.isArray(capabilities)
        ? capabilities?.join().toLowerCase().includes(capType)
        : capabilities?.toLowerCase().includes(capType)
    } else {
      return false
    }
  }

  constructUneditableInfo = (layer: __esri.Layer) => {
    return {
      layer,
      enabled: false,
      addEnabled: false,
      updateEnabled: false,
      deleteEnabled: false
    }
  }

  newOrUpdateEditor = async (modifyType: ModifyType, mapView?: JimuMapView, relatedRecordsChange?: boolean) => {
    const isNewEditor = modifyType === ModifyType.new
    const { jimuMapView: orgJimuMapView, dataSources, editFeatures } = this.state
    const { id, config } = this.props
    const {
      layersConfig, selfSnapping, featureSnapping, defaultSelfEnabled, defaultFeatureEnabled, defaultSnapLayers,
      snapSettingMode, tooltip, templateFilter, relatedRecords, liveDataEditing
    } = config
    const editLayerInfos = []
    let newEditor
    let jimuMapView = orgJimuMapView
    if (mapView) jimuMapView = mapView
    if (!jimuMapView) return
    let count = 0
    if (isNewEditor) {
      const { useMapWidgetIds } = this.props
      if (!useMapWidgetIds || useMapWidgetIds.length === 0) return
      if (layersConfig?.length === 0) return
      // only setting change
      if (typeof this.edit !== 'undefined' && !relatedRecordsChange) {
        if (!mapView && this.edit && !this.edit.destroyed) {
          this.newOrUpdateEditor(ModifyType.update, jimuMapView)
          return
        }
      }
      this.destroyEdit()
      let container = null
      const existingDom = document.getElementById(`edit-container-${id}`)
      if (existingDom) {
        existingDom.remove()
      }
      container = document && document.createElement('div')
      container.id = `edit-container-${id}`
      container.className = `h-100 edit-container-${id}`
      this.refs.editContainer.appendChild(container)
      const flexibleMode = snapSettingMode === SnapSettingMode.Flexible
      const snapOn = selfSnapping || featureSnapping
      const defaultSnapSources = await this.getDefaultSnapSources(jimuMapView, defaultSnapLayers)
      newEditor = () => {
        this.edit = new Editor({
          container: container,
          view: jimuMapView.view,
          layerInfos: editLayerInfos,
          snappingOptions: {
            enabled: defaultSelfEnabled || defaultFeatureEnabled,
            selfEnabled: defaultSelfEnabled,
            featureEnabled: defaultFeatureEnabled,
            featureSources: defaultSnapSources
          },
          visibleElements: {
            snappingControls: flexibleMode && snapOn,
            snappingControlsElements: {
              enabledToggle: true,
              selfEnabledToggle: selfSnapping,
              featureEnabledToggle: featureSnapping
            },
            tooltipsToggle: tooltip
          },
          supportingWidgetDefaults: {
            featureTemplates: {
              visibleElements: {
                filter: templateFilter
              }
            }
          }
        })
        // eslint-disable-next-line
        const that = this
        reactiveUtils.watch(() => this.edit.viewModel.state, (editState, oldEditState) => {
          // When the state is not 'ready', then the editor will have the back button, and the Dom will render after a short while after the state change,
          // thus delaying the binding to clear the back button
          if (editState !== 'ready') {
            setTimeout(() => {
              const shadowRoot = document.querySelector('calcite-flow-item:not([hidden])')?.shadowRoot
              const backButtonDom = shadowRoot?.querySelector('.back-button')
              const backEvent = () => {
                this.setState({ editFeatures: {} }, () => {
                  this.clearAllDsSelect()
                })
              }
              backButtonDom?.removeEventListener('click', backEvent)
              backButtonDom?.addEventListener('click', backEvent)
            }, 500)
          }
          const featureFormViewModel = (that.edit.viewModel as any)?.featureFormViewModel
          const feature = featureFormViewModel?.feature
          if (!feature) return
          const { dataSources, selectionStartWorkflow } = that.state
          const curLayerId = feature?.layer?.id || featureFormViewModel?.layer?.id
          const activeConfig = layersConfig.find(config => config.layerId === curLayerId)
          if (!activeConfig) return
          const dataSource = dataSources[activeConfig.id]
          // When table state is 'ready'('awaiting-feature-to-update' means being update),
          // this means that you have returned to the editor home page from editing or awaiting.
          if ((!this.editorNotBackButton && editState === 'ready')) {
            dataSource.clearSelection()
          }
          // In the 2023.11.1 patch test, a datasource synchronization problem was found.
          // Debug found that the API state changed from 'editing-existing-feature' to 'editing-attributes'.
          if (editState === 'editing-attributes') {
            const record = dataSource.buildRecord(feature)
            if (selectionStartWorkflow) {
              that.setState({ selectionStartWorkflow: false })
            } else {
              this.editorSelectFeature = true
              dataSource.selectRecordById(record.getId(), record)
            }
          }
        })
        // recheck editFeatures for some change cause by url or other pages/windows
        const newEditFeatures = Object.assign({}, editFeatures)
        for (const dsId in dataSources) {
          const curlayerInfo = editLayerInfos.find(info => dsId.includes(info.layer.id))
          const hasEditableFeature = curlayerInfo?.updateEnabled || curlayerInfo?.deleteEnabled
          if (hasEditableFeature) {
            newEditFeatures[dsId] = dataSources[dsId].getSelectedRecords()
          }
        }
        if (!lodash.isDeepEqual(editFeatures, newEditFeatures)) {
          this.setState({ editFeatures: newEditFeatures, selectionStartWorkflow: true }, () => {
            if (!jimuMapView) return
            this.startWorkFlowWhenAwait(newEditFeatures)
          })
        }
      }
    }
    // Due to the special mechanism of the interface, all unconfigured layers are enabled by default.
    // Therefore, now set the default permissions of layer not configured to false.
    const mapAllLayers = jimuMapView.view?.map?.allLayers || []
    // When 'add to map' in runtime the first time, the addToMap layer will not in mapAllLayers
    const mapViewLayers = jimuMapView.view?.map?.layers || []
    const addToMaplayers = mapViewLayers.filter(layer => layer?.id.includes(ADD_TO_MAP_DATA_ID_PREFIX))
    addToMaplayers.forEach(addedLayer => {
      const alreadyHas = mapAllLayers.find(l => l.id === addedLayer.id)
      if (!alreadyHas) {
        mapAllLayers.push(addedLayer)
      }
    })
    const allLayers = mapAllLayers.filter(item => item.type === 'feature' || item.type === 'oriented-imagery')
    // Draw widget measurements layer
    const measureLayers: __esri.Layer[] = []
    mapAllLayers.forEach(layer => {
      if (layer?.id.includes('jimu-draw-measurements-layer')) {
        measureLayers.push(layer)
      }
    })
    if (measureLayers.length > 0) {
      measureLayers.forEach(measureLayer => {
        editLayerInfos.push(this.constructUneditableInfo(measureLayer))
      })
    }
    // configed layer setting need to follow the order of setting
    const configLayerInfos = []
    allLayers.forEach(async layer => {
      const activeConfigLayer = layersConfig.find(config => config.layerId === layer.id)
      // new Editor must use layer on map
      const editorUseLayer = layer
      // If editorUseLayer is undefined, indicates that map is invisible(switch mapGroup)
      // It does not have to be added to editLayerInfos
      if (editorUseLayer) {
        // It has been configured in setting
        if (activeConfigLayer) {
          const { groupedFields: rawGroupedFields, addRecords, deleteRecords, updateRecords, updateAttributes, updateGeometries, layerHonorMode, id } = activeConfigLayer
          const groupedFields = this.applyViewToGroupedFields(rawGroupedFields, id)
          const isHonorWebmap = layerHonorMode === LayerHonorModeType.Webmap
          // fetch to confirm whether it's a public source
          const accessible = await this.getDsAccessibleInfo((layer as any)?.url)
          // use exb privilege instead of api's supportsUpdateByOthers
          const privilegeEditable = await this.getPrivilege()
          // New logic of API: The user with advanced permissions can modify the configuration regardless of the configuration
          const isAdvancedPermission = await this.getIsAdvancedPermission(editorUseLayer)
          // full editing privileges
          const fullEditingPrivileges = (editorUseLayer as any)?.userHasFullEditingPrivileges
          const layerEditingEnabled = (editorUseLayer as any)?.editingEnabled ?? true
          // exb access and privilege
          const editable = accessible || privilegeEditable
          // construct formTemplate
          const originalFormTemplate = (editorUseLayer as any)?.formTemplate ?? {}
          const haveTemplateElements = originalFormTemplate.elements?.length > 0
          const { expressionInfos: originalExpressionInfos, title: originalTitle } = originalFormTemplate
          const dataSource = dataSources[activeConfigLayer.id]
          // use popupTemplate editable
          const popupTemplateFieldInfos = (editorUseLayer as any)?.popupTemplate?.fieldInfos || []
          // use schemaFields to filter used fields, some field is special and invisible in schema
          const allFieldsSchema = dataSource?.getSchema()
          const schemaFieldsKeys = allFieldsSchema?.fields ? Object.keys(allFieldsSchema.fields) : []
          const layerDefinition = (dataSource as FeatureLayerDataSource)?.getLayerDefinition()
          const fieldsConfig = layerDefinition?.fields || []
          const allFields = allFieldsSchema?.fields ? Object.values(allFieldsSchema?.fields) : []
          const useFields = layerDefinition?.fields?.length > 0 ? layerDefinition.fields : allFields
          const filteredUseFields = (useFields as any[]).filter(item => schemaFieldsKeys.includes(item.jimuName || item.name))
          let originalRelationshipElement = this.relationships[editorUseLayer.id]
          if (!originalRelationshipElement) {
            const oriRelationElements = originalFormTemplate?.elements?.filter(element => element.type === 'relationship')
            const oriRelations = []
            oriRelationElements?.forEach(element => {
              oriRelations.push(element?.clone())
            })
            this.relationships[editorUseLayer.id] = oriRelations
            originalRelationshipElement = oriRelations
          }
          let usedFormTemplate = {}
          // honor webmap
          if (isHonorWebmap) {
            const objectIdField = dataSource?.getIdField() || 'OBJECTID'
            const usedFields = this.getUsedFields(fieldsConfig, filteredUseFields, objectIdField, popupTemplateFieldInfos)
            if (haveTemplateElements) {
              // honor, allow relatedRecords
              if (relatedRecords) {
                if (originalRelationshipElement?.length > 0) {
                  const newFormTemplate = originalFormTemplate.clone()
                  // replace old relationship elements
                  newFormTemplate.elements.map(element => {
                    let newElement = element
                    if (element.type === 'relationship') {
                      const origElement = originalRelationshipElement.find(item => (item.label === element.label && item.relationshipId === element.relationshipId))
                      if (origElement) newElement = origElement
                    }
                    return newElement
                  })
                  usedFormTemplate = newFormTemplate
                } else {
                  const newFormTemplate = originalFormTemplate.clone()
                  usedFormTemplate = newFormTemplate
                }
              // honor, not allow relatedRecords
              } else {
                if (originalRelationshipElement?.length > 0) {
                  const newFormTemplate = originalFormTemplate.clone()
                  // find and close all relationship
                  for (const element of newFormTemplate.elements) {
                    if (element.type === 'relationship') {
                      element.editableExpression = 'false'
                    }
                  }
                  usedFormTemplate = newFormTemplate
                } else {
                  const newFormTemplate = originalFormTemplate.clone()
                  usedFormTemplate = newFormTemplate
                }
              }
            } else {
              usedFormTemplate = new FormTemplate({
                elements: this.constructFieldConfig(usedFields, relatedRecords, []),
                expressionInfos: originalExpressionInfos,
                title: originalTitle || editorUseLayer?.title
              })
            }
          // customize
          } else {
            usedFormTemplate = new FormTemplate({
              elements: this.constructFieldConfig(groupedFields, relatedRecords, originalRelationshipElement),
              expressionInfos: originalExpressionInfos,
              title: originalTitle || editorUseLayer?.title
            })
          }
          if (isAdvancedPermission || (fullEditingPrivileges && layerEditingEnabled)) {
            configLayerInfos.push({
              layer: editorUseLayer,
              ...(usedFormTemplate ? { formTemplate: usedFormTemplate } : {}),
              enabled: true,
              addEnabled: true,
              updateEnabled: true,
              deleteEnabled: true,
              attributeUpdatesEnabled: true,
              geometryUpdatesEnabled: true
            })
          } else if (fullEditingPrivileges && !layerEditingEnabled) {
            configLayerInfos.push(this.constructUneditableInfo(editorUseLayer))
          } else {
            configLayerInfos.push({
              layer: editorUseLayer,
              ...(usedFormTemplate ? { formTemplate: usedFormTemplate } : {}),
              enabled: editable && (addRecords || updateRecords || deleteRecords),
              addEnabled: addRecords,
              updateEnabled: updateRecords,
              deleteEnabled: deleteRecords,
              attributeUpdatesEnabled: updateAttributes,
              geometryUpdatesEnabled: updateGeometries
            })
          }
          // update dataSource after edit
          const watchEditLayer = editorUseLayer as any
          if (isNewEditor || !watchEditLayer.hasEventListener('edits')) {
            watchEditLayer.on('edits', event => {
              this.editorLayerWatcher(event, id, watchEditLayer, watchEditLayer.title)
            })
          }
        // runtime added layer
        } else if (liveDataEditing && editorUseLayer.id.includes(ADD_TO_MAP_DATA_ID_PREFIX)) {
          await jimuMapView.whenJimuMapViewLoaded()
          await jimuMapView.whenAllJimuLayerViewLoaded()
          const addedLayerDs = jimuMapView.jimuLayerViews[`${jimuMapView.id}-${editorUseLayer.id}`]?.getLayerDataSource()
          const featureLayerDs = addedLayerDs as FeatureLayerDataSource
          // file upload ds: only have layer, but not itemId and url
          if (!addedLayerDs || (!featureLayerDs.itemId && !featureLayerDs.url)) {
            editLayerInfos.push(this.constructUneditableInfo(editorUseLayer))
            count++
            return
          }
          const isAdvancedPermission = await this.getIsAdvancedPermission(editorUseLayer, addedLayerDs)
          const fullEditingPrivileges = (editorUseLayer as any)?.userHasFullEditingPrivileges
          const layerEditingEnabled = (editorUseLayer as any)?.editingEnabled ?? true
          const accessible = await this.getDsAccessibleInfo((layer as any)?.url)
          const privilegeEditable = await this.getPrivilege()
          const editable = accessible || privilegeEditable
          const layerDefinition = (editorUseLayer as any)?.sourceJSON
          const allowGeometryUpdates = layerDefinition?.allowGeometryUpdates
          const capabilities = layerDefinition?.capabilities
          const create = this.getDsCap(capabilities, 'create')
          const update = this.getDsCap(capabilities, 'update')
          const deletable = this.getDsCap(capabilities, 'delete')
          if (isAdvancedPermission || (fullEditingPrivileges && layerEditingEnabled)) {
            editLayerInfos.push({
              layer: editorUseLayer,
              enabled: true,
              addEnabled: true,
              updateEnabled: true,
              deleteEnabled: true,
              attributeUpdatesEnabled: true,
              geometryUpdatesEnabled: true
            })
          } else if (fullEditingPrivileges && !layerEditingEnabled) {
            editLayerInfos.push(this.constructUneditableInfo(editorUseLayer))
          } else {
            editLayerInfos.push({
              layer: editorUseLayer,
              enabled: editable && (create || update || deletable),
              addEnabled: create,
              updateEnabled: update,
              deleteEnabled: deletable,
              attributeUpdatesEnabled: update,
              geometryUpdatesEnabled: allowGeometryUpdates && update
            })
          }
        } else {
          editLayerInfos.push(this.constructUneditableInfo(editorUseLayer))
        }
      }
      count++
      if (count === allLayers.length) {
        // Sort the config layer at the end of the loop
        configLayerInfos.sort((a, b) => {
          const aIndex = layersConfig.findIndex(config => config.layerId === a.layer.id)
          const bIndex = layersConfig.findIndex(config => config.layerId === b.layer.id)
          return aIndex - bIndex
        })
        editLayerInfos.unshift(...configLayerInfos)
        if (isNewEditor) {
          newEditor()
        } else {
          const editor = this.edit as Editor
          const isLayerInfoChange = this.isLayerInfoChange(editLayerInfos, editor.layerInfos)
          if (isLayerInfoChange) editor.layerInfos = editLayerInfos
        }
      }
    })
  }

  getUsedFields = (fieldsConfig, filteredUseFields, objectIdField: string, popupTemplateFieldInfos) => {
    const usedFields = []
    filteredUseFields.forEach(item => {
      const orgField = fieldsConfig.find(field => field.name === item.name)
      const defaultAuthority = orgField?.editable
      const defaultInvisible = [
        objectIdField,
        'CreationDate',
        'Creator',
        'EditDate',
        'Editor',
        'GlobalID'
      ]
      if (!defaultInvisible.includes(item.name)) {
        const usePopupField = popupTemplateFieldInfos.find(ele => ele.fieldName === item.name)
        const editable = usePopupField ? usePopupField?.isEditable : defaultAuthority
        usedFields.push({
          name: item.name,
          jimuName: item.name,
          alias: item.alias,
          editable: editable,
          editAuthority: editable
        })
      }
    })
    return usedFields
  }

  getDefaultSnapSources = async (jimuMapView: JimuMapView, defaultSnapLayers) => {
    if (!jimuMapView) return []
    await jimuMapView.whenAllJimuLayerViewLoaded()
    if (!jimuMapView?.jimuLayerViews) return []
    const allViewLayerKeys = Object.keys(jimuMapView.jimuLayerViews)
    const snapLayersSources = allViewLayerKeys.filter(layerViewId => {
      return defaultSnapLayers?.includes(jimuMapView.jimuLayerViews[layerViewId].layerDataSourceId)
    }).map(lvId => {
      return {
        layer: jimuMapView.jimuLayerViews[lvId].layer,
        enabled: true
      }
    })
    return snapLayersSources
  }

  getImageryLayer = (dataSource): Promise<any> => {
    const ds = dataSource as ImageryLayerDataSource
    let imageLayer
    const curQuery: any = ds.getCurrentQueryParams()
    if (ds.itemId) {
      const layerId = parseInt(ds.layerId)
      const layerConfig = {
        portalItem: {
          id: ds.itemId,
          portal: {
            url: ds.portalUrl
          }
        },
        definitionExpression: curQuery.where,
        layerId: layerId || undefined
      }
      if (ds.url) (layerConfig as any).url = ds.url
      imageLayer = new OrientedImageryLayer(layerConfig)
    } else if (ds.url) {
      imageLayer = new OrientedImageryLayer({
        definitionExpression: curQuery.where,
        url: ds.url
      })
    } else if (ds.layer) {
      return ds?.createJSAPILayerByDataSource().then(layer => {
        return layer
      })
    }
    return Promise.resolve(imageLayer)
  }

  getFeatureLayer = (dataSource: QueriableDataSource) => {
    if (dataSource.type === AllDataSourceTypes.OrientedImageryLayer) {
      return this.getImageryLayer(dataSource)
    }
    const { id } = this.props
    const ds = dataSource as FeatureLayerDataSource
    const notToLoad = dataSource?.getDataSourceJson()?.isDataInDataSourceInstance
    let featureLayer
    const curQuery: any = dataSource && dataSource.getCurrentQueryParams()
    if (notToLoad) {
      // chart output and selected features need load
      return ds.load({ returnGeometry: true }, { widgetId: id }).then(async (records) => {
        const dataRecords = await Promise.resolve(records) as FeatureDataRecord[]
        return dataSourceUtils.createJSAPIFeatureLayerByRecords(ds, dataRecords)
      }).catch(err => {
        console.error(err)
      })
    }
    // Adjust the order, because ds.layer is a reference type that changes the original data
    // csv upload type ds: only have layer, but not itemId and url
    if (!FeatureLayer) return Promise.resolve(featureLayer)
    if (ds?.itemId) {
      const layerId = parseInt(ds.layerId)
      const layerConfig = {
        portalItem: {
          id: ds.itemId,
          portal: {
            url: ds.portalUrl
          }
        },
        definitionExpression: curQuery.where,
        layerId: layerId || undefined
      }
      if (ds.url) (layerConfig as any).url = ds.url
      featureLayer = new FeatureLayer(layerConfig)
    } else if (ds.url) {
      featureLayer = new FeatureLayer({
        definitionExpression: curQuery.where,
        url: ds.url
      })
    } else if (ds.layer) {
      return ds.load({ returnGeometry: true }, { widgetId: id }).then(async (records) => {
        const dataRecords = await Promise.resolve(records) as FeatureDataRecord[]
        return dataSourceUtils.createJSAPIFeatureLayerByRecords(ds, dataRecords)
      }).catch(err => {
        console.error(err)
      })
    } else {
      return Promise.resolve(featureLayer)
    }

    if (notToLoad) { // output ds (dynamic layer, load will rise bug)
      return Promise.resolve(featureLayer)
    } else { // need load to get layer.capabilities
      return featureLayer.load().then(async () => {
        return await Promise.resolve(featureLayer)
      }).catch(err => {
        console.error(err)
      })
    }
  }

  getCurrentEditLayer = (layerId: string) => {
    if (!layerId) return undefined
    const { activeId, jimuMapView } = this.state
    const { config } = this.props
    const { layersConfig } = config
    const mapLayers = jimuMapView.view.map.layers
    const activeConfig = layersConfig.asMutable({ deep: true }).find(item => item.id === activeId)
    const { id: configDsId } = activeConfig
    let currentEditLayer = mapLayers.find(layer => layer.id === layerId)
    if (!currentEditLayer) {
      mapLayers.forEach(layer => {
        const subLayers = (layer as any)?.layers
        if (subLayers && (configDsId?.includes(layer.id) || configDsId?.includes(layerId))) {
          currentEditLayer = subLayers.find(layer => (layer.layerId?.toString() === layerId || layer.id === layerId))
        }
      })
    }
    return currentEditLayer
  }

  startWorkFlowWhenAwait = async (editFeatures?, useDataSourceId?: string) => {
    const { activeId, dataSources, editFeatures: orgEditFeatures, jimuMapView } = this.state
    const edit = this.edit as __esri.Editor
    // The number of selected(the layers from the same map)
    const newEditFeatures = editFeatures || orgEditFeatures
    const mapEditCount = this.flatMapArrayWithView(newEditFeatures, jimuMapView).length
    if (mapEditCount === 1) {
      const dsId = useDataSourceId || activeId
      const objectIdField = this.getLayerObjectIdField(dataSources[dsId])
      const activeGraphic = (newEditFeatures?.[dsId]?.[0] as FeatureDataRecord)?.feature as __esri.Graphic
      const currentEditLayer = this.getCurrentEditLayer(activeGraphic?.layer?.id) as __esri.FeatureLayer
      // currentEditLayer is not in active map
      if (!currentEditLayer) return
      const query = new Query({
        where: `${objectIdField} = ${activeGraphic.attributes[objectIdField]}`,
        outFields: ['*'],
        returnGeometry: true
      })
      currentEditLayer.queryFeatures(query).then(results => {
        const activeFeature = results?.features[0]
        edit?.startUpdateWorkflowAtFeatureEdit(activeFeature)
      }).catch(err => {
        console.error(err)
      })
    } else if (mapEditCount > 1) {
      const loopAddGraphics = async () => {
        let graphics = []
        const promises = []
        for (const dsId in newEditFeatures) {
          const objectIdField = this.getLayerObjectIdField(dataSources[dsId])
          const layerFeaturesArray = newEditFeatures?.[dsId]
          if (layerFeaturesArray?.length > 0) {
            const selectedQuery = `${objectIdField} IN (${newEditFeatures[dsId]
              .map(record => {
                const activeGraphic = (record as FeatureDataRecord)?.feature as __esri.Graphic
                return activeGraphic.attributes[objectIdField]
              })
              .join()})`
            const currentGraphic = (layerFeaturesArray[0] as FeatureDataRecord)?.feature as __esri.Graphic
            const currentEditLayer = this.getCurrentEditLayer(currentGraphic?.layer?.id) as __esri.FeatureLayer
            const query = new Query({
              where: selectedQuery,
              outFields: ['*'],
              returnGeometry: true
            })
            promises.push(currentEditLayer.queryFeatures(query))
          }
        }
        const results = await Promise.all(promises)
        Object.keys(newEditFeatures).forEach((dsId, index) => {
          graphics = graphics.concat(results[index]?.features || [])
        })
        return graphics
      }
      const graphics = await loopAddGraphics()
      edit?.startUpdateWorkflowAtMultipleFeatureSelection(graphics)
    } else {
      if (edit?.activeWorkflow) edit?.cancelWorkflow()
    }
  }

  idsArrayEquals = (newDataSourceId: string, newSelectedIds: string[]) => {
    if (!newSelectedIds) return false
    if (this.selectedIds[newDataSourceId]?.length !== newSelectedIds.length) return false
    let equal = true
    this.selectedIds[newDataSourceId]?.forEach((id, index) => {
      if (id !== newSelectedIds[index]) equal = false
    })
    return equal
  }

  onDataSourceSelectedChange = async (dataSourceId: string, selectedIds: string[]) => {
    if (this.idsArrayEquals(dataSourceId, selectedIds)) return
    const newRequestId = this.currentRequestId + 1
    this.currentRequestId++
    this.selectedIds[dataSourceId] = selectedIds
    const { id, config, widgetsRuntimeInfo } = this.props
    const { editMode, layersConfig } = config
    const { activeId, dataSources, editFeatures, jimuMapView } = this.state
    const isGeoMode = editMode === EditModeType.Geometry
    if (!isGeoMode) {
      this.setState({ formChange: false })
    }
    let useDataSourceId = dataSourceId
    const newEditFeatures = Object.assign({}, editFeatures)
    if (!dataSources[useDataSourceId]) {
      const currentDs = this.dsManager.getDataSource(useDataSourceId)
      if (currentDs) {
        dataSources[useDataSourceId] = currentDs
      }
    }
    const selectedRecords = dataSources[useDataSourceId]?.getSelectedRecords()
    // check if the selected feature is editable, if not, don't add it to 'newEditFeatures'
    if (isGeoMode) {
      const editor = this.edit as Editor
      // url param: If selection change occurs before editor render,
      // record this data and modify the editFeatures after editor render.
      if (!editor && !this.changeBeforeRender) {
        this.changeBeforeRender = { dataSourceId, selectedRecords }
        let time = 0
        this.loadChangeAfterRenderTimer = setInterval(() => {
          time++
          if (this.edit) {
            const { dataSourceId, selectedRecords } = this.changeBeforeRender
            this.onDataSourceSelectedChange(dataSourceId, selectedRecords)
            this.changeBeforeRender = undefined
            clearInterval(this.loadChangeAfterRenderTimer)
          } else if (time === 5 && !this.edit) {
            this.changeBeforeRender = undefined
            clearInterval(this.loadChangeAfterRenderTimer)
          }
        }, 1000)
        return
      }
      const curlayerInfo = editor?.layerInfos.find(info => useDataSourceId.includes(info.layer.id))
      const hasEditableFeature = curlayerInfo?.updateEnabled || curlayerInfo?.deleteEnabled
      if (hasEditableFeature) {
        newEditFeatures[useDataSourceId] = selectedRecords
      }
    } else {
      newEditFeatures[useDataSourceId] = selectedRecords
    }
    const inConfigEditFeatures = this.getInLayersConfigFeatures(newEditFeatures, layersConfig)
    const flatEditFeatures = this.flatMapArray(inConfigEditFeatures)
    const editCount = flatEditFeatures.length
    this.setState({ editFeatures: newEditFeatures })
    if (isGeoMode && editCount === 0) {
      const editor = this.edit as Editor
      if (editor?.activeWorkflow) editor?.cancelWorkflow()
    }
    // To avoid causing ds to trigger the processing done by edit workflow again after editor select synchronizes ds
    if (this.editorSelectFeature) {
      this.setState({ activeId: dataSourceId })
      this.editorSelectFeature = false
      return
    }
    // If the last one of ds has been deselect, and there still other ds has selected record
    // dataSourceId need change to other's (Only for Attribute Type)
    if (selectedRecords?.length === 0 && editCount === 1) {
      let newDsId
      for (const dsId in newEditFeatures) {
        if (newEditFeatures?.[dsId]?.length === 1) {
          newDsId = dsId
        }
      }
      useDataSourceId = newDsId
    }
    if (isGeoMode && selectedRecords?.length === 0) {
      const editor = this.edit as Editor
      if (editor?.activeWorkflow) editor?.cancelWorkflow()
    }
    const dsChange = activeId !== dataSourceId
    // FeatureForm
    if (!isGeoMode) {
      this.setState({ activeId: useDataSourceId }, () => {
        this.createEditForm(useDataSourceId, dsChange, newRequestId)
      })
    }
    // Editor
    if (isGeoMode && selectedIds.length !== 0) {
      this.setState({ activeId: dataSourceId })
    }
    if (isGeoMode && editCount !== 0) {
      if (!jimuMapView) return
      // When controller is close, don't start workflow
      const currentWidgetState = widgetsRuntimeInfo[id].state
      if (currentWidgetState === WidgetState.Closed) return
      this.setState({ selectionStartWorkflow: true }, () => {
        this.startWorkFlowWhenAwait(newEditFeatures, useDataSourceId)
      })
    }
  }

  onIsDataSourceNotReady = (dataSourceId: string, dataSourceStatus: DataSourceStatus) => {
    this.setState((state: State) => {
      const isOutPutDs = state.dataSources[dataSourceId]?.getDataSourceJson().isOutputFromWidget
      if (!isOutPutDs) {
        return
      }
      const outputDataSource = Object.assign({}, state.outputDataSourceIsNotReady)
      outputDataSource[dataSourceId] = dataSourceStatus === DataSourceStatus.NotReady
      return { outputDataSourceIsNotReady: outputDataSource }
    })
  }

  onCreateDataSourceCreatedOrFailed = (dataSourceId: string, dataSource: DataSource) => {
    this.setState((state: State) => {
      const newDataSources = Object.assign({}, state.dataSources)
      newDataSources[dataSourceId] = dataSource
      return { dataSources: newDataSources }
    })
  }

  onDataSourceVersionChange = (dataSourceId: string) => {
    const { config } = this.props
    const { editMode } = config
    // FeatureForm
    if (editMode === EditModeType.Attribute) {
      this.setState({ activeId: dataSourceId, formChange: false }, () => {
        this.createEditForm(dataSourceId, true)
      })
    }
  }

  onLayerChange = (evt) => {
    const { dataSources } = this.state
    const selectedLayerId = evt?.target?.value
    this.setState({ activeId: selectedLayerId }, () => {
      this.renderFeatureForm(dataSources[selectedLayerId] as QueriableDataSource)
    })
  }

  handleBack = (): void => {
    const { id, config } = this.props
    const { layersConfig } = config
    const { editFeatures } = this.state
    const inConfigEditFeatures = this.getInLayersConfigFeatures(editFeatures, layersConfig)
    const flatEditFeatures = this.flatMapArray(inConfigEditFeatures)
    const editCount = flatEditFeatures.length
    if (editCount <= 1) {
      this.setState({ featureFormStep: 'empty' })
    } else if (editCount > 1) {
      this.setState({ featureFormStep: 'list' })
    }
    document.getElementById(`edit-container-${id}`).classList.add('esri-hidden')
  }

  getInLayersConfigFeatures = (editFeatures, layersConfig) => {
    const newEditFeatures = Object.assign({}, editFeatures)
    const editFeaturesKeys = Object.keys(editFeatures)
    editFeaturesKeys.forEach(dsId => {
      const isInLayersConfig = layersConfig.some(config => dsId.includes(config.id))
      if (!isInLayersConfig) {
        delete newEditFeatures[dsId]
      }
    })
    return newEditFeatures
  }

  render () {
    const { activeId, editFeatures, featureFormStep, formPrivileges, formEditable, delConfirm, attrUpdating, formChange, formSubmittable, loading } = this.state
    const { id, theme, config, useDataSources, useMapWidgetIds } = this.props
    const { editMode, description, layersConfig } = config
    const activeConfig = layersConfig.asMutable({ deep: true }).find(item => item.id === activeId)
    const updateRecords = activeConfig?.updateRecords ?? false
    const deleteRecords = activeConfig?.deleteRecords ?? false
    const inConfigEditFeatures = this.getInLayersConfigFeatures(editFeatures, layersConfig)
    const flatEditFeatures = this.flatMapArray(inConfigEditFeatures)
    const editCount = flatEditFeatures.length
    // The add button is displayed if any of them are allowed to be added
    const isTableLayer = activeConfig?.isTable ?? false
    const addable = layersConfig.some(config => config?.addRecords)
    const formPrivilegesIsFull = formPrivileges === 'full'
    const formPrivilegesIsNormal = formPrivileges === 'normal'
    const controls: ControlButton[] = []
    if (formPrivilegesIsFull || (formPrivilegesIsNormal && updateRecords)) {
      controls.push({
        label: this.formatMessage('update'),
        type: 'primary',
        disabled: !(formChange && formSubmittable),
        clickHandler: this.handleSave
      })
    }
    if (formPrivilegesIsFull || (formPrivilegesIsNormal && deleteRecords)) {
      controls.push({
        label: this.formatMessage('delete'),
        type: 'default',
        clickHandler: this.handleDeleteConfirm
      })
    }
    const addControls: ControlButton[] = []
    const hasTableLayerAdd = (formPrivilegesIsFull && isTableLayer) || (formPrivilegesIsNormal && addable)
    if (hasTableLayerAdd) {
      addControls.push({
        label: this.formatMessage('add'),
        type: 'primary',
        disabled: false,
        clickHandler: this.handleAdd
      })
    }
    const isAttrMode = editMode === EditModeType.Attribute
    // while views are enabled and the user's portal groups are still resolving, show a
    // loading state instead of the form to avoid a flash of "editable" fields
    const viewsResolving = this.isViewsLoading()
    const hasSurface = (isAttrMode && (featureFormStep === 'form' || featureFormStep === 'new')) || (!isAttrMode && layersConfig.length !== 0)
    const hasEdit = (isAttrMode && featureFormStep !== 'list' && featureFormStep !== 'empty') || (!isAttrMode && layersConfig.length !== 0)
    const hasFormHeader = isAttrMode && featureFormStep !== 'list' && featureFormStep !== 'empty'
    let featureFormLayer
    if (formPrivilegesIsFull) {
      featureFormLayer = layersConfig.filter(item => item.isTable)
    } else if (formPrivilegesIsNormal) {
      featureFormLayer = layersConfig.filter(item => item.addRecords)
    }

    // Hide widget completely if user has no editing access (e.g. Viewer role or unassigned view)
    if (!this.hasUserEditAccess()) {
      return null
    }

    if (!isAttrMode && (!useMapWidgetIds || useMapWidgetIds.length === 0)) {
      return (
        <WidgetPlaceholder
          widgetId={id}
          autoFlip
          iconSize='large'
          style={{ position: 'absolute', left: 0, top: 0 }}
          icon={editPlaceholderIcon}
          data-testid='editPlaceholder'
        />
      )
    }

    return (
      <div className={classNames(`jimu-widget widget-edit esri-widget edit-widget-${id}`)} css={getStyle(theme, id, featureFormStep, editCount, isAttrMode)}>
        {isAttrMode && attrUpdating &&
          <div className={CSS.progressBar} />
        }
        <div className={classNames('edit-con', { 'surface-1 border-0': hasSurface, 'h-100': hasEdit, 'esri-hidden': viewsResolving })}>
          <div ref='formHeaderContainer' className={classNames({ 'form-header-container': hasFormHeader })}/>
          <div ref='editContainer' className={classNames({ 'h-100': !isAttrMode, 'attr-height': isAttrMode && hasEdit })}>
            {isAttrMode && featureFormStep === 'new' &&
              <div className='layer-selector'>
                <label className='esri-feature-form__label'>
                  {this.formatMessage('selectLayer')}
                </label>
                <Select
                  value={activeId}
                  onChange={this.onLayerChange}
                >
                  {featureFormLayer.map(config => {
                    return (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    )
                  })}
                </Select>
              </div>
            }
          </div>
          {isAttrMode && !viewsResolving && editCount > 0 && featureFormStep === 'form' && formEditable && controls?.length > 0 &&
            this.renderControlButtons(controls)
          }
          {isAttrMode && !viewsResolving && featureFormStep === 'new' &&
            this.renderControlButtons(addControls)
          }
        </div>
        {!isAttrMode &&
          <JimuMapViewComponent
            useMapWidgetId={useMapWidgetIds?.[0]}
            onActiveViewChange={this.handleActiveViewChange}
          />
        }
        {isAttrMode && !viewsResolving && editCount > 1 && featureFormStep === 'list' &&
          this.renderFeatureList(inConfigEditFeatures, description)
        }
        {viewsResolving &&
          <div className='views-resolving-container'>
            <Loading />
            <p className='views-resolving-text'>{this.formatMessage('loadingViewPermissions')}</p>
          </div>
        }
        {loading && !viewsResolving && <Loading />}
        {isAttrMode && !viewsResolving && (featureFormStep === 'empty' || layersConfig.length === 0) &&
          this.renderFormEmpty(description)
        }
        {!isAttrMode && layersConfig.length === 0 &&
          this.renderFormEmpty()
        }
        {isAttrMode && delConfirm &&
          <React.Fragment>
            <div className='confirm-scrim'/>
            <div className={CSS.promptDanger}>
              <div className={CSS.promptHeader}>
                <WarningOutlined />
                <h4 className={classNames(CSS.widgetHeading, CSS.promptHeaderHeading)}>{this.formatMessage('deleteRecord')}</h4>
              </div>
              <div className={CSS.promptMessage}>{this.formatMessage('deleteRecordTips')}</div>
              <div className={CSS.promptDivider}></div>
              <div className={CSS.promptActions}>
                <Button
                  className={classNames(CSS.warningOption, CSS.warningOptionPrimary)}
                  onClick={this.cancleDelete}
                >
                  {this.formatMessage('keepRecord')}
                </Button>
                <Button
                  className={classNames(CSS.warningOption, CSS.warningOptionPositive)}
                  onClick={this.handleDelete}
                >
                  {this.formatMessage('delete')}
                </Button>
              </div>
            </div>
          </React.Fragment>
        }
        {isAttrMode && !viewsResolving && hasTableLayerAdd && featureFormStep !== 'form' && featureFormStep !== 'new' &&
          <Button
            size='sm'
            icon
            type='tertiary'
            className='add-feature-btn'
            onClick={this.handleNew}
            title={this.formatMessage('addFeature')}
            aria-label={this.formatMessage('addFeature')}
          >
            <PlusOutlined className='mr-1'/>
            {this.formatMessage('add')}
          </Button>
        }
        <div className='ds-container'>
          {
            useDataSources?.map((useDs, key) => {
              return (
                <EditItemDataSource
                  key={key}
                  useDataSource={useDs}
                  onIsDataSourceNotReady={this.onIsDataSourceNotReady}
                  onDataSourceSelectedChange={this.onDataSourceSelectedChange}
                  onCreateDataSourceCreatedOrFailed={this.onCreateDataSourceCreatedOrFailed}
                  onDataSourceVersionChange={this.onDataSourceVersionChange}
                />
              )
            })
          }
        </div>
      </div>
    )
  }
}
