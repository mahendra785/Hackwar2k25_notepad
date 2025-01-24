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
  Linking,
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
import WebView from "react-native-webview"

interface Point {
  x: number
  y: number
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  style,
  strokeColor = "#00ff00",
  strokeWidth = 3,
  onExport,
  forceDarkMode,
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isRecommending, setIsRecommending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [jsons, setJsons] = useState<JsonData[]>([{ id: "1", paths: [] }])
  const [currentJsonId, setCurrentJsonId] = useState<string>("1")
  const currentJson = jsons.find((json) => json.id === currentJsonId) || jsons[0]
  const paths = currentJson.paths
  const [showJsonNav, setShowJsonNav] = useState(false)

  const [currentPath, setCurrentPath] = useState<string>("")
  const [mode, setMode] = useState<CanvasMode>("draw")
  const [isEraserMode, setIsEraserMode] = useState(false)
  const [selectionBox, setSelectionBox] = useState({
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
    visible: false,
  })
  const systemTheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system")
  const [isDarkMode, setIsDarkMode] = useState(false) // Added state for dark mode

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
  // Determine current theme based on mode and system preference
  const isDarkModeFunction = (() => {
    if (forceDarkMode) return true
    if (themeMode === "system") return systemTheme === "dark"
    return themeMode === "dark"
  })()

  const [exportSelection, setExportSelection] = useState<ExportSelection | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [latexResult, setLatexResult] = useState<string>("")
  const [showLatexModal, setShowLatexModal] = useState(false)

  const canvasRef = useRef<View>(null)
  const exportAreaRef = useRef<View>(null)
  const buttonScaleAnim = useRef(new Animated.Value(1)).current

  const theme = isDarkMode
    ? {
        background: "#000000",
        surface: "#1C1C1C",
        primary: "#007AFF",
        border: "#404040",
        text: "#FFFFFF",
        danger: "#FF3B30",
        success: "#4CAF50", // Added success color
      }
    : {
        background: "#FFFFFF",
        surface: "#F2F2F2",
        primary: "#007AFF",
        border: "#E0E0E0",
        text: "#000000",
        danger: "#FF3B30",
        success: "#4CAF50", // Added success color
      }

