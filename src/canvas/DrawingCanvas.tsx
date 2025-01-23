import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
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
  ActivityIndicator,
  type ViewStyle,
  type GestureResponderEvent,
  Animated,
} from "react-native"
import Svg, { Path, Rect, G } from "react-native-svg"
import { captureRef } from "react-native-view-shot"
import { Feather } from "@expo/vector-icons"
import type { DrawingCanvasProps, PathData, CanvasMode, ThemeMode, JsonData, ExportSelection } from "../types/drawing"
import { createTheme } from "../utils/theme"
import { storage } from "../utils/storage"
import { FloatingButton } from "../components/floating-button"
import { JsonNavbar } from "../components/json-navbar"
import LatexModal from "../components/LatexModal"
import debounce from "lodash.debounce"

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

  const [loading, setLoading] = useState(true)
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
  const [latexResult, setLatexResult] = useState<string>("")
  const [showLatexModal, setShowLatexModal] = useState(false)

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

      // Capture the canvas as an image and return a local URI
      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
      })

      if (!uri) {
        throw new Error("Failed to capture the canvas. URI is invalid.")
      }
      console.log("Captured URI:", uri)

      // Build multipart/form-data with the local file URI directly
      const formData = new FormData()
      formData.append("file", {
        uri, // The local URI from captureRef
        type: "image/png",
        name: "drawing.png",
      } as any)

      // Send the FormData to the backend

      const backendResponse = await fetch("https://hackwar-be.onrender.com/process-math", {
        method: "POST",
        body: formData,
      })

      if (!backendResponse.ok) {
        throw new Error(`Upload failed. Status: ${backendResponse.status}`)
      }

      const data = await backendResponse.json()
      console.log("Upload successful:", data)

      // Handle the DeepSeek response
      if (data.choices && data.choices[0]?.message?.content) {
        const teacherGuidance = data.choices[0].message.content

        // Format the response for display
        const formattedContent = `
    Teacher's Guidance:
    ${teacherGuidance}
  `

        setLatexResult(formattedContent.trim())
        setShowLatexModal(true)
      } else {
        setLatexResult("Analysis completed but no guidance was generated.")
        setShowLatexModal(true)
      }

      setShowExportModal(false)
      setExportSelection(null)
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unknown error occurred during analysis.")
      console.error("Analysis error:", error)
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
    setJsons((prev) => {
      const updated = prev.map((json) => (json.id === currentJsonId ? { ...json, paths: newPaths } : json))
      return updated
    })
    debouncedSave()
  }

  const handleExportAttachment = useCallback(() => {
    console.log("Exporting attachment")
    if (canvasRef.current) {
      captureRef(canvasRef, {
        format: "png",
        quality: 1,
      })
        .then((uri) => {
          console.log("Canvas captured:", uri)
          if (onExport) {
            onExport(uri)
          }
        })
        .catch((error) => {
          console.error("Error capturing canvas:", error)
        })
    }
  }, [onExport])

  const debouncedSave = useCallback(
    debounce(() => {
      console.log("Debounced save triggered")
      handleExport(false);
    }, 10000),
    [],
  )

  useEffect(() => {
    console.log("Paths changed, triggering debounced save")
    debouncedSave()
    return () => {
      debouncedSave.cancel()
    }
  }, [paths, debouncedSave])

  useEffect(() => {
    const loadSavedFiles = async () => {
      try {
        const savedFiles = await storage.loadFiles()
        setJsons(savedFiles)
        setCurrentJsonId(savedFiles[0]?.id || "1")
      } catch (error) {
        console.error("Error loading saved files:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSavedFiles()
  }, [])

  useEffect(() => {
    if (!loading) {
      storage.saveFiles(jsons)
    }
  }, [jsons, loading])

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
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
      </View>

      <FloatingButton onPress={() => setShowJsonNav(true)} theme={theme} />

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
      <LatexModal
        visible={showLatexModal}
        onClose={() => setShowLatexModal(false)}
        content={latexResult}
        theme={theme}
        title="Analysis Result"
      />
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
})

export default DrawingCanvas

