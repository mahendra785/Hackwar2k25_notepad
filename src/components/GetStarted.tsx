import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from "react-native";

interface GetStartedProps {
  onGetStarted: () => void;
}

const GetStarted: React.FC<GetStartedProps> = ({ onGetStarted }) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.7);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "/api/placeholder/200/200" }}
            style={styles.image}
          />
        </View>

        <Text style={styles.title}>Welcome to NoTutor</Text>

        <Text style={styles.subtitle}>
          Express your creativity with our simple and intuitive drawing canvas
        </Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.featureList}>
            <Text style={styles.feature}>✏️ Free-hand drawing</Text>
            <Text style={styles.feature}>🎨 Dark/Light mode</Text>
            <Text style={styles.feature}>📱 Export your artwork</Text>
            <Text style={styles.feature}>📐 Selection tools</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  imageContainer: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#ccc",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  featureList: {
    alignSelf: "stretch",
    marginBottom: 40,
    paddingHorizontal: 20,
    opacity: 0.8,
  },
  feature: {
    fontSize: 16,
    color: "#444",
    marginBottom: 12,
    paddingLeft: 10,
  },
  buttonWrapper: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#4D97FF",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default GetStarted;
