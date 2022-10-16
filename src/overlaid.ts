import { ServerAPI } from 'decky-frontend-lib'

export interface Overlay {
    name: string
    widgets: Widget[]
}

export interface WidgetPosition {
    width: number
    height: number
    vertical_anchor: number
    horizontal_anchor: number
    x_offset: number
    y_offset: number
}

export interface Widget extends WidgetPosition {
    id: string
    type: string
    content: string
    color: number[]
    bg_color: number[]
}

export interface ServerAPIProviderType {
  serverAPI: ServerAPI
}
