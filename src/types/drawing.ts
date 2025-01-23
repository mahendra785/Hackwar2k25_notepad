import type { ViewStyle } from "react-native"

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

export interface ExportSelection {
  startX: number
  startY: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export type CanvasMode = "draw" | "select" | "erase" | "export"
export type ThemeMode = "light" | "dark" | "system"

export interface SelectionBox {
  startX: number
  startY: number
  width: number
  height: number
  visible: boolean
}

export interface JsonData {
  id: string
  paths: PathData[]
}


