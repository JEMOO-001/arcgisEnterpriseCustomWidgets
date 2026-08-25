System.register(["jimu-core","jimu-ui","jimu-ui/advanced/setting-components","jimu-ui/advanced/data-source-selector","jimu-ui/basic/list-tree","jimu-core/react","jimu-for-builder","jimu-arcgis"],(function(e,t){var i={},s={},a={},o={},r={},n={},l={},d={};return{setters:[function(e){i.AllDataSourceTypes=e.AllDataSourceTypes,i.DataSourceComponent=e.DataSourceComponent,i.DataSourceManager=e.DataSourceManager,i.DataSourceTypes=e.DataSourceTypes,i.Immutable=e.Immutable,i.LoadingType=e.LoadingType,i.React=e.React,i.SessionManager=e.SessionManager,i.SupportedJSAPILayerTypes=e.SupportedJSAPILayerTypes,i.SupportedLayerServiceTypes=e.SupportedLayerServiceTypes,i.classNames=e.classNames,i.css=e.css,i.getAppStore=e.getAppStore,i.jsx=e.jsx,i.polished=e.polished,i.urlUtils=e.urlUtils,i.utils=e.utils},function(e){s.AdvancedSelect=e.AdvancedSelect,s.Alert=e.Alert,s.Button=e.Button,s.Checkbox=e.Checkbox,s.ConfirmDialog=e.ConfirmDialog,s.Label=e.Label,s.Loading=e.Loading,s.PanelHeader=e.PanelHeader,s.Popper=e.Popper,s.Radio=e.Radio,s.Select=e.Select,s.Switch=e.Switch,s.TextArea=e.TextArea,s.TextInput=e.TextInput,s.defaultMessages=e.defaultMessages},function(e){a.MapWidgetSelector=e.MapWidgetSelector,a.SettingRow=e.SettingRow,a.SettingSection=e.SettingSection,a.SidePopper=e.SidePopper},function(e){o.DataSourceSelector=e.DataSourceSelector,o.FieldSelector=e.FieldSelector,o.dataComponentsUtils=e.dataComponentsUtils},function(e){r.List=e.List,r.Tree=e.Tree,r.TreeAlignmentType=e.TreeAlignmentType,r.TreeCollapseStyle=e.TreeCollapseStyle,r.TreeItemActionType=e.TreeItemActionType},function(e){n.Fragment=e.Fragment},function(e){l.builderAppSync=e.builderAppSync},function(e){d.JimuMapViewComponent=e.JimuMapViewComponent}],execute:function(){e((()=>{var e={27:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" fill-rule="evenodd" d="M12 6.5c0 .527-.074 1.036-.212 1.518l.912.438a6.5 6.5 0 1 0-6.586 4.533l-.077-1.008A5.5 5.5 0 1 1 12 6.5m-9 0a3.5 3.5 0 0 0 2.88 3.445L5.8 8.901a2.501 2.501 0 1 1 3.194-2.224l.949.456A3.5 3.5 0 1 0 3 6.5M15.5 11l-5 1-3 4-1-9.5zm-5.57.094-1.702 2.269-.542-5.152 4.76 2.38z" clip-rule="evenodd"></path></svg>'},56:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" fill-rule="evenodd" d="M8 2a2 2 0 1 0-2 2H4a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1 1V7H4v3H3V6a1 1 0 0 1 1-1h3.184a3 3 0 0 1 .596-1H6a2 2 0 0 0 2-2M6 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2m6 3a2 2 0 1 0-2 2H8a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0 2-2M9 6a1 1 0 1 0 2 0 1 1 0 0 0-2 0m4 8v-4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v4h1v-3h1v4h2v-4h1v3z" clip-rule="evenodd"></path></svg>'},655:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" fill-rule="evenodd" d="M2.146 4.653a.485.485 0 0 1 .708 0L8 10.24l5.146-5.587a.485.485 0 0 1 .708 0 .54.54 0 0 1 0 .738l-5.5 5.956a.485.485 0 0 1-.708 0l-5.5-5.956a.54.54 0 0 1 0-.738" clip-rule="evenodd"></path></svg>'},556:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" fill-rule="evenodd" d="M1 2h4a1 1 0 0 1 1 1v1h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1m0 1v11h13V4.913H5V3zm6 3h1v3h3v1H8v3H7v-3H4V9h3z" clip-rule="evenodd"></path></svg>'},838:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" d="m8.745 8 6.1 6.1a.527.527 0 1 1-.745.746L8 8.746l-6.1 6.1a.527.527 0 1 1-.746-.746l6.1-6.1-6.1-6.1a.527.527 0 0 1 .746-.746l6.1 6.1 6.1-6.1a.527.527 0 0 1 .746.746z"></path></svg>'},921:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" fill-rule="evenodd" d="M8.027.516A.52.52 0 0 0 7.5 0a.52.52 0 0 0-.527.516v9.508L4.4 7.527a.535.535 0 0 0-.746 0 .51.51 0 0 0 0 .73L7.5 12l3.846-3.743a.51.51 0 0 0 0-.73.535.535 0 0 0-.746 0l-2.573 2.497zM1 8v7h13V8h1v8H0V8z" clip-rule="evenodd"></path></svg>'},662:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" d="M7.5 0a.5.5 0 0 0-.5.5V7H.5a.5.5 0 0 0 0 1H7v6.5a.5.5 0 0 0 1 0V8h6.5a.5.5 0 0 0 0-1H8V.5a.5.5 0 0 0-.5-.5"></path></svg>'},44:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" d="M6 6.5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0zM9.5 6a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5"></path><path fill="#000" fill-rule="evenodd" d="M11 0H5a1 1 0 0 0-1 1v2H.5a.5.5 0 0 0 0 1h1.6l.81 11.1a1 1 0 0 0 .995.9h8.19a1 1 0 0 0 .995-.9L13.9 4h1.6a.5.5 0 0 0 0-1H12V1a1 1 0 0 0-1-1m0 3V1H5v2zm1.895 1h-9.79l.8 11h8.19z" clip-rule="evenodd"></path></svg>'},508:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="#000" d="M8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2M6.5 7.5A.5.5 0 0 1 7 7h1.5v4.5h1a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1h1V8H7a.5.5 0 0 1-.5-.5"></path><path fill="#000" fill-rule="evenodd" d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16m0-1A7 7 0 1 0 8 1a7 7 0 0 0 0 14" clip-rule="evenodd"></path></svg>'},686:e=>{"use strict";e.exports=d},244:e=>{"use strict";e.exports=i},972:e=>{"use strict";e.exports=n},108:e=>{"use strict";e.exports=l},321:e=>{"use strict";e.exports=s},470:e=>{"use strict";e.exports=o},298:e=>{"use strict";e.exports=a},640:e=>{"use strict";e.exports=r}},t={};function c(i){var s=t[i];if(void 0!==s)return s.exports;var a=t[i]={exports:{}};return e[i](a,a.exports,c),a.exports}c.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return c.d(t,{a:t}),t},c.d=(e,t)=>{for(var i in t)c.o(t,i)&&!c.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:t[i]})},c.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),c.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.p="";var p={};return c.p=window.jimuConfig.baseUrl,(()=>{"use strict";c.r(p),c.d(p,{__set_webpack_public_path__:()=>pe,default:()=>ce});var e,t,i,s,a,o=c(244),r=c(321),n=c(298),l=c(470);!function(e){e.Attribute="ATTRIBUTE",e.Geometry="GEOMETRY"}(e||(e={})),function(e){e.Webmap="WEBMAP",e.Custom="CUSTOM"}(t||(t={})),function(e){e.Added="Added",e.Updated="Updated",e.Deleted="Deleted"}(i||(i={})),function(e){e.NoMap="NOMAP",e.NoLayer="NOEDITABLE"}(s||(s={})),function(e){e.Prescriptive="PRESCRIPTIVE",e.Flexible="FLEXIBLE"}(a||(a={}));const d={newEdit:"New editable source",newEditGeo:"New editable layer",newEditTips:"Support selected features view only",newMapEditTips:"Add layers from the map",attrMode:"Attribute only",geoMode:"Geometry and attribute",layerConfig:"Layer configuration",capability:"Capability",addRecords:"Add records",deleteRecords:"Delete records",updateRecords:"Update records",snappingSettings:"Snapping settings",selfSnapping:"Geometry guides",featureSnapping:"Feature to feature",configFields:"Configure fields",configFieldsTip:"Select fields to show",importAll:"Import all",addGroup:"Add a group",group:"Group",checkAll:"Check all",uncheckAll:"Uncheck all",removeGroupConfirmTitle:"Are you sure you want to remove the group?",removeGroupConfirmTips:"The fields included in the group will also be removed.",noDataMessage:"No data message",noDeataMessageDefaultText:"No valid record is selected, select one or add one.",editBlankStatus:'Click the "{EditString}" button to add and configure {ModeString}',editableSource:"editable data sources",editableLayer:"editable layers",changeModeConfirmTitle:"Are you sure you want to switch the mode?",changeModeConfirmTips:"You will lose the settings configured.",editable:"Editable",editFieldDescription:"Please input the description.",editableCount:"{count} Editable",layerHonorSetting:"Use webmap settings",layerCustomize:"Customize",noLayerTips:"The Map does not contain any editable data.",noMapTips:"Please establish a connection with a Map widget.",defaultEnabled:"Enable by default",chooseDefault:"Choose default snapping layers",uneditableTips:"The layer is in a read-only state.",prescriptiveMode:"Prescriptive mode",flexibleMode:"Flexible mode",templateFilter:"Template filter",relatedRecords:"Related records",runtimeDataEditing:"Runtime data editing",viewsSection:"Views",enableViews:"View-based permissions",viewsDescription:"Create permission views, then assign portal groups and editable fields.",viewsEmptyTitle:"No permission views yet",viewsEmptyDescription:"Add a view to define who can edit each field.",addView:"Add view",viewDefaultName:"View",viewDetailsSection:"View details",viewNameLabel:"View name",editViewTitle:"Edit permission view: {name}",viewAccessSummary:"{groups, plural, one {# Group} other {# Groups}} | {fields, plural, one {# Field} other {# Fields}}",deleteView:"Delete view",deleteViewConfirmTitle:"Are you sure you want to delete this view?",deleteViewConfirmTips:"Members of its portal groups will lose the field edit permissions granted by this view.",portalGroupsLabel:"Who can edit",portalGroupsHelp:"Members of any selected portal group receive this view's field permissions.",selectedGroupsLabel:"Selected groups",groupSelectedCount:"{count} selected",groupSourceLabel:"Group source",myGroupsScope:"My groups",organizationGroupsScope:"Organization groups",myGroupsScopeHelp:"Groups you own or belong to. Ownership is not required.",organizationGroupsScopeHelp:"Groups in your organization that your account can access. Runtime access is granted only to group members.",addPortalGroup:"Add portal groups",searchGroupsPlaceholder:"Search groups by name\u2026",searchingGroups:"Searching groups\u2026",loadMoreGroups:"Load more groups",groupSearchResults:"Portal group search results",groupAdded:"Added",groupSelected:"Selected",selectNamedGroup:"Select {name}",groupOwnerBadge:"Owner",groupMemberBadge:"Member",groupOrganizationBadge:"Organization",groupsPendingCount:"{count, plural, one {# group selected} other {# groups selected}}",addSelectedGroups:"Add selected ({count})",noGroupsEmptyTitle:"No groups selected",noGroupsEmptyDescription:"Search below and add at least 1 group to grant these edit permissions.",noGroupsFound:"No groups found.",groupsLoadError:"Unable to load portal groups.",removeGroup:"Remove group",editableFieldsLabel:"Editable fields",noFieldsWarning:"This view has no editable fields, so its group members cannot edit any field.",groupsCount:"{count, plural, one {# group} other {# groups}}",fieldsCount:"{count, plural, one {# field} other {# fields}}",layersNoEditable:"No view grants edit rights for fields of these layers: {layers}.",webmapLayerNote:"This layer uses the webmap form settings, so views do not restrict its fields."};var u=c(640),h=c(556),m=c.n(h),g=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const f=e=>{const t=window.SVG,{className:i}=e,s=g(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:m()},s)):o.React.createElement("svg",Object.assign({className:a},s))};var v=c(44),y=c.n(v),b=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const w=e=>{const t=window.SVG,{className:i}=e,s=b(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:y()},s)):o.React.createElement("svg",Object.assign({className:a},s))};var S=c(508),x=c.n(S),j=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const C=e=>{const t=window.SVG,{className:i}=e,s=j(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:x()},s)):o.React.createElement("svg",Object.assign({className:a},s))},M=["CreationDate","Creator","EditDate","Editor","GlobalID"];var O=c(972);const T="root item for tree data entry";class N extends o.React.PureComponent{constructor(e){super(e),this.supportedDsTypes=(0,o.Immutable)([o.AllDataSourceTypes.FeatureLayer,o.AllDataSourceTypes.SceneLayer,o.AllDataSourceTypes.OrientedImageryLayer]),this.nameChange=e=>{const t=e.target.value;this.setState({itemLabel:t})},this.nameAccept=e=>{(e=""===(e=null==e?void 0:e.trim())?this.props.name:e)!==this.state.itemLabel&&this.setState({itemLabel:e}),this.props.optionChange("name",e)},this.getUncheckState=(e=[])=>e.some((e=>!e.editAuthority&&e.editable)),this.getIndeterminate=(e=[])=>{const t=e.some((e=>e.editAuthority&&e.editable)),i=e.some((e=>!e.editAuthority&&e.editable));return t&&i},this.onLayerModeChange=e=>{this.props.optionChange("layerHonorMode",e)},this.handleSwitchChange=(e,t)=>{const i=e.currentTarget;i&&this.props.optionChange(t,i.checked)},this.handleUpdateRecordsChange=(e,t)=>{const i=e.currentTarget;if(!i)return;const s=i.checked;this.props.multiOptionsChange({updateRecords:s,updateAttributes:s,updateGeometries:t&&s})},this.handleUpdateAttrOrGeoChange=(e,t)=>{const i=e.currentTarget;if(!i)return;const s=i.checked,{updateAttributes:a,updateGeometries:o}=this.props;"updateAttributes"===t&&!s&&!o||"updateGeometries"===t&&!s&&!a?this.props.multiOptionsChange({updateRecords:!1,updateAttributes:!1,updateGeometries:!1}):this.props.optionChange(t,s)},this.findEditingIndex=e=>{const{groupedFields:t}=this.props;let i;return t.forEach(((t,s)=>{if(t.jimuName===e)i=[s];else if(null==t?void 0:t.children){const a=t.children.findIndex((t=>t.jimuName===e));a>-1&&(i=[s,a])}})),i},this.handleTreeBoxChange=e=>{const t=e.currentTarget;if(!t)return;const{groupedFields:i}=this.props,s=this.findEditingIndex(t.id);if(2===s.length){const[e,a]=s;i[e][a].editAuthority=t.checked}else if(1===s.length){const[e]=s;i[e].editAuthority=t.checked}this.props.optionChange("groupedFields",i);const a=this.constructTreeItem(i);this.setState({rootItemJson:a})},this.handleTreeDescChange=(e,t)=>{const{groupedFields:i}=this.props,s=this.findEditingIndex(e);if(2===s.length){const[e,a]=s;i[e].children[a].subDescription=t}else if(1===s.length){const[e]=s;i[e].subDescription=t}this.props.optionChange("groupedFields",i);const a=this.constructTreeItem(i);this.setState({rootItemJson:a,isOpenDetailPopper:!1})},this.formatMessage=(e,t)=>{const i=Object.assign({},d,r.defaultMessages);return this.props.intl.formatMessage({id:e,defaultMessage:i[e]},t)},this.minusArray=(e,t,i)=>{const s=i||"jimuName",a=e.length>t.length,o=a?t:e;return(a?e:t).filter((e=>!o.some((t=>(null==t?void 0:t[s])===(null==e?void 0:e[s])))))},this.onFieldChange=e=>{if(!e)return;const{dataSource:t}=this.state,{showFields:i,groupedFields:s}=this.props,a=e.filter((e=>e));if(0===e.length)s.length=0;else{const a=this.minusArray(e,i),o=null==a?void 0:a[0];let r;if(s.forEach(((e,t)=>{if(null==e?void 0:e.children){const i=e.children.findIndex((e=>e.jimuName===(null==o?void 0:o.jimuName)));i>-1&&(r=[t,i])}else e.jimuName===(null==o?void 0:o.jimuName)&&(r=[t])})),r){if(2===r.length){const[e,t]=r;s[e].children.splice(t,1)}else if(1===r.length){const[e]=r;s.splice(e,1)}}else{const e=null==t?void 0:t.getLayerDefinition(),i=((null==e?void 0:e.fields)||[]).find((e=>e.name===o.jimuName)),a=null==i?void 0:i.editable;s.push(Object.assign(Object.assign({},o),{editAuthority:a,subDescription:(null==o?void 0:o.description)||"",editable:a}))}}this.props.multiOptionsChange({showFields:a,groupedFields:s});const o=this.constructTreeItem(s),r=this.getUncheckState(s),n=this.getIndeterminate(s);this.setState({rootItemJson:o,hasUncheck:r,indeterminate:n})},this.onDataSourceCreated=e=>{this.setState({dataSource:e},(()=>{const{groupedFields:e}=this.props,t=this.constructTreeItem(e);this.setState({rootItemJson:t})}))},this.getFieldsFromDatasource=()=>{const{useDataSource:e}=this.props,t=o.DataSourceManager.getInstance().getDataSource(null==e?void 0:e.dataSourceId),i=null==t?void 0:t.getSchema();return(null==i?void 0:i.fields)?Object.values(null==i?void 0:i.fields):[]},this.checkFieldsExist=(e,t)=>{let i=!1;for(const s of e)if(s.jimuName===t.jimuName){i=!0;break}return i},this.getSelectorFields=e=>{const t=[];return e&&e.length>0&&e.forEach((e=>{t.push(e.jimuName)})),t},this.handleTreeBoxAll=e=>{const{groupedFields:t}=this.props,i=t.map((t=>(null==t?void 0:t.children)?Object.assign(Object.assign({},t),{editAuthority:e,children:t.children.map((t=>Object.assign(Object.assign({},t),t.editable?{editAuthority:e}:{})))}):Object.assign(Object.assign({},t),t.editable?{editAuthority:e}:{})));this.props.optionChange("groupedFields",i);const s=this.constructTreeItem(i);this.setState({rootItemJson:s,hasUncheck:!e,indeterminate:!1})},this.addGroupForFields=()=>{this.setState({groupUpdating:!0},(()=>{setTimeout((()=>{this.setState({groupUpdating:!1})}),1e3)}));const{groupedFields:e}=this.props,t=this.getGroupMaxId(e)+1,i={jimuName:`${this.formatMessage("group")}-${t}`,name:`${this.formatMessage("group")}-${t}`,alias:`${this.formatMessage("group")}-${t}`,subDescription:"",editAuthority:!1,editable:!0,children:[],groupKey:t};e.unshift(i),this.props.optionChange("groupedFields",e);const s=this.constructTreeItem(e);this.setState({rootItemJson:s})},this.removeGroup=e=>{var t;const{curEditField:i}=this.state,{groupedFields:s}=this.props,a=s.findIndex((t=>t.jimuName===e));s.splice(a,1,...null===(t=s[a])||void 0===t?void 0:t.children),this.props.optionChange("groupedFields",s);const o=this.constructTreeItem(s);this.setState({rootItemJson:o}),(null==i?void 0:i.jimuName)===e&&this.setState({isOpenDetailPopper:!1})},this.constructTreeItem=(e=[])=>{const{theme:t,layerEditingEnabled:i}=this.props,s=this.getFieldsFromDatasource(),a=e=>Array.from(e).map(((e,r)=>Object.assign({itemKey:`${o.utils.getUUID()}_${r}`,itemStateChecked:!!i&&(null==e?void 0:e.editAuthority),itemStateTitle:e.alias||e.jimuName||e.name,itemStateIcon:l.dataComponentsUtils.getIconFromFieldType(e.type,t),itemStateDetailContent:e,itemStateDisabled:!(null==e?void 0:e.groupKey)&&!this.checkFieldsExist(s,e),itemStateCommands:[],isCheckboxDisabled:!i||!e.editable},e.children?{itemChildren:a(e.children)}:{}))),r=a(e);return{itemKey:T,itemStateTitle:T,itemChildren:r}},this.setRootItemJson=e=>{this.setState({rootItemJson:e})},this.showDetailPopper=(e,t)=>{const{isOpenDetailPopper:i}=this.state;this.setState({isOpenDetailPopper:!i,popperRef:e,curEditField:t})},this.getCurrentEditField=e=>{const{groupedFields:t}=this.props,i=this.findEditingIndex(e);let s={jimuName:"",groupKey:"",editAuthority:!1,children:[],subDescription:"",description:"",name:""};if(2===(null==i?void 0:i.length)){const[e,a]=i;s=t[e].children[a]}else if(1===(null==i?void 0:i.length)){const[e]=i;s=t[e]}return s},this.state={dataSource:void 0,rootItemJson:this.constructTreeItem(e.groupedFields),itemLabel:e.name||"",hasUncheck:this.getUncheckState(e.groupedFields),indeterminate:this.getIndeterminate(e.groupedFields),isOpenDetailPopper:!1,popperRef:void 0,curEditField:void 0,groupUpdating:!1},this.colRef=o.React.createRef()}componentDidUpdate(e,t){this.props.name!==e.name&&this.setState({itemLabel:this.props.name||""}),this.props.id!==e.id&&this.setState({rootItemJson:this.constructTreeItem(this.props.groupedFields)})}getGroupMaxId(e=[]){const t=[];return e.forEach((e=>{(null==e?void 0:e.groupKey)&&t.push(null==e?void 0:e.groupKey)})),t.length>0?Math.max.apply(null,t):0}getStyle(e){return o.css`
      .layer-config-panel {
        .panel-inner {
          .title {
            max-width: 70%;
          }
        }
        .setting-container {
          height: calc(100% - ${o.polished.rem(58)});
          overflow: auto;
          .layer-mode {
            .layer-mode-item {
              display: flex;
              margin-bottom: 8px;
            }
          }
          .fields-list-header {
            background: ${e.ref.palette.neutral[300]};
            border-bottom: 1px solid ${e.ref.palette.neutral[600]};
            height: 34px;
            width: 100%;
            flex-wrap: nowrap;
            .jimu-checkbox {
              margin-top: 2px;
            }
          }
          .selected-fields-con{
            margin-top: 0;
            .selected-fields-list {
              flex: 1;
              max-height: 300px;
              overflow-y: auto;
            }
            .jimu-tree-item{
              background: ${e.ref.palette.neutral[300]};
              border-bottom: 1px solid ${e.ref.palette.neutral[400]};
              .jimu-tree-item__content{
                div:first-of-type{
                  padding-left: 2px;
                }
                .jimu-tree-item__body{
                  background: ${e.ref.palette.neutral[300]};
                  .jimu-tree-item__title{
                    .jimu-input{
                      width: 125px;
                    }
                  }
                }
              }
            }
          }
          .table-options {
            .table-options-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .select-option {
              margin-bottom: 8px;
            }
          }
          .ds-container {
            position: absolute;
            display: none;
          }
          .component-field-selector {
            .search-input {
              width: 100%;
            }
            .field-list {
              max-height: 300px;
            }
          }
          .config-word-break {
            word-wrap: break-word;
          }
          .capability-item{
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .disabled-label{
            color: ${e.ref.palette.neutral[700]};
          }
        }
      }
    `}render(){var i;const{onClose:s,optionChange:a,dataSourceChange:d,filterDs:c,id:p,useDataSource:h,theme:m,showFields:g,editorConfig:v,addRecords:y,deleteRecords:b,updateRecords:S,updateAttributes:x,updateGeometries:j,groupedFields:N,layerHonorMode:I,layerEditingEnabled:D}=this.props,{rootItemJson:k,itemLabel:A,dataSource:L,hasUncheck:E,indeterminate:R,isOpenDetailPopper:$,popperRef:F,curEditField:P,groupUpdating:V}=this.state,G=v.editMode===e.Geometry,z=this.getSelectorFields(g),H=L||o.DataSourceManager.getInstance().getDataSource(p),U=null==H?void 0:H.getLayerDefinition(),B=null==U?void 0:U.allowGeometryUpdates,J=(null==U?void 0:U.type)===o.SupportedLayerServiceTypes.Table,_=(e,t)=>!!e&&(Array.isArray(e)?null==e?void 0:e.join().toLowerCase().includes(t):null==e?void 0:e.toLowerCase().includes(t)),W=null==U?void 0:U.capabilities,K=_(W,"create"),q=_(W,"update"),Q=_(W,"delete"),Y={overrideItemBlockInfo:({itemBlockInfo:e},t)=>({name:u.TreeItemActionType.RenderOverrideItem,children:[{name:u.TreeItemActionType.RenderOverrideItemDroppableContainer,children:[{name:u.TreeItemActionType.RenderOverrideItemContent,children:[{name:u.TreeItemActionType.RenderOverrideItemBody,children:[{name:u.TreeItemActionType.RenderOverrideItemMainLine,children:[{name:u.TreeItemActionType.RenderOverrideItemDraggableContainer,children:[{name:u.TreeItemActionType.RenderOverrideItemDragHandle},{name:u.TreeItemActionType.RenderOverrideItemChildrenToggle},{name:u.TreeItemActionType.RenderOverrideItemIcon},{name:u.TreeItemActionType.RenderOverrideItemTitle},{name:u.TreeItemActionType.RenderOverrideItemCommands},{name:u.TreeItemActionType.RenderOverrideItemDetailToggle}]}]},{name:u.TreeItemActionType.RenderOverrideItemDetailLine}]}]}]},{name:u.TreeItemActionType.RenderOverrideItemSubitems}]})};let X=0;null==N||N.forEach((e=>{(null==e?void 0:e.children)?null==e||e.children.forEach((e=>{(null==e?void 0:e.editAuthority)&&X++})):(null==e?void 0:e.editAuthority)&&X++}));const Z=!!(null===(i=null==H?void 0:H.getRootDataSource())||void 0===i?void 0:i.map);return(0,o.jsx)("div",{className:"w-100 h-100",css:this.getStyle(m)},(0,o.jsx)("div",{className:"w-100 h-100 layer-config-panel"},(0,o.jsx)("div",{className:"w-100 d-flex px-4 py-0"},(0,o.jsx)(r.PanelHeader,{level:1,className:"py-4 panel-inner",showClose:!!s,onClose:s,title:this.formatMessage("layerConfig")})),(0,o.jsx)("div",{className:"setting-container"},(0,o.jsx)(n.SettingSection,{title:this.formatMessage("data"),className:"pt-0"},(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(l.DataSourceSelector,{types:this.supportedDsTypes,hideDataView:!0,disableRemove:()=>!0,useDataSources:h?(0,o.Immutable)([h]):(0,o.Immutable)([]),mustUseDataSource:!0,onChange:d,closeDataSourceListOnChange:!0,hideDs:c,hideTabs:(0,o.Immutable)(["OUTPUT"])}))),h&&(0,o.jsx)(O.Fragment,null,(0,o.jsx)(n.SettingSection,{title:this.formatMessage("label")},(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.TextInput,{size:"sm",type:"text",className:"w-100",value:A,onChange:this.nameChange,onAcceptValue:this.nameAccept,"aria-label":this.formatMessage("label")}))),(0,o.jsx)(n.SettingSection,{title:this.formatMessage("capability")},D?(0,o.jsx)(O.Fragment,null,(!G&&J||G)&&(0,o.jsx)("div",{className:"capability-item",key:"addRecords"},(0,o.jsx)("span",{className:"text-break",style:{width:"80%"}},this.formatMessage("addRecords")),(0,o.jsx)(r.Switch,{"aria-label":this.formatMessage("addRecords"),className:"can-x-switch",checked:y,onChange:e=>{this.handleSwitchChange(e,"addRecords")},disabled:!K})),(0,o.jsx)("div",{className:"capability-item",key:"deleteRecords"},(0,o.jsx)("span",{className:"text-break",style:{width:"80%"}},this.formatMessage("deleteRecords")),(0,o.jsx)(r.Switch,{"aria-label":this.formatMessage("deleteRecords"),className:"can-x-switch",checked:b,onChange:e=>{this.handleSwitchChange(e,"deleteRecords")},disabled:!Q})),(0,o.jsx)("div",{className:"capability-item",key:"updateRecords"},(0,o.jsx)("span",{className:"text-break",style:{width:"80%"}},this.formatMessage("updateRecords")),(0,o.jsx)(r.Switch,{"aria-label":this.formatMessage("updateRecords"),className:"can-x-switch",checked:S,onChange:e=>{this.handleUpdateRecordsChange(e,B)},disabled:!q})),G&&S&&(0,o.jsx)("div",{className:"ml-4"},(0,o.jsx)(r.Label,{className:"w-100 d-flex"},(0,o.jsx)(r.Checkbox,{style:{cursor:"pointer",marginTop:"2px"},checked:x,"aria-label":this.formatMessage("attribute"),onChange:e=>{this.handleUpdateAttrOrGeoChange(e,"updateAttributes")}}),(0,o.jsx)("div",{className:"m-0 ml-2 flex-grow-1 omit-label"},this.formatMessage("attribute"))),(0,o.jsx)(r.Label,{className:"w-100 d-flex"},(0,o.jsx)(r.Checkbox,{style:{cursor:"pointer",marginTop:"2px"},checked:j,"aria-label":this.formatMessage("geometry"),onChange:e=>{this.handleUpdateAttrOrGeoChange(e,"updateGeometries")},disabled:!B}),(0,o.jsx)("div",{className:`m-0 ml-2 flex-grow-1 omit-label ${!B&&"disabled-label"}`},this.formatMessage("geometry"))))):this.formatMessage("uneditableTips")),(0,o.jsx)(n.SettingSection,{title:this.formatMessage("configFields")},Z&&(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.Select,{size:"sm",className:"w-100",value:I,onChange:e=>{a("layerHonorMode",e.target.value)}},(0,o.jsx)("option",{value:t.Webmap},this.formatMessage("layerHonorSetting")),(0,o.jsx)("option",{value:t.Custom},this.formatMessage("layerCustomize")))),I===t.Custom&&(0,o.jsx)(O.Fragment,null,(0,o.jsx)(n.SettingRow,{flow:"wrap",label:this.formatMessage("configFieldsTip")},(0,o.jsx)(l.FieldSelector,{useDataSources:h?(0,o.Immutable)([h]):(0,o.Immutable)([]),onChange:this.onFieldChange,selectedFields:(0,o.Immutable)(z),isMultiple:!0,isDataSourceDropDownHidden:!0,useDropdown:!0,useMultiDropdownBottomTools:!0,hiddenFields:(0,o.Immutable)(M)})),(0,o.jsx)(n.SettingRow,{flow:"wrap",label:D&&this.formatMessage("editableCount",{count:X})},(0,o.jsx)("div",{className:"fields-list-header form-inline"},(0,o.jsx)("div",{className:"d-flex w-100 ml-5 fields-list-check"},D&&(0,o.jsx)(r.Checkbox,{id:"editAll","data-field":"editAll",onClick:()=>{this.handleTreeBoxAll(E)},checked:!E,indeterminate:R,title:E?`${this.formatMessage("editable")} (${this.formatMessage("checkAll")})`:`${this.formatMessage("editable")} (${this.formatMessage("uncheckAll")})`}),(0,o.jsx)(r.Label,{for:"editAll",style:{cursor:"pointer"},className:"ml-2",title:this.formatMessage("field")},this.formatMessage("field"))),(0,o.jsx)(r.Button,{icon:!0,size:"sm",type:"tertiary",onClick:this.addGroupForFields,title:this.formatMessage("addGroup"),"aria-label":this.formatMessage("addGroup"),disabled:V},(0,o.jsx)(f,null)))),(0,o.jsx)(n.SettingRow,{className:"selected-fields-con"},(0,o.jsx)(u.Tree,Object.assign({className:"selected-fields-list",rootItemJson:k,treeAlignmentType:u.TreeAlignmentType.Intact,dndEnabled:!0,checkboxLinkage:D,collapseStyle:u.TreeCollapseStyle.Arrow,renderOverrideItemCommands:(e,t)=>{const{itemJsons:i}=t.props,[s]=i,{jimuName:a}=null==s?void 0:s.itemStateDetailContent,n=this.getCurrentEditField(a),{jimuName:l,groupKey:d}=n;return d?(0,o.jsx)(r.Button,{icon:!0,size:"sm",type:"tertiary",onClick:e=>{null==e||e.stopPropagation(),this.removeGroup(l)},onKeyUp:e=>{" "!==e.key&&"Enter"!==e.key||this.removeGroup(l)},title:this.formatMessage("remove"),"aria-label":this.formatMessage("remove")},(0,o.jsx)(w,null)):""},renderOverrideItemDetailToggle:(e,t)=>{const{itemJsons:i,itemJsons:[{itemStateDetailVisible:s,itemStateDetailContent:a,itemStateDisabled:n}]}=t.props,[l]=i,{jimuName:d}=null==l?void 0:l.itemStateDetailContent,c=this.getCurrentEditField(d);return a?(0,o.jsx)(r.Button,{icon:!0,type:"tertiary",title:this.formatMessage("description"),"aria-label":this.formatMessage("description"),disabled:!!n,"aria-expanded":!!s,className:"jimu-tree-item__detail-toggle",onClick:e=>{e.stopPropagation(),this.showDetailPopper(t.dragRef,c)},onKeyUp:e=>{" "!==e.key&&"Enter"!==e.key||(e.stopPropagation(),this.showDetailPopper(t.dragRef,c))},css:()=>o.css`
                                &.jimu-tree-item__detail-toggle {
                                  display: flex;
                                  align-items: center;
                                  cursor: pointer;

                                  .icon-btn-sizer {
                                    margin: 0;
                                    min-width: 0.5rem;
                                    min-height: 0.5rem;
                                  }
                                }
                              `},(0,o.jsx)(C,{autoFlip:!s})):null},isItemDroppable:(e,t)=>{var i,s,a,o;const{draggingItemJsons:r,targetItemJsons:n}=e,l=(null===(i=n[1])||void 0===i?void 0:i.itemKey)!==T&&!!(null===(s=n[1])||void 0===s?void 0:s.itemChildren);return!(!(null===(a=n[0])||void 0===a?void 0:a.itemChildren)||(null===(o=r[0])||void 0===o?void 0:o.itemChildren)||l)},isFolder:(e,t)=>{const{targetItemJsons:i}=e,[s]=i,{groupKey:a}=null==s?void 0:s.itemStateDetailContent;return!!a},onUpdateItem:(e,t)=>{var i;const{itemJsons:s,updateType:o}=e,r=s[s.length-1],[n]=s,{jimuName:l}=null==n?void 0:n.itemStateDetailContent,d=this.getCurrentEditField(l),{groupKey:c}=d;if(!c&&o===u.TreeItemActionType.HandleStartEditing)return;const p=null===(i=r.itemChildren)||void 0===i?void 0:i.map(((e,t)=>{var i,s,a,o,n;return(null==e?void 0:e.itemChildren)?(e.itemStateTitle||(r.itemChildren[t].itemStateTitle=null===(i=e.itemStateDetailContent)||void 0===i?void 0:i.jimuName),Object.assign(Object.assign(Object.assign(Object.assign({},e.itemStateDetailContent),{children:e.itemChildren.map((e=>Object.assign(Object.assign({},e.itemStateDetailContent),{editAuthority:e.itemStateChecked})))}),e.itemStateTitle?{name:e.itemStateTitle,alias:e.itemStateTitle}:{name:null===(s=e.itemStateDetailContent)||void 0===s?void 0:s.jimuName,alias:null===(a=e.itemStateDetailContent)||void 0===a?void 0:a.jimuName}),{editAuthority:(null===(o=e.itemChildren)||void 0===o?void 0:o.length)>0&&!(null===(n=e.itemChildren)||void 0===n?void 0:n.some((e=>!1===e.isCheckboxDisabled&&!1===e.itemStateChecked)))})):Object.assign(Object.assign({},e.itemStateDetailContent),{editAuthority:e.itemStateChecked})}));a("groupedFields",p);const h=this.getUncheckState(p),m=this.getIndeterminate(p);this.setState({rootItemJson:r,hasUncheck:h,indeterminate:m})}},Y)),(0,o.jsx)(r.Popper,{placement:"bottom-start",disableResize:!0,reference:F,offset:[-27,3],open:$,showArrow:!1,toggle:e=>{this.setState({isOpenDetailPopper:!$})}},(0,o.jsx)("div",{style:{width:228,height:132},className:"p-4"},(0,o.jsx)(r.TextArea,{ref:e=>{this.popperTextRef=e},id:null==P?void 0:P.jimuName,className:"w-100",height:60,placeholder:this.formatMessage("editFieldDescription"),defaultValue:(null==P?void 0:P.subDescription)||(null==P?void 0:P.description)}),(0,o.jsx)("div",{className:"mt-4 float-right"},(0,o.jsx)(r.Button,{size:"sm",type:"primary",onClick:()=>{this.handleTreeDescChange(null==P?void 0:P.jimuName,this.popperTextRef.value)}},this.formatMessage("commonModalOk")),(0,o.jsx)(r.Button,{size:"sm",className:"ml-1",onClick:()=>{this.setState({isOpenDetailPopper:!1})}},this.formatMessage("commonModalCancel")))))))),(0,o.jsx)("div",{className:"ds-container"},(0,o.jsx)(o.DataSourceComponent,{useDataSource:(0,o.Immutable)(h),onDataSourceCreated:this.onDataSourceCreated}))))))}}var I=c(662),D=c.n(I),k=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const A=e=>{const t=window.SVG,{className:i}=e,s=k(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:D()},s)):o.React.createElement("svg",Object.assign({className:a},s))};var L=c(838),E=c.n(L),R=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const $=e=>{const t=window.SVG,{className:i}=e,s=R(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:E()},s)):o.React.createElement("svg",Object.assign({className:a},s))};var F=c(655),P=c.n(F),V=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const G=e=>{const t=window.SVG,{className:i}=e,s=V(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:P()},s)):o.React.createElement("svg",Object.assign({className:a},s))};var z=c(56),H=c.n(z),U=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const B=e=>{const t=window.SVG,{className:i}=e,s=U(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:H()},s)):o.React.createElement("svg",Object.assign({className:a},s))};var J=function(e,t,i,s){return new(i||(i=Promise))((function(a,o){function r(e){try{l(s.next(e))}catch(e){o(e)}}function n(e){try{l(s.throw(e))}catch(e){o(e)}}function l(e){var t;e.done?a(e.value):(t=e.value,t instanceof i?t:new i((function(e){e(t)}))).then(r,n)}l((s=s.apply(e,t||[])).next())}))};const _=Object.assign({},d,r.defaultMessages),W="root item for view field tree";class K extends o.React.PureComponent{constructor(e){super(e),this.viewListTrigger=o.React.createRef(),this.formatMessage=(e,t)=>this.props.intl.formatMessage({id:e,defaultMessage:_[e]},t),this.getStyle=()=>o.css`
      width: 100%;
      .view-manager-list {
        display: flex;
        flex-direction: column;
        gap: ${o.polished.rem(8)};
      }
      .view-list-item {
        display: flex;
        align-items: stretch;
        min-width: 0;
        border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.3));
        border-radius: ${o.polished.rem(4)};
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
          gap: ${o.polished.rem(9)};
          flex: 1;
          min-width: 0;
          padding: ${o.polished.rem(10)};
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
          width: ${o.polished.rem(30)};
          height: ${o.polished.rem(30)};
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
          font-size: ${o.polished.rem(13)};
          font-weight: 600;
          line-height: 1.35;
          text-align: start;
          text-overflow: ellipsis;
          unicode-bidi: plaintext;
          white-space: nowrap;
        }
        .view-list-summary {
          display: block;
          margin-top: ${o.polished.rem(2)};
          color: var(--sys-color-text-secondary, inherit);
          font-size: ${o.polished.rem(11)};
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
          margin-right: ${o.polished.rem(5)};
          opacity: 0.72;
          &:hover {
            color: var(--sys-color-error, #d83020);
            opacity: 1;
          }
        }
      }
      .view-list-empty {
        padding: ${o.polished.rem(14)} ${o.polished.rem(10)};
        border: 1px dashed var(--sys-color-divider, rgba(127, 127, 127, 0.35));
        border-radius: ${o.polished.rem(4)};
        text-align: center;
        .view-list-empty-icon {
          margin-bottom: ${o.polished.rem(6)};
          opacity: 0.6;
        }
        .view-list-empty-title {
          font-size: ${o.polished.rem(12)};
          font-weight: 600;
        }
        .view-list-empty-description {
          margin-top: ${o.polished.rem(3)};
          font-size: ${o.polished.rem(11)};
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
            padding: ${o.polished.rem(16)};
            border: 0;
            border-bottom: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
            border-radius: 0;
            background: transparent;
          }
        }
        .view-editor-section {
          padding: ${o.polished.rem(16)};
          border-bottom: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
        }
        .view-editor-section-title {
          margin-bottom: ${o.polished.rem(10)};
          font-size: ${o.polished.rem(13)};
          font-weight: 600;
        }
      }
        .view-manager-desc {
          font-size: ${o.polished.rem(12)};
          opacity: 0.75;
          margin-bottom: ${o.polished.rem(10)};
          line-height: 1.4;
        }
        .view-card {
          border: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.12));
          border-radius: ${o.polished.rem(6)};
          margin-bottom: ${o.polished.rem(10)};
          background: var(--sys-color-surface, rgba(255, 255, 255, 0.04));
          overflow: hidden;
          transition: border-color 0.2s;
          &:hover {
            border-color: var(--sys-color-primary, #007ac2);
          }
          .view-card-body {
            padding: ${o.polished.rem(10)};
            border-top: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.08));
          }
          .view-section-label {
            font-weight: 600;
            font-size: ${o.polished.rem(12)};
            margin: ${o.polished.rem(10)} 0 ${o.polished.rem(4)} 0;
            opacity: 0.9;
          }
          .group-access-panel {
            margin-top: ${o.polished.rem(10)};
            padding: ${o.polished.rem(10)};
            border: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.15));
            border-radius: ${o.polished.rem(6)};
            background: var(--sys-color-surface-paper, rgba(255, 255, 255, 0.06));
          }
          .group-access-header {
            display: flex;
            align-items: flex-start;
            gap: ${o.polished.rem(8)};
            .group-access-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: ${o.polished.rem(30)};
              height: ${o.polished.rem(30)};
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
              font-size: ${o.polished.rem(13)};
              font-weight: 600;
              line-height: 1.3;
            }
            .group-access-help {
              margin-top: ${o.polished.rem(2)};
              font-size: ${o.polished.rem(11)};
              line-height: 1.4;
              opacity: 0.72;
            }
            .group-selected-count {
              flex-shrink: 0;
              padding: ${o.polished.rem(2)} ${o.polished.rem(7)};
              border-radius: ${o.polished.rem(10)};
              background: var(--sys-color-surface, rgba(255, 255, 255, 0.1));
              font-size: ${o.polished.rem(11)};
              font-weight: 600;
              white-space: nowrap;
            }
          }
          .group-selected-label,
          .group-picker-label {
            display: block;
            margin-top: ${o.polished.rem(10)};
            margin-bottom: ${o.polished.rem(4)};
            font-size: ${o.polished.rem(11)};
            font-weight: 600;
          }
          .group-scope-selector {
            display: flex;
            width: 100%;
            margin-top: ${o.polished.rem(10)};
            border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.3));
            border-radius: ${o.polished.rem(4)};
            overflow: hidden;
            .group-scope-button {
              flex: 1;
              min-width: 0;
              min-height: ${o.polished.rem(32)};
              padding: ${o.polished.rem(5)} ${o.polished.rem(7)};
              border: 0;
              border-inline-end: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.3));
              background: transparent;
              color: inherit;
              font: inherit;
              font-size: ${o.polished.rem(11)};
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
            margin-top: ${o.polished.rem(5)};
            font-size: ${o.polished.rem(10)};
            line-height: 1.4;
            opacity: 0.7;
          }
          .group-empty-state {
            display: flex;
            align-items: flex-start;
            gap: ${o.polished.rem(8)};
            margin-top: ${o.polished.rem(10)};
            padding: ${o.polished.rem(9)};
            border: 1px dashed var(--sys-color-divider, rgba(255, 255, 255, 0.18));
            border-radius: ${o.polished.rem(5)};
            .group-empty-icon {
              flex-shrink: 0;
              margin-top: ${o.polished.rem(1)};
              opacity: 0.65;
            }
            .group-empty-title {
              font-size: ${o.polished.rem(12)};
              font-weight: 600;
            }
            .group-empty-description {
              margin-top: ${o.polished.rem(2)};
              font-size: ${o.polished.rem(11)};
              line-height: 1.4;
              opacity: 0.7;
            }
          }
          .group-chips {
            display: flex;
            flex-direction: column;
            gap: ${o.polished.rem(6)};
            margin: ${o.polished.rem(6)} 0;
          }
          .group-chip {
            display: flex;
            align-items: center;
            gap: ${o.polished.rem(6)};
            width: 100%;
            padding: ${o.polished.rem(6)} ${o.polished.rem(8)};
            border-radius: ${o.polished.rem(4)};
            background: var(--sys-color-surface-paper, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
            font-size: ${o.polished.rem(12)};
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
              width: ${o.polished.rem(22)};
              height: ${o.polished.rem(22)};
              min-height: ${o.polished.rem(22)};
              padding: 0;
              opacity: 0.7;
              &:hover {
                opacity: 1;
              }
            }
          }
          .group-search-results {
            border: 1px solid var(--sys-color-divider, rgba(255, 255, 255, 0.15));
            border-radius: ${o.polished.rem(4)};
            max-height: ${o.polished.rem(180)};
            overflow-y: auto;
            margin-top: ${o.polished.rem(4)};
            background: var(--sys-color-surface, rgba(127, 127, 127, 0.08));
            .group-search-item {
              display: flex;
              align-items: center;
              gap: ${o.polished.rem(8)};
              padding: ${o.polished.rem(6)} ${o.polished.rem(8)};
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
                font-size: ${o.polished.rem(12)};
              }
              .group-search-action {
                flex-shrink: 0;
                padding: ${o.polished.rem(1)} ${o.polished.rem(5)};
                border-radius: ${o.polished.rem(8)};
                background: var(--sys-color-surface-paper, rgba(127, 127, 127, 0.12));
                font-size: ${o.polished.rem(11)};
                font-weight: 600;
              }
            }
            .group-search-empty {
              padding: ${o.polished.rem(8)};
              font-size: ${o.polished.rem(12)};
              opacity: 0.6;
            }
          }
          .group-picker-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${o.polished.rem(8)};
            margin-top: ${o.polished.rem(7)};
            .group-selection-count {
              min-width: 0;
              font-size: ${o.polished.rem(11)};
              opacity: 0.75;
            }
          }
          .group-search-status {
            display: flex;
            align-items: center;
            gap: ${o.polished.rem(6)};
            min-height: ${o.polished.rem(24)};
            margin-top: ${o.polished.rem(4)};
            font-size: ${o.polished.rem(11)};
            opacity: 0.75;
          }
          .view-layer-block {
            margin-top: ${o.polished.rem(10)};
            border: 1px solid var(--sys-color-divider, rgba(127, 127, 127, 0.25));
            border-radius: ${o.polished.rem(4)};
            overflow: hidden;
            .view-layer-header {
              display: flex;
              align-items: center;
              gap: ${o.polished.rem(8)};
              padding: ${o.polished.rem(8)};
              background: var(--sys-color-surface-paper, rgba(127, 127, 127, 0.08));
            }
            .view-layer-title {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              font-size: ${o.polished.rem(12)};
              font-weight: 600;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .view-layer-count {
              flex-shrink: 0;
              font-size: ${o.polished.rem(10)};
              opacity: 0.68;
            }
            .view-layer-webmap-note {
              padding: ${o.polished.rem(8)};
              font-size: ${o.polished.rem(11)};
              font-style: italic;
              opacity: 0.6;
            }
            .view-field-tree {
              max-height: ${o.polished.rem(240)};
              overflow-y: auto;
              width: 100%;
              padding: ${o.polished.rem(4)};
              .tree-item {
                justify-content: space-between;
                align-items: center;
                font-size: ${o.polished.rem(12)};
              }
            }
          }
      }
    `,this.getMutableViews=()=>{const{views:e}=this.props;return e?e.asMutable?e.asMutable({deep:!0}):e:[]},this.updateViews=e=>{this.props.onViewsChange(e)},this.addView=e=>{const t=this.getMutableViews(),i={id:`view_${Date.now()}_${Math.floor(1e4*Math.random())}`,name:`${this.formatMessage("viewDefaultName")} ${t.length+1}`,groups:[],editableFields:{}};this.updateViews([...t,i]),this.setState({activeViewId:i.id,viewEditorFocusNode:e})},this.openViewEditor=(e,t)=>{this.setState({activeViewId:e,viewEditorFocusNode:t})},this.closeViewEditor=()=>{this.setState({activeViewId:""})},this.requestDeleteView=e=>{this.setState({deleteViewId:e})},this.confirmDeleteView=()=>{const{deleteViewId:e}=this.state;this.searchTimers[e]&&(clearTimeout(this.searchTimers[e]),delete this.searchTimers[e]),this.searchSeq[e]=(this.searchSeq[e]||0)+1;const t=this.getMutableViews().filter((t=>t.id!==e));this.updateViews(t),this.setState((t=>({deleteViewId:"",activeViewId:t.activeViewId===e?"":t.activeViewId})))},this.cancelDeleteView=()=>{this.setState({deleteViewId:""})},this.onNameDraftChange=(e,t)=>{this.setState((i=>({nameDrafts:Object.assign(Object.assign({},i.nameDrafts),{[e]:t})})))},this.commitName=e=>{var t;const i=this.getMutableViews().find((t=>t.id===e));if(!i)return;const s=(null!==(t=this.state.nameDrafts[e])&&void 0!==t?t:i.name).trim()||i.name;if(s!==i.name){const t=this.getMutableViews().map((t=>t.id===e?Object.assign(Object.assign({},t),{name:s}):t));this.updateViews(t)}this.setState((t=>({nameDrafts:Object.assign(Object.assign({},t.nameDrafts),{[e]:s})})))},this.onGroupQueryChange=(e,t)=>{this.setState((i=>({groupQuery:Object.assign(Object.assign({},i.groupQuery),{[e]:t}),groupResults:Object.assign(Object.assign({},i.groupResults),{[e]:[]}),groupNextStart:Object.assign(Object.assign({},i.groupNextStart),{[e]:-1}),groupSearching:Object.assign(Object.assign({},i.groupSearching),{[e]:!0}),groupLoadError:Object.assign(Object.assign({},i.groupLoadError),{[e]:!1})}))),this.searchTimers[e]&&clearTimeout(this.searchTimers[e]),this.searchTimers[e]=setTimeout((()=>{this.searchGroups(e,t)}),300)},this.onGroupScopeChange=(e,t)=>{var i,s;if((null!==(i=this.state.groupScope[e])&&void 0!==i?i:"my")===t)return;this.searchTimers[e]&&(clearTimeout(this.searchTimers[e]),delete this.searchTimers[e]);const a=null!==(s=this.state.groupQuery[e])&&void 0!==s?s:"";this.setState((i=>({groupScope:Object.assign(Object.assign({},i.groupScope),{[e]:t}),groupResults:Object.assign(Object.assign({},i.groupResults),{[e]:[]}),groupNextStart:Object.assign(Object.assign({},i.groupNextStart),{[e]:-1}),groupLoadError:Object.assign(Object.assign({},i.groupLoadError),{[e]:!1})})),(()=>{this.searchGroups(e,a,t)}))},this.getPortalContext=()=>{var e;const t=null===(e=(0,o.getAppStore)())||void 0===e?void 0:e.getState(),i=((null==t?void 0:t.portalUrl)||"https://www.arcgis.com").replace(/\/+$/,""),s=o.SessionManager.getInstance().getSessionByUrl(i);return{state:t,portalUrl:i,token:(null==s?void 0:s.token)||(null==t?void 0:t.token)}},this.getLegacyThumbnailName=e=>{if(!e)return"";try{const t=new URL(e).pathname.split("/info/")[1]||"";return decodeURIComponent(t.split("/").pop()||"")}catch(e){return""}},this.getGroupThumbnailUrl=e=>{const t=e.thumbnail||this.getLegacyThumbnailName(e.thumbnailUrl);if(!t)return"";const{portalUrl:i,token:s}=this.getPortalContext(),a=`${i}/sharing/rest/community/groups/${encodeURIComponent(e.id)}/info/${encodeURIComponent(t)}`;return s?`${a}?token=${encodeURIComponent(s)}`:a},this.searchGroups=(e,t,i,s)=>J(this,void 0,void 0,(function*(){var a,o,r,n;void 0===i&&(i=null!==(a=this.state.groupScope[e])&&void 0!==a?a:"my"),void 0===s&&(s=1);const l=(this.searchSeq[e]||0)+1;this.searchSeq[e]=l;const d=()=>this.searchSeq[e]!==l;this.setState((t=>({groupSearching:Object.assign(Object.assign({},t.groupSearching),{[e]:!0}),groupLoadError:Object.assign(Object.assign({},t.groupLoadError),{[e]:!1})})));try{const{state:a,portalUrl:l,token:c}=this.getPortalContext(),p=(null===(o=null==a?void 0:a.portalSelf)||void 0===o?void 0:o.id)||(null===(r=null==a?void 0:a.user)||void 0===r?void 0:r.orgId),u=(t||"").trim().replace(/[\\":+()\[\]{}^~*?]/g," "),h=u.split(/\s+/).filter((e=>!!e)).map((e=>`title:${e}*`)).join(" AND "),m=`${l}/sharing/rest/community/groups`,g=new URLSearchParams({num:"50",start:s.toString(),sortField:"title",sortOrder:"asc",f:"json"});if("my"===i)g.set("searchUserAccess","groupMember"),h&&g.set("q",h);else{const e=p?h?`orgid:${p} AND (${h})`:`orgid:${p}`:h||"*";g.set("q",e)}c&&g.set("token",c);const f=yield fetch(`${m}?${g.toString()}`);if(!f.ok)throw new Error(`HTTP ${f.status}`);const v=yield f.json();if(null==v?void 0:v.error)throw new Error(v.error.message||"Portal search failed");if(d())return;const y=((null===(n=null==a?void 0:a.user)||void 0===n?void 0:n.username)||"").toLowerCase(),b=((null==v?void 0:v.results)||[]).map((e=>{var t;const s=y&&(null===(t=e.owner)||void 0===t?void 0:t.toLowerCase())===y?"owner":"my"===i?"member":"organization";return{id:e.id,title:e.title,thumbnail:e.thumbnail||void 0,relationship:s}}));this.setState((t=>{var i,a;const o=s>1&&null!==(i=t.groupResults[e])&&void 0!==i?i:[],r=new Set(o.map((e=>e.id))),n=[...o,...b.filter((e=>!r.has(e.id)))];return{groupResults:Object.assign(Object.assign({},t.groupResults),{[e]:n}),groupNextStart:Object.assign(Object.assign({},t.groupNextStart),{[e]:null!==(a=null==v?void 0:v.nextStart)&&void 0!==a?a:-1}),groupSearching:Object.assign(Object.assign({},t.groupSearching),{[e]:!1})}}))}catch(t){if(console.error(t),d())return;this.setState((t=>({groupResults:1===s?Object.assign(Object.assign({},t.groupResults),{[e]:[]}):t.groupResults,groupNextStart:Object.assign(Object.assign({},t.groupNextStart),{[e]:-1}),groupSearching:Object.assign(Object.assign({},t.groupSearching),{[e]:!1}),groupLoadError:Object.assign(Object.assign({},t.groupLoadError),{[e]:!0})})))}})),this.toggleGroupSelection=(e,t,i)=>{this.setState((s=>{var a;const o=null!==(a=s.groupSelections[e])&&void 0!==a?a:[],r=i?o.some((e=>e.id===t.id))?o:[...o,t]:o.filter((e=>e.id!==t.id));return{groupSelections:Object.assign(Object.assign({},s.groupSelections),{[e]:r})}}))},this.addSelectedGroupsToView=e=>{var t;const i=null!==(t=this.state.groupSelections[e])&&void 0!==t?t:[];if(0===i.length)return;const s=this.getMutableViews().map((t=>{if(t.id!==e)return t;const s=new Set(t.groups.map((e=>e.id))),a=i.filter((e=>!s.has(e.id))).map((e=>({id:e.id,title:e.title,thumbnail:e.thumbnail})));return a.length>0?Object.assign(Object.assign({},t),{groups:[...t.groups,...a]}):t}));this.updateViews(s),this.searchTimers[e]&&(clearTimeout(this.searchTimers[e]),delete this.searchTimers[e]),this.searchSeq[e]=(this.searchSeq[e]||0)+1,this.setState((t=>({groupQuery:Object.assign(Object.assign({},t.groupQuery),{[e]:""}),groupResults:Object.assign(Object.assign({},t.groupResults),{[e]:[]}),groupNextStart:Object.assign(Object.assign({},t.groupNextStart),{[e]:-1}),groupSelections:Object.assign(Object.assign({},t.groupSelections),{[e]:[]}),groupSearching:Object.assign(Object.assign({},t.groupSearching),{[e]:!1})})))},this.removeGroupFromView=(e,t)=>{const i=this.getMutableViews().map((i=>i.id!==e?i:Object.assign(Object.assign({},i),{groups:i.groups.filter((e=>e.id!==t))})));this.updateViews(i)},this.toggleFieldForView=(e,t,i)=>{const s=this.getMutableViews().map((s=>s.id!==e?s:Object.assign(Object.assign({},s),{editableFields:Object.assign(Object.assign({},s.editableFields),{[t]:i})})));this.updateViews(s)},this.getLayerFieldSource=e=>{const t=e.groupedFields;if(null==t?void 0:t.asMutable)return t.asMutable({deep:!0});if(null==t?void 0:t.length)return t;const i=e.showFields;return(null==i?void 0:i.asMutable)?i.asMutable({deep:!0}):i||[]},this.buildFieldTree=(e,t)=>{const{theme:i}=this.props,s=this.getLayerFieldSource(e),a=e=>(e||[]).map(((e,s)=>{var o,r,n;const d=!!e.children,c=e.jimuName||e.name||`field_${s}`,p=d?void 0:t.includes(e.jimuName||e.name);return Object.assign({itemKey:d?`group_${null!==(r=null!==(o=e.groupKey)&&void 0!==o?o:e.name)&&void 0!==r?r:s}`:c,itemStateChecked:p,itemStateTitle:e.alias||e.jimuName||e.name,itemStateIcon:d?void 0:l.dataComponentsUtils.getIconFromFieldType(e.type,i),itemStateDetailContent:e,isCheckboxDisabled:!d&&!(null===(n=e.editable)||void 0===n||n),itemStateCommands:[]},d?{itemChildren:a(e.children)}:{})}));return{itemKey:W,itemStateTitle:W,itemChildren:a(s)}},this.collectCheckedFields=e=>{const t=[],i=e=>{(e||[]).forEach((e=>{var s,a,o;if(null===(s=e.itemChildren)||void 0===s?void 0:s.length)i(e.itemChildren);else if(e.itemStateChecked){const i=(null===(a=e.itemStateDetailContent)||void 0===a?void 0:a.jimuName)||(null===(o=e.itemStateDetailContent)||void 0===o?void 0:o.name)||e.itemKey;i&&i!==W&&t.push(i)}}))};return i(null==e?void 0:e.itemChildren),t},this.getFieldTreeActionMap=()=>({overrideItemBlockInfo:()=>({name:u.TreeItemActionType.RenderOverrideItem,children:[{name:u.TreeItemActionType.RenderOverrideItemDroppableContainer,children:[{name:u.TreeItemActionType.RenderOverrideItemContent,children:[{name:u.TreeItemActionType.RenderOverrideItemBody,children:[{name:u.TreeItemActionType.RenderOverrideItemMainLine,children:[{name:u.TreeItemActionType.RenderOverrideItemDraggableContainer,children:[{name:u.TreeItemActionType.RenderOverrideItemChildrenToggle},{name:u.TreeItemActionType.RenderOverrideItemIcon},{name:u.TreeItemActionType.RenderOverrideItemTitle}]}]}]}]},{name:u.TreeItemActionType.RenderOverrideItemSubitems}]}]})}),this.countViewFields=e=>{let t=0;const i=e.editableFields||{};return Object.keys(i).forEach((e=>{t+=(i[e]||[]).length})),t},this.getLayersWithNoEditableFields=()=>{const e=this.getMutableViews(),i=this.getMutableLayers(),s=[];return i.forEach((i=>{if(i.layerHonorMode===t.Webmap)return;const a=this.getLayerFieldSource(i);if(!(null==a?void 0:a.length))return;e.some((e=>{var t;return((null===(t=e.editableFields)||void 0===t?void 0:t[i.id])||[]).length>0}))||s.push(i.name)})),s},this.getMutableLayers=()=>{const{layersConfig:e}=this.props;return e?e.asMutable?e.asMutable({deep:!0}):e:[]},this.renderGroupChips=e=>(0,o.jsx)("div",{className:"group-chips"},e.groups.map((t=>{const i=this.getGroupThumbnailUrl(t);return(0,o.jsx)("span",{key:t.id,className:"group-chip"},i?(0,o.jsx)("img",{className:"group-chip-thumb",src:i,alt:"",width:24,height:24,onError:e=>{e.currentTarget.style.display="none"}}):(0,o.jsx)(B,{size:"s","aria-hidden":"true"}),(0,o.jsx)("span",{className:"group-chip-title",title:t.title},t.title),(0,o.jsx)(r.Button,{size:"sm",type:"tertiary",icon:!0,className:"group-chip-remove",title:this.formatMessage("removeGroup"),"aria-label":`${this.formatMessage("removeGroup")}: ${t.title}`,onClick:()=>{this.removeGroupFromView(e.id,t.id)}},(0,o.jsx)($,{size:"s"})))}))),this.getGroupRelationshipLabel=e=>{switch(e){case"owner":return this.formatMessage("groupOwnerBadge");case"member":return this.formatMessage("groupMemberBadge");default:return this.formatMessage("groupOrganizationBadge")}},this.renderGroupPicker=e=>{var t,i,s,a,n;const{groupQuery:l,groupScope:d,groupResults:c,groupNextStart:p,groupSelections:u,groupSearching:h,groupLoadError:m}=this.state,g=null!==(t=l[e.id])&&void 0!==t?t:"",f=null!==(i=d[e.id])&&void 0!==i?i:"my",v=null!==(s=c[e.id])&&void 0!==s?s:[],y=null!==(a=p[e.id])&&void 0!==a?a:-1,b=null!==(n=u[e.id])&&void 0!==n?n:[],w=!!h[e.id],S=!!m[e.id],x=`group-search-${e.id}`,j=`group-source-${e.id}`;return(0,o.jsx)(o.React.Fragment,null,(0,o.jsx)("div",{id:j,className:"group-picker-label"},this.formatMessage("groupSourceLabel")),(0,o.jsx)("div",{className:"group-scope-selector",role:"group","aria-labelledby":j},(0,o.jsx)("button",{type:"button",className:"group-scope-button","aria-pressed":"my"===f,onClick:()=>{this.onGroupScopeChange(e.id,"my")}},this.formatMessage("myGroupsScope")),(0,o.jsx)("button",{type:"button",className:"group-scope-button","aria-pressed":"organization"===f,onClick:()=>{this.onGroupScopeChange(e.id,"organization")}},this.formatMessage("organizationGroupsScope"))),(0,o.jsx)("div",{className:"group-scope-help"},this.formatMessage("my"===f?"myGroupsScopeHelp":"organizationGroupsScopeHelp")),(0,o.jsx)("label",{className:"group-picker-label",htmlFor:x},this.formatMessage("addPortalGroup")),(0,o.jsx)(r.TextInput,{id:x,name:`portal-groups-${e.id}`,size:"sm",className:"w-100",value:g,placeholder:this.formatMessage("searchGroupsPlaceholder"),"aria-label":this.formatMessage("searchGroupsPlaceholder"),autoComplete:"off",onChange:t=>{this.onGroupQueryChange(e.id,t.target.value)},onFocus:()=>{this.searchGroups(e.id,g,f)},allowClear:!0}),w&&(0,o.jsx)("div",{className:"group-search-status",role:"status","aria-live":"polite"},(0,o.jsx)(r.Loading,{type:o.LoadingType.Secondary,width:16,height:16}),(0,o.jsx)("span",null,this.formatMessage("searchingGroups"))),S&&(0,o.jsx)(r.Alert,{withIcon:!0,open:!0,type:"warning",className:"w-100 mt-1",text:this.formatMessage("groupsLoadError")}),!S&&v.length>0&&(0,o.jsx)("div",{className:"group-search-results",role:"group","aria-label":this.formatMessage("groupSearchResults")},v.map((t=>{const i=e.groups.some((e=>e.id===t.id)),s=b.some((e=>e.id===t.id)),a=this.getGroupThumbnailUrl(t);return(0,o.jsx)("label",{key:t.id,className:"group-search-item"+(i?" is-disabled":"")},(0,o.jsx)(r.Checkbox,{className:"group-search-checkbox",checked:i||s,disabled:i,"aria-label":this.formatMessage("selectNamedGroup",{name:t.title}),onChange:i=>{this.toggleGroupSelection(e.id,t,i.target.checked)}}),a?(0,o.jsx)("img",{className:"group-search-thumb",src:a,alt:"",width:20,height:20,onError:e=>{e.currentTarget.style.display="none"}}):(0,o.jsx)(B,{size:"m","aria-hidden":"true"}),(0,o.jsx)("span",{className:"group-search-title",title:t.title},t.title),(0,o.jsx)("span",{className:"group-search-action"},i?this.formatMessage("groupAdded"):s?this.formatMessage("groupSelected"):this.getGroupRelationshipLabel(t.relationship)))}))),!S&&y>0&&(0,o.jsx)(r.Button,{size:"sm",type:"tertiary",className:"w-100 mt-1",disabled:w,onClick:()=>{this.searchGroups(e.id,g,f,y)}},this.formatMessage("loadMoreGroups")),!w&&!S&&g&&0===v.length&&(0,o.jsx)("div",{className:"group-search-results"},(0,o.jsx)("div",{className:"group-search-empty"},this.formatMessage("noGroupsFound"))),(v.length>0||b.length>0)&&(0,o.jsx)("div",{className:"group-picker-actions"},(0,o.jsx)("span",{className:"group-selection-count",role:"status","aria-live":"polite"},this.formatMessage("groupsPendingCount",{count:b.length})),(0,o.jsx)(r.Button,{size:"sm",type:"primary",disabled:0===b.length,onClick:()=>{this.addSelectedGroupsToView(e.id)}},this.formatMessage("addSelectedGroups",{count:b.length}))))},this.renderViewListItem=e=>{const t=e.groups.length,i=this.countViewFields(e);return(0,o.jsx)("div",{key:e.id,className:"view-list-item"},(0,o.jsx)("button",{type:"button",className:"view-list-open","aria-label":this.formatMessage("editViewTitle",{name:e.name}),onClick:t=>{this.openViewEditor(e.id,t.currentTarget)}},(0,o.jsx)("span",{className:"view-list-icon"},(0,o.jsx)(B,{size:"m","aria-hidden":"true"})),(0,o.jsx)("span",{className:"view-list-copy"},(0,o.jsx)("span",{className:"view-list-title",dir:"auto",title:e.name},e.name),(0,o.jsx)("span",{className:"view-list-summary",dir:"ltr"},this.formatMessage("viewAccessSummary",{groups:t,fields:i}))),(0,o.jsx)(G,{autoFlip:!0,rotate:-90,className:"view-list-arrow","aria-hidden":"true"})),(0,o.jsx)(r.Button,{size:"sm",type:"tertiary",icon:!0,className:"view-list-delete-btn",title:this.formatMessage("deleteView"),"aria-label":`${this.formatMessage("deleteView")}: ${e.name}`,onClick:()=>{this.requestDeleteView(e.id)}},(0,o.jsx)(w,null)))},this.renderViewDetails=e=>{var t;const i=null!==(t=this.state.nameDrafts[e.id])&&void 0!==t?t:e.name,s=`view-name-${e.id}`;return(0,o.jsx)("section",{className:"view-editor-section","aria-labelledby":`view-details-title-${e.id}`},(0,o.jsx)("div",{id:`view-details-title-${e.id}`,className:"view-editor-section-title"},this.formatMessage("viewDetailsSection")),(0,o.jsx)("label",{className:"view-section-label d-block",htmlFor:s},this.formatMessage("viewNameLabel")),(0,o.jsx)(r.TextInput,{id:s,name:`view-name-${e.id}`,size:"sm",className:"w-100",value:i,"aria-label":this.formatMessage("viewNameLabel"),autoComplete:"off",onChange:t=>{this.onNameDraftChange(e.id,t.target.value)},onAcceptValue:()=>{this.commitName(e.id)}}))},this.renderAccessSection=e=>{const t=e.groups.length;return(0,o.jsx)("section",{className:"group-access-panel","aria-labelledby":`group-access-title-${e.id}`},(0,o.jsx)("div",{className:"group-access-header"},(0,o.jsx)("span",{className:"group-access-icon"},(0,o.jsx)(B,{size:"m","aria-hidden":"true"})),(0,o.jsx)("div",{className:"group-access-copy"},(0,o.jsx)("div",{id:`group-access-title-${e.id}`,className:"group-access-title"},this.formatMessage("portalGroupsLabel")),(0,o.jsx)("div",{className:"group-access-help"},this.formatMessage("portalGroupsHelp"))),(0,o.jsx)("span",{className:"group-selected-count"},this.formatMessage("groupSelectedCount",{count:t}))),0===t?(0,o.jsx)("div",{className:"group-empty-state"},(0,o.jsx)(B,{className:"group-empty-icon",size:"m","aria-hidden":"true"}),(0,o.jsx)("div",null,(0,o.jsx)("div",{className:"group-empty-title"},this.formatMessage("noGroupsEmptyTitle")),(0,o.jsx)("div",{className:"group-empty-description"},this.formatMessage("noGroupsEmptyDescription")))):(0,o.jsx)(o.React.Fragment,null,(0,o.jsx)("div",{className:"group-selected-label"},this.formatMessage("selectedGroupsLabel")),this.renderGroupChips(e)),this.renderGroupPicker(e))},this.renderLayerFieldBlock=(e,i)=>{var s;const a=this.getLayerFieldSource(i);if(!(null==a?void 0:a.length))return null;if(i.layerHonorMode===t.Webmap)return(0,o.jsx)("div",{key:i.id,className:"view-layer-block"},(0,o.jsx)("div",{className:"view-layer-header"},(0,o.jsx)("div",{className:"view-layer-title",title:i.name},i.name)),(0,o.jsx)("div",{className:"view-layer-webmap-note"},this.formatMessage("webmapLayerNote")));const r=(null===(s=e.editableFields)||void 0===s?void 0:s[i.id])||[],n=this.buildFieldTree(i,r);return(0,o.jsx)("div",{key:i.id,className:"view-layer-block"},(0,o.jsx)("div",{className:"view-layer-header"},(0,o.jsx)("div",{className:"view-layer-title",title:i.name},i.name),(0,o.jsx)("span",{className:"view-layer-count"},this.formatMessage("fieldsCount",{count:r.length}))),(0,o.jsx)(u.Tree,Object.assign({className:"view-field-tree",rootItemJson:n,treeAlignmentType:u.TreeAlignmentType.Intact,isMultiSelection:!0,checkboxLinkage:!0,onUpdateItem:(t,s)=>{var a;const o=(null==t?void 0:t.itemJsons)||(null===(a=null==s?void 0:s.props)||void 0===a?void 0:a.itemJsons);if(!o||!o.length)return;const r=o[o.length-1];this.toggleFieldForView(e.id,i.id,this.collectCheckedFields(r))}},this.getFieldTreeActionMap())))},this.renderEditableFieldsSection=e=>{const t=this.countViewFields(e);return(0,o.jsx)("section",{className:"view-editor-section","aria-labelledby":`editable-fields-title-${e.id}`},(0,o.jsx)("div",{className:"group-access-header"},(0,o.jsx)("div",{className:"group-access-copy"},(0,o.jsx)("div",{id:`editable-fields-title-${e.id}`,className:"view-editor-section-title mb-0"},this.formatMessage("editableFieldsLabel"))),(0,o.jsx)("span",{className:"group-selected-count"},this.formatMessage("fieldsCount",{count:t}))),0===t&&(0,o.jsx)(r.Alert,{withIcon:!0,open:!0,type:"warning",className:"w-100 mt-2",text:this.formatMessage("noFieldsWarning")}),this.getMutableLayers().map((t=>this.renderLayerFieldBlock(e,t))))},this.renderViewEditor=e=>(0,o.jsx)("div",{className:"h-100",css:this.getStyle()},(0,o.jsx)("div",{className:"view-editor-scroll"},(0,o.jsx)("div",{className:"view-card"},(0,o.jsx)("div",{className:"view-card-body"},this.renderViewDetails(e),this.renderAccessSection(e),this.renderEditableFieldsSection(e))))),this.state={activeViewId:"",viewEditorFocusNode:null,nameDrafts:{},groupQuery:{},groupScope:{},groupResults:{},groupNextStart:{},groupSelections:{},groupSearching:{},groupLoadError:{},deleteViewId:""},this.searchTimers={},this.searchSeq={}}componentWillUnmount(){Object.keys(this.searchTimers).forEach((e=>{clearTimeout(this.searchTimers[e])}))}render(){var e;const{viewsEnabled:t}=this.props,i=this.getMutableViews(),s=i.find((e=>e.id===this.state.activeViewId)),a=i.find((e=>e.id===this.state.deleteViewId)),l=this.getLayersWithNoEditableFields();return(0,o.jsx)(n.SettingSection,{role:"group","aria-label":this.formatMessage("viewsSection"),title:this.formatMessage("viewsSection")},(0,o.jsx)(n.SettingRow,{label:this.formatMessage("enableViews"),flow:"wrap"},(0,o.jsx)(r.Switch,{className:"can-x-switch",checked:!!t,onChange:e=>{this.props.onViewsEnabledChange(e.target.checked),e.target.checked||this.closeViewEditor()},"aria-label":this.formatMessage("enableViews")})),t&&(0,o.jsx)(n.SettingRow,{flow:"wrap"},(0,o.jsx)("div",{ref:this.viewListTrigger,className:"view-manager-body",css:this.getStyle()},(0,o.jsx)("div",{className:"view-manager-desc"},this.formatMessage("viewsDescription")),i.length>0&&l.length>0&&(0,o.jsx)(r.Alert,{withIcon:!0,open:!0,type:"warning",className:"w-100 mb-2",text:this.formatMessage("layersNoEditable",{layers:l.join(", ")})}),i.length>0?(0,o.jsx)("div",{className:"view-manager-list"},i.map((e=>this.renderViewListItem(e)))):(0,o.jsx)("div",{className:"view-list-empty"},(0,o.jsx)(B,{className:"view-list-empty-icon",size:"l","aria-hidden":"true"}),(0,o.jsx)("div",{className:"view-list-empty-title"},this.formatMessage("viewsEmptyTitle")),(0,o.jsx)("div",{className:"view-list-empty-description"},this.formatMessage("viewsEmptyDescription"))),(0,o.jsx)(r.Button,{size:"sm",type:"primary",onClick:e=>{this.addView(e.currentTarget)},className:"w-100 mt-2 d-flex align-items-center justify-content-center"},(0,o.jsx)(A,{className:"mr-1"}),this.formatMessage("addView")))),(0,o.jsx)(n.SidePopper,{isOpen:!!t&&!!s,position:"right",toggle:this.closeViewEditor,trigger:null===(e=this.viewListTrigger)||void 0===e?void 0:e.current,backToFocusNode:this.state.viewEditorFocusNode,title:null==s?void 0:s.name,"aria-label":s?this.formatMessage("editViewTitle",{name:s.name}):this.formatMessage("viewsSection")},s&&this.renderViewEditor(s)),a&&(0,o.jsx)(r.ConfirmDialog,{level:"warning",title:this.formatMessage("deleteViewConfirmTitle"),hasNotShowAgainOption:!1,content:this.formatMessage("deleteViewConfirmTips"),onConfirm:this.confirmDeleteView,onClose:this.cancelDeleteView}))}}var q=c(108);class Q extends o.React.PureComponent{constructor(){super(...arguments),this.onDataSourceCreated=e=>{this.props.onCreateDataSourceCreatedOrFailed(this.props.useDataSource.dataSourceId,e)},this.onCreateDataSourceFailed=e=>{this.props.onCreateDataSourceCreatedOrFailed(this.props.useDataSource.dataSourceId,null)}}render(){return(0,o.jsx)(o.DataSourceComponent,{useDataSource:this.props.useDataSource,onDataSourceCreated:this.onDataSourceCreated,onCreateDataSourceFailed:this.onCreateDataSourceFailed})}}var Y=c(921),X=c.n(Y),Z=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const ee=e=>{const t=window.SVG,{className:i}=e,s=Z(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:X()},s)):o.React.createElement("svg",Object.assign({className:a},s))};var te=c(27),ie=c.n(te),se=function(e,t){var i={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(i[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(s=Object.getOwnPropertySymbols(e);a<s.length;a++)t.indexOf(s[a])<0&&Object.prototype.propertyIsEnumerable.call(e,s[a])&&(i[s[a]]=e[s[a]])}return i};const ae=e=>{const t=window.SVG,{className:i}=e,s=se(e,["className"]),a=(0,o.classNames)("jimu-icon jimu-icon-component",i);return t?o.React.createElement(t,Object.assign({className:a,src:ie()},s)):o.React.createElement("svg",Object.assign({className:a},s))};function oe(e){var t,i,s,a,r;let n=[];if(!e)return n;const l=(null===(t=null===window||void 0===window?void 0:window.jimuConfig)||void 0===t?void 0:t.isBuilder)?null===(s=null===(i=(0,o.getAppStore)().getState())||void 0===i?void 0:i.appStateInBuilder)||void 0===s?void 0:s.appConfig:null===(a=(0,o.getAppStore)().getState())||void 0===a?void 0:a.appConfig;if(!l)return n;const d=null===(r=l.widgets[e])||void 0===r?void 0:r.useDataSources;if(void 0!==d){d.map((e=>e.dataSourceId)).forEach((e=>{const t=o.DataSourceManager.getInstance().getDataSource(e),i=(null==t?void 0:t.getDataSourcesByType(o.DataSourceTypes.FeatureLayer))||[],s=(null==t?void 0:t.getDataSourcesByType(o.DataSourceTypes.OrientedImageryLayer))||[],a=i.concat(s);if(a){const e=a.filter((e=>!function(e){const t=e=>{var i,s;let a=!1;const r=null==e?void 0:e.parentDataSource,n=null===(i=null==e?void 0:e.layer)||void 0===i?void 0:i.isTable;if(((null===(s=null==r?void 0:r.layer)||void 0===s?void 0:s.type)===o.SupportedJSAPILayerTypes.MapImageLayer||n)&&(a=!0),a||!r)return a;t(r)};return t(e)}(e)));n=n.concat(e)}}))}return n}var re=c(686),ne=function(e,t,i,s){return new(i||(i=Promise))((function(a,o){function r(e){try{l(s.next(e))}catch(e){o(e)}}function n(e){try{l(s.throw(e))}catch(e){o(e)}}function l(e){var t;e.done?a(e.value):(t=e.value,t instanceof i?t:new i((function(e){e(t)}))).then(r,n)}l((s=s.apply(e,t||[])).next())}))};const le=Object.assign({},d,r.defaultMessages);class de extends o.React.PureComponent{constructor(i){super(i),this.supportedDsTypes=(0,o.Immutable)([o.AllDataSourceTypes.FeatureLayer,o.AllDataSourceTypes.SceneLayer,o.AllDataSourceTypes.OrientedImageryLayer]),this.sidePopperTrigger=o.React.createRef(),this.updateDsHash=e=>{this.dsHash={};let t=0;e.forEach((e=>{this.dsHash[t]=e.useDataSource,t++}))},this.getNewConfigId=e=>{var t;return`${e}-${((null===(t=this.props.config)||void 0===t?void 0:t.layersConfig.length)>0?this.getArrayMaxId(this.props.config.layersConfig):0)+1}`},this.dataSourceChangeSave=i=>{if(!i)return;const{config:s}=this.props,{editMode:a}=s,r=a===e.Attribute,n=s.editMode===e.Geometry,l=(0,o.Immutable)(i[0]);this.dsManager.createDataSourceByUseDataSource(l).then((e=>{var i,s,a,d,c,p;const u=null==e?void 0:e.getLayerDefinition(),h=null==u?void 0:u.allowGeometryUpdates,m=null==u?void 0:u.capabilities,g=(null==u?void 0:u.type)===o.SupportedLayerServiceTypes.Table,f=!n&&g||n,v=this.getDsCap(m,"create")&&f,y=this.getDsCap(m,"update"),b=this.getDsCap(m,"delete"),w=null==e?void 0:e.getSchema();let S=(null==w?void 0:w.fields)?Object.values(null==w?void 0:w.fields):[];const x=(null==u?void 0:u.fields)||[];S=S.filter((e=>!M.includes(e.name)));const j=null===(s=null===(i=null==e?void 0:e.layer)||void 0===i?void 0:i.formTemplate)||void 0===s?void 0:s.elements;if(j){const e=[];j.forEach((t=>{var i;const s=t;(null===(i=null==s?void 0:s.elements)||void 0===i?void 0:i.length)>0?null==s||s.elements.forEach((t=>{t.fieldName&&e.push(t.fieldName)})):s.fieldName&&e.push(s.fieldName)})),S=S.filter((t=>e.includes(t.name)))}(null==S?void 0:S.length)>50&&(S=S.slice(0,50));const C=S.map((e=>{const t=x.find((t=>t.name===e.jimuName)),i=null==t?void 0:t.editable;return Object.assign(Object.assign({},e),{editAuthority:i,subDescription:(null==e?void 0:e.description)||"",editable:i})})),O=!!(null===(a=e.getRootDataSource())||void 0===a?void 0:a.map),T=Object.assign({id:e.id,name:e.getLabel(),layerId:null==e?void 0:e.jimuChildId,useDataSource:l,addRecords:v,deleteRecords:b,updateRecords:y,updateAttributes:y,updateGeometries:h&&y,featureSnapping:!1,showFields:S,groupedFields:C,layerHonorMode:O?t.Webmap:t.Custom},r?{layerEditingEnabled:null===(p=null===(c=null===(d=null==e?void 0:e.getMainDataSource())||void 0===d?void 0:d.layer)||void 0===c?void 0:c.editingEnabled)||void 0===p||p,isTable:g}:{});let N;if(this.props.config.layersConfig[this.index]){const e=this.props.config.layersConfig.asMutable({deep:!0});e.splice(this.index,1,T),N=(0,o.Immutable)(e)}else N=this.props.config.layersConfig.concat([(0,o.Immutable)(T)]);this.dsHash[this.index]=l,this.updateDsHash(N);const I={id:this.props.id,config:this.props.config.set("layersConfig",N),useDataSources:this.getUseDataSourcesByDsHash()};this.props.onSettingChange(I)})).catch((e=>{console.error(e)}))},this.importAllLayersConfigSave=e=>ne(this,void 0,void 0,(function*(){if(0===(null==e?void 0:e.length))return;const i=yield(()=>ne(this,void 0,void 0,(function*(){let i=this.props.config.layersConfig;const a=[];e.forEach((e=>{e.dataSourceId.startsWith("add-data")||a.push(this.dsManager.createDataSourceByUseDataSource((0,o.Immutable)(e)))}));const r=yield Promise.all(a);return e.forEach(((a,n)=>{var l,d,c,p,u;const h=r[n];if(!this.supportedDsTypes.includes(null==h?void 0:h.type))return;const m=(null==h?void 0:h.getLayerDefinition)?h.getLayerDefinition():{};if((null===(l=null==h?void 0:h.layer)||void 0===l?void 0:l.isTable)||(null==m?void 0:m.type)===o.SupportedLayerServiceTypes.Table||(null===(d=null==h?void 0:h.getDataSourceJson())||void 0===d?void 0:d.isHidden))return;const g=(0,o.Immutable)(a),f=(null==m?void 0:m.fields)||[],v=null==h?void 0:h.getSchema();let y=(null==v?void 0:v.fields)?Object.values(null==v?void 0:v.fields):[];y=y.filter((e=>!M.includes(e.jimuName)));const b=null===(p=null===(c=null==h?void 0:h.layer)||void 0===c?void 0:c.formTemplate)||void 0===p?void 0:p.elements;if(b){const e=[];b.forEach((t=>{var i;const s=t;(null===(i=null==s?void 0:s.elements)||void 0===i?void 0:i.length)>0?null==s||s.elements.forEach((t=>{t.fieldName&&e.push(t.fieldName)})):s.fieldName&&e.push(s.fieldName)})),y=y.filter((t=>e.includes(t.name)))}(null==y?void 0:y.length)>50&&(y=y.slice(0,50));const w=y.map((e=>{const t=f.find((t=>t.name===e.jimuName)),i=null==t?void 0:t.editable;return Object.assign(Object.assign({},e),{editAuthority:i,subDescription:(null==e?void 0:e.description)||"",editable:i})})),S=null==m?void 0:m.allowGeometryUpdates,x=null==m?void 0:m.capabilities,j=this.getDsCap(x,"create"),C=this.getDsCap(x,"update"),O=this.getDsCap(x,"delete"),T=!!(null===(u=h.getRootDataSource())||void 0===u?void 0:u.map),N={id:h.id,name:h.getLabel(),layerId:null==h?void 0:h.jimuChildId,useDataSource:g,addRecords:j,deleteRecords:O,updateRecords:C,updateAttributes:C,updateGeometries:S&&C,featureSnapping:!1,showFields:y,groupedFields:w,layerHonorMode:T?t.Webmap:t.Custom};i=i.concat([(0,o.Immutable)(N)]),this.dsHash[this.index]=g,e.length===n+1&&0===i.length&&this.setState({importHintType:s.NoLayer},(()=>{setTimeout((()=>{this.setState({importHintType:void 0})}),3e3)}))})),i})))();this.updateDsHash(i.asMutable({deep:!0}));const a={id:this.props.id,config:this.props.config.set("layersConfig",i),useDataSources:this.getUseDataSourcesByDsHash()};this.props.onSettingChange(a)})),this.onViewsCreate=e=>{this.setState({allLayerLoaded:!1});const t=Object.keys(e),i=t.length,s={};let a=0;t.forEach((t=>ne(this,void 0,void 0,(function*(){s[t]=!1;const o=e[t];if(yield o.whenJimuMapViewLoaded(),yield o.whenAllJimuLayerViewLoaded(),s[t]=!0,a++,a===i){Object.values(s).every((e=>e))&&this.setState({jimuMapViews:e,allLayerLoaded:!0})}}))))},this.getDsCap=(e,t)=>!!e&&(Array.isArray(e)?null==e?void 0:e.join().toLowerCase().includes(t):null==e?void 0:e.toLowerCase().includes(t)),this.onFilterDs=t=>{var i,s;if(!(null==t?void 0:t.url)||(null==t?void 0:t.isOutputFromWidget))return!0;const{useMapWidgetIds:a,config:r}=this.props,{layersConfig:n,editMode:l}=r,d=n.map((e=>e.id));let c=!1;if(l===e.Geometry){const e=null==a?void 0:a[0];if(!e)return!0;const r=this.dsManager.getDataSource(t.id),n=null==r?void 0:r.getLayerDefinition();if((null===(i=null==r?void 0:r.layer)||void 0===i?void 0:i.isTable)||(null==n?void 0:n.type)===o.SupportedLayerServiceTypes.Table)return!0;const l=(null===(s=(0,o.getAppStore)().getState().appStateInBuilder.appConfig.widgets[e])||void 0===s?void 0:s.useDataSources).map((e=>e.dataSourceId)),p=t.id.split("-")[0];c=!l.includes(p)||l.includes(p)&&d.includes(t.id)}else c=d.includes(t.id);return c},this.onCloseLayerPanel=()=>{this.setState({showLayerPanel:!1}),this.index=0},this.getUniqueValues=(e=[],t=[])=>{const i=e.concat(t).filter((function(e,t,i){return i.indexOf(e)===t}));return i},this.getUseDataSourcesByDsHash=()=>{const e={};Object.keys(this.dsHash).forEach((t=>{const i=this.dsHash[t].dataSourceId;let s;s=e[i]?(0,o.Immutable)({dataSourceId:this.dsHash[t].dataSourceId,mainDataSourceId:this.dsHash[t].mainDataSourceId,dataViewId:this.dsHash[t].dataViewId,rootDataSourceId:this.dsHash[t].rootDataSourceId,fields:this.getUniqueValues(e[i].fields,this.dsHash[t].fields)}):this.dsHash[t],e[i]=s}));const t=[];return Object.keys(e).forEach((i=>{t.push(e[i])})),t},this.removeLayer=e=>{this.index===e&&this.onCloseLayerPanel();const t=this.props.config.layersConfig.asMutable({deep:!0});t.splice(e,1);let i=this.props.config.set("layersConfig",t);0===(null==t?void 0:t.length)&&(i=i.set("description","")),delete this.dsHash[e],this.updateDsHash(t);const s={id:this.props.id,config:i,useDataSources:this.getUseDataSourcesByDsHash()};this.props.onSettingChange(s),this.index>e&&this.index--,q.builderAppSync.publishChangeWidgetStatePropToApp({widgetId:this.props.id,propKey:"removeLayerFlag",value:!0})},this.optionChangeSave=(e,t)=>{const i=this.props.config.layersConfig[this.index];if(i){const s=this.props.config.setIn(["layersConfig",this.index.toString()],Object.assign(Object.assign({},i),{[e]:t})),a={id:this.props.id,config:s};this.props.onSettingChange(a)}},this.multiOptionsChangeSave=e=>{const t=this.props.config.layersConfig[this.index];if(t){const i=this.props.config.setIn(["layersConfig",this.index.toString()],Object.assign(Object.assign({},t),e)),s={id:this.props.id,config:i};this.props.onSettingChange(s)}},this.getStyle=e=>o.css`
      .widget-setting-edit {
        .layerlist-tools{
          .layerlist-tools-item{
            display: flex;
            margin-bottom: 8px;
          }
        }

        .filter-item {
          display: flex;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.25rem;
          line-height: 23px;
          cursor: pointer;
          background-color: ${e.sys.color.secondary.main};

          .filter-item-icon {
            width: 14px;
            margin-right: 0.5rem;
          }
          .filter-item-name {
            word-wrap: break-word;
          }
        }

        .edit-tips{
          font-style: italic;
          font-size: 12px;
          color: ${e.ref.palette.neutral[1e3]};
        }
        .filter-item-active {
          border-left: 2px solid ${e.sys.color.primary.main};
        }
        .capability-header{
          margin-bottom: 12px;
        }
        .capability-item{
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .empty-placeholder {
          display: flex;
          flex-flow: column;
          justify-content: center;
          height: calc(100% - 379px);
          overflow: hidden;
          .empty-placeholder-inner {
            padding: 0px 20px;
            flex-direction: column;
            align-items: center;
            display: flex;

            .empty-placeholder-text {
              color: ${e.ref.palette.neutral[1e3]};
              font-size: ${o.polished.rem(14)};
              margin-top: 16px;
              text-align: center;
            }
            .empty-placeholder-icon {
              color: ${e.ref.palette.neutral[800]};
            }
          }
        }

        .setting-ui-unit-tree, .setting-ui-unit-list {
          width: 100%;
          .tree-item {
            justify-content: space-between;
            align-items: center;
            font-size: ${o.polished.rem(13)};
            &.tree-item_level-1 {
            }
            .jimu-checkbox {
              margin-right: .5rem;
            }
          }
        }
        .setting-ui-unit-list-new {
          padding-top: ${o.polished.rem(8)};
        }
      }
    `,this.formatMessage=(e,t)=>this.props.intl.formatMessage({id:e,defaultMessage:le[e]},t),this.onMapWidgetSelected=e=>{this.props.onSettingChange({id:this.props.id,useMapWidgetIds:e}),this.onPropertyChange("layersConfig",[])},this.onShowLayerPanel=(e,t=!1)=>{const{showLayerPanel:i}=this.state;this.settSidePopperAnchor(e,t),e===this.index?this.setState({showLayerPanel:!i}):(this.setState({showLayerPanel:!0,refreshPanel:!this.state.refreshPanel}),this.index=e)},this.settSidePopperAnchor=(e,t=!1)=>{let i;i=t?this.sidePopperTrigger.current.getElementsByClassName("add-edit-btn")[0]:this.sidePopperTrigger.current.getElementsByClassName("jimu-tree-item__body")[e],this.setState({popperFocusNode:i})},this.onItemUpdated=(e,t)=>{const{id:i,config:s}=this.props,a=e.map((e=>e.itemStateDetailContent)),o={id:i,config:s.set("layersConfig",a)};this.updateDsHash(a),this.props.onSettingChange(o)},this.onCreateDataSourceCreatedOrFailed=(e,t)=>{this.setState((i=>{const s=Object.assign({},i.dataSources);return s[e]=t,{dataSources:s}}))},this.isDataSourceAccessible=e=>{var t;const i=(null===(t=this.props.useDataSources)||void 0===t?void 0:t.filter((t=>e===t.dataSourceId)).length)>0;return null!==this.state.dataSources[e]&&i},this.importAll=()=>{const{useMapWidgetIds:e,config:t}=this.props,{layersConfig:i}=t;if(!(null==e?void 0:e[0]))return void this.setState({importHintType:s.NoMap},(()=>{setTimeout((()=>{this.setState({importHintType:void 0})}),3e3)}));const a=[],{jimuMapViews:o}=this.state;Object.keys(o).forEach((e=>{var t,s,r;const n=o[e].jimuLayerViews;for(const e in n){const o=null===(t=n[e])||void 0===t?void 0:t.getLayerDataSource();(null===(s=null==o?void 0:o.getDataSourceJson())||void 0===s?void 0:s.url)&&-1===i.findIndex((e=>e.id===o.id))&&a.push({dataSourceId:o.id,mainDataSourceId:o.id,dataViewId:o.dataViewId,rootDataSourceId:null===(r=o.getRootDataSource())||void 0===r?void 0:r.id})}})),a.length>0?this.importAllLayersConfigSave(a):0===i.length&&0===a.length&&this.setState({importHintType:s.NoLayer},(()=>{setTimeout((()=>{this.setState({importHintType:void 0})}),3e3)}))},this.onEditModeChange=e=>{this.toBeChangedMode=e;const{config:t}=this.props,{editMode:i,layersConfig:s}=t;if(0===s.length)return this.onPropertyChange("editMode",this.toBeChangedMode),void this.setState({showLayerPanel:!1});e!==i&&this.setState({changeModeConfirmOpen:!0})},this.handleChangeModeOk=()=>{const e=[{name:"editMode",value:this.toBeChangedMode},{name:"layersConfig",value:[]}];this.onMultiplePropertyChange(e),this.setState({changeModeConfirmOpen:!1,showLayerPanel:!1})},this.handleChangeModeClose=()=>{this.setState({changeModeConfirmOpen:!1})},this.onPropertyChange=(e,t)=>{const{config:i}=this.props;if(t===i[e])return;const s=i.set(e,t),a={id:this.props.id,config:s};this.props.onSettingChange(a)},this.onMultiplePropertyChange=e=>{const{config:t}=this.props;let i=t;e.forEach((e=>{e.value!==t[e.name]&&(i=i.set(e.name,e.value))}));const s={id:this.props.id,config:i};this.props.onSettingChange(s)},this.getAllLayersOptions=()=>{const e=[],{jimuMapViews:t,allLayerLoaded:i}=this.state;return i?(Object.keys(t).forEach((i=>{var s,a;const o=t[i].jimuLayerViews;for(const t in o){const i=null===(a=null===(s=o[t])||void 0===s?void 0:s.getLayerDataSource())||void 0===a?void 0:a.getDataSourceJson();i&&e.push({value:i.id,label:i.sourceLabel})}})),e):e},this.getSnapLayers=e=>{const t=[],{jimuMapViews:i}=this.state;return Object.keys(i).forEach((s=>{var a,o;const r=i[s].jimuLayerViews;for(const i in r){const s=null===(o=null===(a=r[i])||void 0===a?void 0:a.getLayerDataSource())||void 0===o?void 0:o.getDataSourceJson();s&&(null==e?void 0:e.includes(s.id))&&t.push({value:s.id,label:s.sourceLabel})}})),t},this.onSnapLayersChange=e=>{e||(e=[]);const t=e.map((e=>e.value));this.onPropertyChange("defaultSnapLayers",t)},this.displaySelectedLayers=e=>this.formatMessage("numSelected",{number:e.length}),this.index=0,this.dsManager=o.DataSourceManager.getInstance(),this.updateDsHash(this.props.config.layersConfig?this.props.config.layersConfig:[]),this.state={showLayerPanel:!1,refreshPanel:!1,dataSources:{},changeModeConfirmOpen:!1,importHintType:void 0,popperFocusNode:null,jimuMapViews:{},allLayerLoaded:!1}}componentDidUpdate(e){const{useMapWidgetIds:t}=this.props,{useMapWidgetIds:i}=e;(null==t?void 0:t[0])!==(null==i?void 0:i[0])&&this.onPropertyChange("defaultSnapLayers",[])}getArrayMaxId(e){const t=e.map((e=>e.id.split("-").reverse()[0]));return t.length>0?Math.max.apply(null,t):0}render(){var t,i,l,d,c,p,h,m,g;const{showLayerPanel:f,changeModeConfirmOpen:v,importHintType:y,allLayerLoaded:b}=this.state,{theme:w,config:S,useMapWidgetIds:x}=this.props,{layersConfig:j,editMode:C,selfSnapping:M,featureSnapping:T,defaultSelfEnabled:I,defaultFeatureEnabled:D,defaultSnapLayers:k,snapSettingMode:L,tooltip:R,templateFilter:$,relatedRecords:F,liveDataEditing:P}=S,V=C===e.Attribute,G=C===e.Geometry,z=V?this.formatMessage("newEdit"):this.formatMessage("newEditGeo"),H=V?this.formatMessage("editableSource"):this.formatMessage("editableLayer"),U=j.length,B=(0,o.getAppStore)().getState().appStateInBuilder.appConfig,J=null==x?void 0:x[0],_=G&&(!x||0===(null==x?void 0:x.length)||!(null===(t=B.widgets)||void 0===t?void 0:t[J])),W={overrideItemBlockInfo:({itemBlockInfo:e},t)=>({name:u.TreeItemActionType.RenderOverrideItem,children:[{name:u.TreeItemActionType.RenderOverrideItemDroppableContainer,children:[{name:u.TreeItemActionType.RenderOverrideItemDraggableContainer,children:[{name:u.TreeItemActionType.RenderOverrideItemBody,children:[{name:u.TreeItemActionType.RenderOverrideItemMainLine,children:[{name:u.TreeItemActionType.RenderOverrideItemDragHandle},{name:u.TreeItemActionType.RenderOverrideItemIcon,autoCollapsed:!0},{name:u.TreeItemActionType.RenderOverrideItemTitle},{name:u.TreeItemActionType.RenderOverrideItemDetailToggle},{name:u.TreeItemActionType.RenderOverrideItemCommands}]}]}]}]}]})},q=oe(J).find((e=>{var t;return(null===(t=j[this.index])||void 0===t?void 0:t.id)===e.id})),Y=G?null===(d=null===(l=null===(i=null==q?void 0:q.getMainDataSource())||void 0===i?void 0:i.layer)||void 0===l?void 0:l.editingEnabled)||void 0===d||d:null===(c=j[this.index])||void 0===c?void 0:c.layerEditingEnabled;return(0,o.jsx)("div",{css:this.getStyle(w),className:"h-100"},(0,o.jsx)("div",{className:"jimu-widget-setting widget-setting-edit h-100"},null===(p=this.props.useDataSources)||void 0===p?void 0:p.map(((e,t)=>(0,o.jsx)(Q,{key:t,useDataSource:e,onCreateDataSourceCreatedOrFailed:this.onCreateDataSourceCreatedOrFailed}))),(0,o.jsx)(n.SettingSection,{className:"p-0 m-0 "+(U>0?"":"border-0"),role:"group"},(0,o.jsx)("div",{ref:this.sidePopperTrigger},(0,o.jsx)(n.SettingSection,{className:"border-0"},(0,o.jsx)("div",{role:"radiogroup",className:"mb-4"},(0,o.jsx)(r.Label,{className:"d-flex align-items-center"},(0,o.jsx)(r.Radio,{style:{cursor:"pointer"},name:"editModeType",className:"mr-2",checked:V,onChange:()=>{this.onEditModeChange(e.Attribute)}}),this.formatMessage("attrMode")),(0,o.jsx)(r.Label,{className:"d-flex align-items-center"},(0,o.jsx)(r.Radio,{style:{cursor:"pointer"},name:"editModeType",className:"mr-2",checked:G,onChange:()=>{this.onEditModeChange(e.Geometry)}}),this.formatMessage("geoMode"))),G&&(0,o.jsx)(O.Fragment,null,(0,o.jsx)(n.SettingRow,{label:this.formatMessage("selectMapWidget")}),(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(n.MapWidgetSelector,{onSelect:this.onMapWidgetSelected,useMapWidgetIds:x}),(0,o.jsx)(r.Button,{icon:!0,size:"sm",type:"default",onClick:this.importAll,className:"ml-1",title:this.formatMessage("importAll"),"aria-label":this.formatMessage("importAll"),disabled:!b},(0,o.jsx)(ee,null))),y&&(0,o.jsx)(r.Alert,{withIcon:!0,tabIndex:0,className:"w-100 mt-2 mb-2",open:!0,closable:!0,onClose:()=>{this.setState({importHintType:void 0})},text:y===s.NoLayer?this.formatMessage("noLayerTips"):this.formatMessage("selectMapTip"),type:"warning"})),(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.Button,{className:"w-100 add-edit-btn",type:"primary",onClick:()=>{this.onShowLayerPanel(U,!0)},disabled:_,title:z,"aria-label":z,"aria-describedby":"edit-blank-msg"},(0,o.jsx)("div",{className:"w-100 px-2 text-truncate"},(0,o.jsx)(A,{className:"mr-1 mb-1"}),z))),(0,o.jsx)(n.SettingRow,null,(0,o.jsx)("div",{className:"text-break edit-tips"},G?this.formatMessage("newMapEditTips"):this.formatMessage("newEditTips")))),(0,o.jsx)(n.SettingSection,{className:"pt-0 border-0"},(0,o.jsx)("div",{className:"setting-ui-unit-list"},!!U&&(0,o.jsx)(u.List,Object.assign({className:"setting-ui-unit-list-exsiting",itemsJson:Array.from(S.layersConfig).map(((e,t)=>({itemStateDetailContent:e,itemKey:`${t}`,itemStateTitle:e.name,itemStateChecked:f&&t===this.index,itemStateCommands:[{label:this.formatMessage("remove"),iconProps:()=>({icon:E(),size:12}),action:()=>{this.removeLayer(t)}}]}))),dndEnabled:!0,renderOverrideItemDetailToggle:(e,t)=>{var i,s;const{itemJsons:a}=t.props,[n]=a,l=null===(s=null===(i=null==n?void 0:n.itemStateDetailContent)||void 0===i?void 0:i.useDataSource)||void 0===s?void 0:s.dataSourceId;return this.isDataSourceAccessible(l)?"":(0,o.jsx)(r.Alert,{buttonType:"tertiary",form:"tooltip",size:"small",type:"error",text:this.formatMessage("dataSourceCreateError")})},onUpdateItem:(e,t)=>{const{itemJsons:i}=t.props,[s,a]=i;this.onItemUpdated(a,+s.itemKey)},onClickItemBody:(e,t)=>{const{itemJsons:[i]}=t.props;this.onShowLayerPanel(+i.itemKey)}},W)),U===this.index&&f&&(0,o.jsx)(u.List,Object.assign({className:"setting-ui-unit-list-new",itemsJson:[{name:"......"}].map(((e,t)=>({itemStateDetailContent:e,itemKey:`${this.index}`,itemStateTitle:e.name,itemStateChecked:!0,itemStateCommands:[]}))),dndEnabled:!1,renderOverrideItemDetailToggle:()=>""},W)))),G&&(0,o.jsx)(n.SettingSection,{role:"group",title:this.formatMessage("snappingSettings"),"aria-label":this.formatMessage("snappingSettings")},(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.Select,{size:"sm",className:"w-100",value:L,onChange:e=>{this.onPropertyChange("snapSettingMode",e.target.value)}},(0,o.jsx)("option",{value:a.Prescriptive},this.formatMessage("prescriptiveMode")),(0,o.jsx)("option",{value:a.Flexible},this.formatMessage("flexibleMode")))),L===a.Prescriptive?(0,o.jsx)(O.Fragment,null,(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.Label,{className:"d-flex align-items-center"},(0,o.jsx)(r.Checkbox,{checked:I,className:"mr-1",onChange:e=>{this.onPropertyChange("defaultSelfEnabled",e.target.checked)}}),this.formatMessage("selfSnapping"))),(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.Label,{className:"d-flex align-items-center"},(0,o.jsx)(r.Checkbox,{checked:D,className:"mr-1",onChange:e=>{this.onPropertyChange("defaultFeatureEnabled",e.target.checked)}}),this.formatMessage("featureSnapping")))):(0,o.jsx)(O.Fragment,null,(0,o.jsx)(n.SettingRow,{label:this.formatMessage("selfSnapping")},(0,o.jsx)(r.Switch,{className:"can-x-switch",checked:M,"data-key":"selfSnapping",onChange:e=>{this.onPropertyChange("selfSnapping",e.target.checked)},"aria-label":this.formatMessage("selfSnapping")})),M&&(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.Label,{className:"d-flex align-items-center"},(0,o.jsx)(r.Checkbox,{checked:I,className:"mr-1",onChange:e=>{this.onPropertyChange("defaultSelfEnabled",e.target.checked)}}),this.formatMessage("defaultEnabled"))),(0,o.jsx)(n.SettingRow,{label:this.formatMessage("featureSnapping")},(0,o.jsx)(r.Switch,{className:"can-x-switch",checked:T,"data-key":"featureSnapping",onChange:e=>{this.onPropertyChange("featureSnapping",e.target.checked)},"aria-label":this.formatMessage("featureSnapping")})),T&&(0,o.jsx)(n.SettingRow,null,(0,o.jsx)(r.Label,{className:"d-flex align-items-center"},(0,o.jsx)(r.Checkbox,{checked:D,className:"mr-1",onChange:e=>{this.onPropertyChange("defaultFeatureEnabled",e.target.checked)}}),this.formatMessage("defaultEnabled")))),(0,o.jsx)(n.SettingRow,{flow:"wrap",label:this.formatMessage("chooseDefault"),className:"select-option"},(0,o.jsx)(r.AdvancedSelect,{size:"sm",title:this.formatMessage("chooseDefault"),fluid:!0,hideCheckAll:!1,hideBottomTools:!0,hideSearchInput:!0,staticValues:this.getAllLayersOptions(),sortValuesByLabel:!1,isMultiple:!0,selectedValues:this.getSnapLayers(k),onChange:this.onSnapLayersChange,"aria-label":this.formatMessage("chooseDefault"),buttonProps:{disabled:!b}}))))),0===U&&!f&&(0,o.jsx)("div",{className:"empty-placeholder w-100"},(0,o.jsx)("div",{className:"empty-placeholder-inner"},(0,o.jsx)("div",{className:"empty-placeholder-icon"},(0,o.jsx)(ae,{size:48})),(0,o.jsx)("div",{className:"empty-placeholder-text",id:"edit-blank-msg",dangerouslySetInnerHTML:{__html:this.formatMessage("editBlankStatus",{EditString:z,ModeString:H})}}))),U>0&&(0,o.jsx)(n.SettingSection,{role:"group","aria-label":this.formatMessage("iconGroup_general"),title:this.formatMessage("iconGroup_general")},G&&(0,o.jsx)(O.Fragment,null,(0,o.jsx)(n.SettingRow,{label:this.formatMessage("tooltip")},(0,o.jsx)(r.Switch,{className:"can-x-switch",checked:R,"data-key":"tooltip",onChange:e=>{this.onPropertyChange("tooltip",e.target.checked)},"aria-label":this.formatMessage("tooltip")})),(0,o.jsx)(n.SettingRow,{label:this.formatMessage("templateFilter")},(0,o.jsx)(r.Switch,{className:"can-x-switch",checked:$,"data-key":"templateFilter",onChange:e=>{this.onPropertyChange("templateFilter",e.target.checked)},"aria-label":this.formatMessage("templateFilter")})),(0,o.jsx)(n.SettingRow,{label:this.formatMessage("relatedRecords")},(0,o.jsx)(r.Switch,{className:"can-x-switch",checked:F,"data-key":"relatedRecords",onChange:e=>{this.onPropertyChange("relatedRecords",e.target.checked)},"aria-label":this.formatMessage("relatedRecords")})),(0,o.jsx)(n.SettingRow,{label:this.formatMessage("runtimeDataEditing")},(0,o.jsx)(r.Switch,{className:"can-x-switch",checked:P,"data-key":"liveDataEditing",onChange:e=>{this.onPropertyChange("liveDataEditing",e.target.checked)},"aria-label":this.formatMessage("runtimeDataEditing")}))),V&&(0,o.jsx)(O.Fragment,null,(0,o.jsx)(n.SettingRow,{flow:"wrap",label:this.formatMessage("description")},(0,o.jsx)(r.TextArea,{className:"w-100",height:90,"aria-label":this.formatMessage("description"),placeholder:this.formatMessage("editFieldDescription"),defaultValue:null!==(h=S.description)&&void 0!==h?h:"",onBlur:e=>{this.onPropertyChange("description",e.target.value)}})),(0,o.jsx)(n.SettingRow,{flow:"wrap",label:this.formatMessage("noDataMessage")},(0,o.jsx)(r.TextArea,{className:"w-100",height:75,"aria-label":this.formatMessage("noDataMessage"),placeholder:this.formatMessage("noDeataMessageDefaultText"),defaultValue:S.noDataMessage,onBlur:e=>{this.onPropertyChange("noDataMessage",e.target.value)}})))),V&&U>0&&(0,o.jsx)(K,{views:null!==(m=S.views)&&void 0!==m?m:(0,o.Immutable)([]),viewsEnabled:!!S.viewsEnabled,layersConfig:S.layersConfig,intl:this.props.intl,theme:w,onViewsChange:e=>{this.onPropertyChange("views",(0,o.Immutable)(e))},onViewsEnabledChange:e=>{this.onPropertyChange("viewsEnabled",e)}}),(0,o.jsx)(re.JimuMapViewComponent,{useMapWidgetId:null==x?void 0:x[0],onViewsCreate:this.onViewsCreate}),(0,o.jsx)(n.SidePopper,{isOpen:f&&!o.urlUtils.getAppIdPageIdFromUrl().pageId,position:"right",toggle:this.onCloseLayerPanel,trigger:null===(g=this.sidePopperTrigger)||void 0===g?void 0:g.current,backToFocusNode:this.state.popperFocusNode},(0,o.jsx)(N,Object.assign({},S.layersConfig.asMutable({deep:!0})[this.index],{intl:this.props.intl,theme:w,editorConfig:this.props.config,layerEditingEnabled:Y,dataSourceChange:this.dataSourceChangeSave,filterDs:this.onFilterDs,optionChange:this.optionChangeSave,multiOptionsChange:this.multiOptionsChangeSave,onClose:this.onCloseLayerPanel}))),v&&(0,o.jsx)(r.ConfirmDialog,{level:"warning",title:this.formatMessage("changeModeConfirmTitle"),hasNotShowAgainOption:!1,content:this.formatMessage("changeModeConfirmTips"),onConfirm:this.handleChangeModeOk,onClose:this.handleChangeModeClose})))}}de.mapExtraStateProps=(e,t)=>{var i,s;return{activeTabId:null===(s=null===(i=null==e?void 0:e.appStateInBuilder)||void 0===i?void 0:i.widgetsState[t.id])||void 0===s?void 0:s.activeTabId}};const ce=de;function pe(e){c.p=e}})(),p})())}}}));