// Only the third-party ArcGIS runtime boundary is replaced; tests render the real widget.
import * as React from 'react'
export { React }
export const jsx = React.createElement
export const Loading = () => <span role="status">Loading categories</span>
export const LoadingType = { Secondary: 'secondary' }

export const sdkBoundary = {
  dataSource: null as any,
  mapView: null as any,
  messages: [] as StringSelectionChangeMessage[],
  info: {} as any,
  listeners: new Set<(info: any) => void>(),
  notify(info: any) {
    this.info = info
    this.listeners.forEach(listener => listener(info))
  }
}

export class StringSelectionChangeMessage {
  constructor(public widgetId: string, public str: string) {}
}

export const MessageManager = {
  getInstance: () => ({ publishMessage: (message: StringSelectionChangeMessage) => sdkBoundary.messages.push(message) })
}

export function DataSourceComponent(props: any) {
  React.useEffect(() => {
    void props.onDataSourceCreated(sdkBoundary.dataSource)
  }, [props.onDataSourceCreated])
  React.useEffect(() => {
    sdkBoundary.listeners.add(props.onDataSourceInfoChange)
    props.onDataSourceInfoChange(sdkBoundary.info)
    return () => { sdkBoundary.listeners.delete(props.onDataSourceInfoChange) }
  }, [props.onDataSourceInfoChange])
  return null
}

export function JimuMapViewComponent(props: any) {
  React.useEffect(() => { props.onActiveViewChange(sdkBoundary.mapView) }, [props.onActiveViewChange])
  return null
}
