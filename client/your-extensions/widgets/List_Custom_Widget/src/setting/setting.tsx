/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { React, jsx, Immutable, type UseDataSource, type IMFieldSchema, type DataSource, Fragment } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { SettingSection, SettingRow, MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import { DataSourceSelector, AllDataSourceTypes, FieldSelector } from 'jimu-ui/advanced/data-source-selector'
import { TextInput, Switch, Label } from 'jimu-ui'
import { type IMConfig } from '../config'

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
    const { config, id, useDataSources, onSettingChange } = props

    const onDataSourceChange = (useDataSources: UseDataSource[]) => {
        onSettingChange({ id, useDataSources })
    }

    const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
        onSettingChange({
            id,
            config: config.set('mapWidgetId', useMapWidgetIds?.[0] || '')
        })
    }

    const onCategoryFieldChange = (allSelectedFields: IMFieldSchema[]) => {
        onSettingChange({
            id,
            config: config.set('categoryField', allSelectedFields[0]?.jimuName || '')
        })
    }

    const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingChange({
            id,
            config: config.set('title', e.target.value)
        })
    }

    const onButtonLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingChange({
            id,
            config: config.set('buttonLabel', e.target.value)
        })
    }

    const onAllItemsLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingChange({
            id,
            config: config.set('allItemsLabel', e.target.value)
        })
    }

    return (
        <div className="widget-setting-list-category p-2">
            {/* ── Widget Labels ── */}
            <SettingSection title="Widget Labels">
                <SettingRow label="Title">
                    <TextInput
                        type="text"
                        className="w-75"
                        placeholder="Select Category"
                        value={config.title !== undefined ? config.title : 'Select Category'}
                        onChange={onTitleChange}
                    />
                </SettingRow>
                <SettingRow label="Button Label">
                    <TextInput
                        type="text"
                        className="w-75"
                        placeholder="اختر التصنيف"
                        value={config.buttonLabel !== undefined ? config.buttonLabel : 'اختر التصنيف'}
                        onChange={onButtonLabelChange}
                    />
                </SettingRow>
                <SettingRow label="All Items Label">
                    <TextInput
                        type="text"
                        className="w-75"
                        placeholder="كل التصنيفات"
                        value={config.allItemsLabel !== undefined ? config.allItemsLabel : 'كل التصنيفات'}
                        onChange={onAllItemsLabelChange}
                    />
                </SettingRow>
            </SettingSection>

            {/* ── Data Source ── */}
            <SettingSection title="Data Source">
                <SettingRow>
                    <DataSourceSelector
                        types={Immutable([AllDataSourceTypes.FeatureLayer])}
                        useDataSources={useDataSources}
                        mustUseDataSource
                        onChange={onDataSourceChange}
                        widgetId={id}
                    />
                </SettingRow>
            </SettingSection>

            {/* ── Map Connection ── */}
            <SettingSection title="Map Widget (For Zoom)">
                <SettingRow>
                    <MapWidgetSelector
                        useMapWidgetIds={config?.mapWidgetId ? Immutable([config.mapWidgetId]) : Immutable([])}
                        onSelect={onMapWidgetSelected}
                    />
                </SettingRow>
            </SettingSection>

            {/* ── Field Selectors ── */}
            {useDataSources && useDataSources.length > 0 && (
                <SettingSection title="Category Field">
                    <SettingRow>
                        <FieldSelector
                            useDataSources={useDataSources}
                            onChange={onCategoryFieldChange}
                            selectedFields={config.categoryField ? Immutable([config.categoryField]) : Immutable([])}
                            isMultiple={false}
                            useDropdown={true}
                        />
                    </SettingRow>
                </SettingSection>
            )}
        </div>
    )
}
