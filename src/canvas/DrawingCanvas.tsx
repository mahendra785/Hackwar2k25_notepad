import type React from "react"
import { useState, useRef, useCallback } from "react"
import {
  View,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  useColorScheme,
  Modal,
  SafeAreaView,
  StatusBar,
  type ViewStyle,
  type GestureResponderEvent,
  Animated,
} from "react-native"
import Svg, { Path, Rect, G } from "react-native-svg"
import { captureRef } from "react-native-view-shot"
import { Feather } from "@expo/vector-icons"
import type { DrawingCanvasProps, PathData, CanvasMode, ThemeMode, JsonData } from "../types/drawing"
import { createTheme } from "../utils/theme"
import { FloatingButton } from "../components/floating-button"
import { JsonNavbar } from "../components/json-navbar"

interface Point {
  x: number
  y: number
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  style,
  strokeColor = "#000000",
  strokeWidth = 3,
  onExport,
  forceDarkMode,
}) => {
  const systemTheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<ThemeMode>("system")
  const isDarkMode = forceDarkMode || (themeMode === "system" ? systemTheme === "dark" : themeMode === "dark")
  const theme = createTheme(isDarkMode)

  const [jsons, setJsons] = useState<JsonData[]>([{ id: "1", paths: [] }])
  const [currentJsonId, setCurrentJsonId] = useState<string>("1")
  const currentJson = jsons.find((json) => json.id === currentJsonId) || jsons[0]
  const paths = currentJson.paths
  const [showJsonNav, setShowJsonNav] = useState(false)

  const [currentPath, setCurrentPath] = useState<string>("")
  const [mode, setMode] = useState<CanvasMode>("draw")
  const [selectionBox, setSelectionBox] = useState({
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
    visible: false,
  })
  const [exportSelection, setExportSelection] = useState<ExportSelection | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  const canvasRef = useRef<View>(null)
  const exportAreaRef = useRef<View>(null)
  const buttonScaleAnim = useRef(new Animated.Value(1)).current

  const animateButton = (scale: number) => {
    Animated.spring(buttonScaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      friction: 3,
    }).start()
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent

      if (mode === "draw") {
        setCurrentPath(`M ${locationX} ${locationY}`)
      } else if (mode === "select" || mode === "export") {
        setSelectionBox({
          startX: locationX,
          startY: locationY,
          width: 0,
          height: 0,
          visible: true,
        })
      }
    },

    onPanResponderMove: (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent

      if (mode === "draw") {
        setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`)
      } else if (mode === "select" || mode === "export") {
        setSelectionBox((prev) => ({
          ...prev,
          width: locationX - prev.startX,
          height: locationY - prev.startY,
        }))
      }
    },

    onPanResponderRelease: () => {
      if (mode === "draw" && currentPath) {
        const newPath = {
          id: Date.now().toString(),
          path: currentPath,
          color: isDarkMode ? "#FFFFFF" : strokeColor,
          width: strokeWidth,
        }
        updatePaths([...paths, newPath])
        console.log("Paths JSON:", JSON.stringify([...paths, newPath], null, 2))
        setCurrentPath("")
      } else if (mode === "select") {
        handleSelection()
      } else if (mode === "export") {
        handleExportSelection()
      }
      setSelectionBox((prev) => ({ ...prev, visible: false }))
    },
  })

  const handleSelection = useCallback(() => {
    const selected = new Set<string>()
    paths.forEach((path) => {
      // Simple selection logic - enhance as needed
      selected.add(path.id)
    })
    setSelectedPaths(selected)
  }, [paths, selectionBox])

  const handleExportSelection = () => {
    if (selectionBox.width && selectionBox.height) {
      setExportSelection({
        startX: selectionBox.startX,
        startY: selectionBox.startY,
        width: selectionBox.width,
        height: selectionBox.height,
      })
      setShowExportModal(true)
    }
  }

  const handleExport = async (selectedArea = false) => {
    try {
      const ref = selectedArea ? exportAreaRef : canvasRef
      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
      })
      onExport?.(uri)
      setShowExportModal(false)
      setExportSelection(null)
      Alert.alert("Success", "Drawing exported successfully!")
    } catch (error) {
      Alert.alert("Error", "Failed to export drawing")
      console.error("Export error:", error)
    }
  }

  const cycleTheme = () => {
    setThemeMode((current) => {
      switch (current) {
        case "light":
          return "dark"
        case "dark":
          return "system"
        case "system":
          return "light"
      }
    })
  }

  const renderModeButton = (buttonMode: CanvasMode, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.border },
        mode === buttonMode && { backgroundColor: theme.primary },
      ]}
      onPress={() => setMode(buttonMode)}
      onPressIn={() => animateButton(0.95)}
      onPressOut={() => animateButton(1)}
    >
      <Feather name={icon} size={24} color={mode === buttonMode ? "white" : theme.text} />
      <Text style={[styles.buttonText, { color: mode === buttonMode ? "white" : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  )

  const renderExportModal = () => (
    <Modal transparent visible={showExportModal} onRequestClose={() => setShowExportModal(false)}>
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Export Options</Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.primary }]}
            onPress={() => handleExport(true)}
          >
            <Text style={styles.modalButtonText}>Export Selected Area</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.primary }]}
            onPress={() => handleExport(false)}
          >
            <Text style={styles.modalButtonText}>Export Entire Canvas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.danger }]}
            onPress={() => setShowExportModal(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  const updatePaths = (newPaths: PathData[]) => {
    setJsons((prev) => prev.map((json) => (json.id === currentJsonId ? { ...json, paths: newPaths } : json)))
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }, style]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.toolbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {renderModeButton("draw", "Draw", "edit-2")}
        {renderModeButton("select", "Select", "square")}
        {renderModeButton("export", "Export", "share")}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={cycleTheme}
        >
          <Feather name={isDarkMode ? "moon" : "sun"} size={24} color={theme.text} />
          <Text style={[styles.buttonText, { color: theme.text }]}>
            {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[styles.drawingArea, { backgroundColor: theme.background }]}
        ref={canvasRef}
        {...panResponder.panHandlers}
      >
        <Svg style={StyleSheet.absoluteFill}>
          <G>
            {paths.map((pathData) => (
              <Path
                key={pathData.id}
                d={pathData.path}
                stroke={selectedPaths.has(pathData.id) ? theme.success : pathData.color}
                strokeWidth={pathData.width}
                fill="none"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={isDarkMode ? "#FFFFFF" : strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
              />
            )}
            {selectionBox.visible && (
              <Rect
                x={selectionBox.startX}
                y={selectionBox.startY}
                width={selectionBox.width}
                height={selectionBox.height}
                fill={theme.selection}
                stroke={theme.primary}
                strokeWidth={2}
                strokeDasharray={[5, 5]}
              />
            )}
          </G>
        </Svg>
      </View>

      <View style={[styles.bottomToolbar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: theme.danger }]}
          onPress={() => {
            Alert.alert("Clear Canvas", "Are you sure you want to clear the canvas?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Clear",
                style: "destructive",
                onPress: () => {
                  updatePaths([])
                  setCurrentPath("")
                  setSelectedPaths(new Set())
                },
              },
            ])
          }}
        >
          <Feather name="trash-2" size={24} color="white" />
          <Text style={styles.mainButtonText}>Clear All</Text>
        </TouchableOpacity>
        <FloatingButton onPress={() => setShowJsonNav(true)} theme={theme} />

      </View>


      <JsonNavbar
        visible={showJsonNav}
        jsons={jsons}
        currentJsonId={currentJsonId}
        onSelectJson={(id) => {
          if (id === (jsons.length + 1).toString()) {
            setJsons((prev) => [...prev, { id, paths: [] }])
          }
          setCurrentJsonId(id)
          setShowJsonNav(false)
        }}
        onClose={() => setShowJsonNav(false)}
        theme={theme}
      />
      {renderExportModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    borderBottomWidth: 1,
  },
  bottomToolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderTopWidth: 1,
  },
  button: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 12,
    marginTop: 4,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  mainButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  drawingArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
    borderRadius: 16,
    width: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
})

export default DrawingCanvas

