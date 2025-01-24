import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import DrawingCanvas from "./canvas/DrawingCanvas";
import GetStarted from "./components/GetStarted";

const App = () => {
  const [showGetStarted, setShowGetStarted] = useState(true);

  const handleGetStarted = () => {
    setShowGetStarted(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {showGetStarted ? (
        <GetStarted onGetStarted={handleGetStarted} />
      ) : (
        <DrawingCanvas
          style={styles.canvas}
          strokeColor="#026440"
          strokeWidth={3}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 10,
  },
  canvas: {
    flex: 1,
  },
  drawingsList: {
    height: 50,
    backgroundColor: "#f0f0f0",
  },
  drawingItem: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  selectedDrawing: {
    backgroundColor: "#b0b0b0",
  },
});

export default App;
