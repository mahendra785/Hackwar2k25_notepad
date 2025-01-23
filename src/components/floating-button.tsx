import React from "react"
import { TouchableOpacity, StyleSheet, Animated } from "react-native"
import { Feather } from "@expo/vector-icons"

interface FloatingButtonProps {
  onPress: () => void
  theme: ReturnType<typeof import("../utils/theme").createTheme>
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ onPress, theme }) => {
  const scale = React.useRef(new Animated.Value(1)).current

  const animatePress = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 3,
    }).start()
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={onPress}
        onPressIn={() => animatePress(0.95)}
        onPressOut={() => animatePress(1)}
      >
        <Feather name="list" size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    right: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
})