  const animateButton = (scale: number) => {
    Animated.spring(buttonScaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      friction: 3,
    }).start()
  }
  const isPathNearPoint = (pathString: string, x: number, y: number, radius = 10): boolean => {
    const points = pathString.match(/(\d+(\.\d+)?)/g)?.map(Number)
    if (!points) return false

    for (let i = 0; i < points.length; i += 2) {
      const pathX = points[i]
      const pathY = points[i + 1]
      const distance = Math.sqrt(Math.pow(pathX - x, 2) + Math.pow(pathY - y, 2))
      if (distance < radius) return true
    }
    return false
  }
  const toggleTheme = () => setIsDarkMode((prev) => !prev) // Added toggleTheme function

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent

      if (mode === "draw") {
        setCurrentPath(`M ${locationX} ${locationY}`)
      } else if (mode === "erase" || isEraserMode) {
        // Immediately start erasing on first touch
        updatePaths(paths.filter((path) => !isPathNearPoint(path.path, locationX, locationY)))
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
      } else if (mode === "erase" || isEraserMode) {
        // Remove paths that intersect with the current eraser position
        updatePaths(paths.filter((path) => !isPathNearPoint(path.path, locationX, locationY)))
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
        setCurrentPath("")
      } else if (mode === "select") {
        handleSelection()
      } else if (mode === "export") {
        handleExportSelection()
      }
      setSelectionBox((prev) => ({ ...prev, visible: false }))
    },
  })

  // Modify the renderModeButton function to include eraser mode toggle
  const renderModeButton = (buttonMode: CanvasMode, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.border },
        mode === buttonMode && { backgroundColor: theme.primary },
      ]}
      onPress={() => {
        if (buttonMode === "erase") {
          setIsEraserMode(!isEraserMode)
        } else {
          setMode(buttonMode)
          setIsEraserMode(false)
        }
      }}
      onPressIn={() => animateButton(0.95)}
      onPressOut={() => animateButton(1)}
    >
      <Feather
        name={icon}
        size={24}
        color={mode === buttonMode || (buttonMode === "erase" && isEraserMode) ? "white" : theme.text}
      />
      <Text
        style={[
          styles.buttonText,
          {
            color: mode === buttonMode || (buttonMode === "erase" && isEraserMode) ? "white" : theme.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )

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

  const debouncedSave = useCallback(
    debounce(() => {
      console.log("Debounced save triggered")
      handleExport(false)
    }, 10000),
    [],
  )

  const handleExport = async (selectedArea = false) => {
    try {
      setIsExporting(true)
      const ref = selectedArea ? exportAreaRef : canvasRef

      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
      })

      if (!uri) {
        throw new Error("Failed to capture the canvas. URI is invalid.")
      }

      const formData = new FormData()
      formData.append("file", {
        uri,
        type: "image/png",
        name: "drawing.png",
      } as any)

      const backendResponse = await fetch("https://hackwar-be.onrender.com/process-math", {
        method: "POST",
        body: formData,
      })

      if (!backendResponse.ok) {
        throw new Error(`Upload failed. Status: ${backendResponse.status}`)
      }

      const data = await backendResponse.json()

      if (data.choices && data.choices[0]?.message?.content) {
        const teacherGuidance = data.choices[0].message.content
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
    } finally {
      setIsExporting(false)
    }
  }

  // Update the recommendations button with loading state
  const RecommendationsButton = () => (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={async () => {
        try {
          setIsRecommending(true)
          const uri = await captureRef(canvasRef, {
            format: "png",
            quality: 1,
          })

          if (!uri) {
            throw new Error("Failed to capture the canvas")
          }

          const formData = new FormData()
          formData.append("file", {
            uri,
            type: "image/png",
            name: "drawing.png",
          } as any)

          const response = await fetch("https://hackwar-be.onrender.com/recommendation-image", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
          }

          const data = await response.json()
          console.log(data);

          const resultContent = (
            <View>
              <Text style={{ color: theme.text, marginBottom: 10 }}>Processed Text: {data.processed_text}</Text>
              <Text style={{ color: theme.text, marginBottom: 10 }}>Topic: {data.extracted_topic}</Text>
              <Text style={{ color: theme.text, marginBottom: 10 }}>Recommendations:</Text>
              {data.recommendations.map((rec: any, index: number) => (
                <TouchableOpacity key={index} onPress={() => Linking.openURL(rec.link)} style={{ marginVertical: 5 }}>
                  <Text
                    style={{
                      color: theme.primary,
                      textDecorationLine: "underline",
                      marginLeft: 10,
                    }}
                  >
                    {index + 1}. {rec.title}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* WebView moved after recommendations */}
              <View style={styles.webViewContainer}>
                <WebView
                  style={styles.webView}
                  source={{ uri: data.recommendations[0].link }} // Make sure video_url is provided in the data
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                />
              </View>
            </View>
          )

          setLatexResult(resultContent)
          setShowLatexModal(true)
        } catch (error: any) {
          Alert.alert("Error", error.message || "An error occurred while getting recommendations")
          console.error("Recommendation error:", error)
        } finally {
          setIsRecommending(false)
        }
      }}
    >
      {isRecommending ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <>
          <Feather name="book" size={24} color={theme.text} />
          <Text style={[styles.buttonText, { color: theme.text }]}>Recommend</Text>
        </>
      )}
    </TouchableOpacity>
  )

  // Update the export modal content
  const ExportModal = () => (
    <Modal transparent visible={showExportModal} onRequestClose={() => setShowExportModal(false)}>
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Export Options</Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.primary }]}
            onPress={() => handleExport(false)}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.modalButtonText}>Export Entire Canvas</Text>
            )}
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
      const updated = prev.map((json) =>
        json.id === currentJsonId
          ? {
              ...json,
              paths: newPaths.map((path) => ({
                ...path,
                color: isDarkMode ? "#FFFFFF" : "#000000",
              })),
            }
          : json,
      )
      return updated
    })
    debouncedSave()
  }

  // Load saved files on mount
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

  // Save files whenever they change

  useEffect(() => {
    console.log("Paths changed, triggering debounced save")
    debouncedSave()
    return () => {
      debouncedSave.cancel()
    }
  }, [paths, debouncedSave])

  useEffect(() => {
    if (!loading) {
      storage.saveFiles(jsons)
    }
  }, [jsons, loading])

  useEffect(() => {
    // Update all paths when the theme changes
    setJsons((prev) =>
      prev.map((json) => ({
        ...json,
        paths: json.paths.map((path) => ({
          ...path,
          color: isDarkMode ? "#FFFFFF" : "#000000",
        })),
      })),
    )
  }, [isDarkMode])

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
        {renderModeButton("export", "Export", "share")}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={toggleTheme} // Updated onPress handler
        >
          <Feather
            name={isDarkMode ? "sun" : "moon"} // Updated icon based on isDarkMode
            size={24}
            color={theme.text}
          />
          <Text style={[styles.buttonText, { color: theme.text }]}>{isDarkMode ? "Light" : "Dark"}</Text>
        </TouchableOpacity>
        <RecommendationsButton />
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
                stroke={
                  mode === "erase"
                    ? "rgba(255,0,0,0.3)"
                    : selectedPaths.has(pathData.id)
                      ? theme.success
                      : isDarkMode
                        ? "#026440"
                        : "#026440"
                }
                strokeWidth={mode === "erase" ? pathData.width + 10 : pathData.width}
                fill="none"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={mode === "erase" ? "rgba(255,0,0,0.3)" : isDarkMode ? "#026440" : strokeColor}
                strokeWidth={mode === "erase" ? strokeWidth + 10 : strokeWidth}
                fill="none"
              />
            )}
            {selectionBox.visible && (
              <Rect
                x={selectionBox.startX}
                y={selectionBox.startY}
                width={selectionBox.width}
                height={selectionBox.height}
                fill="rgba(0, 255, 0, 0.1)"
                stroke="#026440"
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
      <ExportModal />
      <LatexModal
        visible={showLatexModal}
        onClose={() => setShowLatexModal(false)}
        content={latexResult}
        theme={theme}
        title="Analysis Result"
        webViewSource="https://www.youtube.com/embed/rYG1D5lUE4I"
        isRecommendation={isRecommending}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webViewContainer: {
    height: 200, // Fixed height for the WebView section
    marginVertical: 10,
    borderRadius: 8,
    overflow: "hidden", // Ensure the WebView content doesn't overflow
  },
  webView: {
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
  eraserIndicator: {
    position: "absolute",
    top: 60, // Adjust based on your toolbar height
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    backgroundColor: "rgba(255,0,0,0.1)",
    padding: 5,
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
    width: "40%",
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

