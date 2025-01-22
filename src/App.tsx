import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import DrawingCanvas from "./components/DrawingCanvas";
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
          strokeColor="#000000"
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
  canvas: {
    flex: 1,
  },
});

export default App;
