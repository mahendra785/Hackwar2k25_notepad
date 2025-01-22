import React from "react";
import { SafeAreaView, StyleSheet, Button, View } from "react-native";
import DrawingCanvas from "./components/DrawingCanvas";

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <DrawingCanvas
        style={styles.canvas}
        strokeColor="#000000"
        strokeWidth={3}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  canvas: {
    flex: 1,
  },
});

export default App;
