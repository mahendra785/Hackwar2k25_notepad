import { ViewStyle } from 'react-native';

export type ThemeMode = "light" | "dark" | "system"

export interface DrawingCanvasProps {
  style?: ViewStyle
  strokeColor?: string
  strokeWidth?: number
  onExport?: (uri: string) => void
  forceDarkMode?: boolean
}

export interface PathData {
  id: string
  path: string
  color: string
  width: number
}

export interface JsonData {
  id: string
  paths: PathData[]
}

export interface ExportSelection {
  startX: number
  startY: number
  width: number
  height: number
}

