import React, { useState } from "react";
import {
  View,
  PanResponder,
  StyleSheet,
  ViewStyle,
  PanResponderGestureState,
  GestureResponderEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";

interface DrawingCanvasProps {
  style?: ViewStyle;
  strokeColor?: string;
  strokeWidth?: number;
}

interface Point {
  x: number;
  y: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  style,
  strokeColor = "#000000",
  strokeWidth = 3,
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      setCurrentPath(`M ${locationX} ${locationY}`);
    },

    onPanResponderMove: (
      event: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => {
      const { locationX, locationY } = event.nativeEvent;
      setCurrentPath((prevPath) => `${prevPath} L ${locationX} ${locationY}`);
    },

    onPanResponderRelease: () => {
      setPaths((prevPaths) => [...prevPaths, currentPath]);
      setCurrentPath("");
    },
  });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath("");
  };

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
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
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default DrawingCanvas;
