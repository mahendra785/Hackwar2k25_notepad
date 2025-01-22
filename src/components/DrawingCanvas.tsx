import React, { useState, useRef } from "react";
import {
  View,
  PanResponder,
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
  TouchableOpacity,
  Text,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { captureRef } from "react-native-view-shot";

interface DrawingCanvasProps {
  style?: ViewStyle;
  strokeColor?: string;
  strokeWidth?: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  style,
  strokeColor = "#000000",
  strokeWidth = 3,
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
  });

  const canvasRef = useRef<View>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event: GestureResponderEvent) => {
      if (!isSelecting) {
        const { locationX, locationY } = event.nativeEvent;
        setCurrentPath(`M ${locationX} ${locationY}`);
      } else {
        const { locationX, locationY } = event.nativeEvent;
        setSelectionBox({
          startX: locationX,
          startY: locationY,
          width: 0,
          height: 0,
        });
      }
    },

    onPanResponderMove: (event: GestureResponderEvent) => {
      if (!isSelecting) {
        const { locationX, locationY } = event.nativeEvent;
        setCurrentPath((prevPath) => `${prevPath} L ${locationX} ${locationY}`);
      } else {
        const { locationX, locationY } = event.nativeEvent;
        setSelectionBox((prevBox) => ({
          ...prevBox,
          width: locationX - prevBox.startX,
          height: locationY - prevBox.startY,
        }));
      }
    },

    onPanResponderRelease: () => {
      if (!isSelecting) {
        setPaths((prevPaths) => [...prevPaths, currentPath]);
        setCurrentPath("");
      }
    },
  });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath("");
  };

  const handleExport = async () => {
    try {
      const uri = await captureRef(canvasRef, {
        format: "png",
        quality: 1,
      });
      console.log("Exported URI:", uri);
      // You can now share or save this PNG file.
    } catch (error) {
      console.error("Failed to export image:", error);
    }
  };

  const handleSelect = () => {
    setIsSelecting(true);
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={styles.drawingArea}
        ref={canvasRef}
        {...panResponder.panHandlers}
      >
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
          ) : null}
          {isSelecting && (
            <Rect
              x={selectionBox.startX}
              y={selectionBox.startY}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(0, 0, 255, 0.3)"
              stroke="blue"
              strokeWidth={1}
            />
          )}
        </Svg>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleClear}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSelect}>
          <Text style={styles.buttonText}>Select</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleExport}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    margin: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  drawingArea: {
    flex: 1,
  },
});

export default DrawingCanvas;
