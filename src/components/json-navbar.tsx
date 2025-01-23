import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { JsonData } from "../types/drawing";

interface JsonNavbarProps {
  visible: boolean;
  jsons: JsonData[];
  currentJsonId: string;
  onSelectJson: (id: string) => void;
  onClose: () => void;
  theme: ReturnType<typeof import("../utils/theme").createTheme>;
  loading?: boolean;
}

export const JsonNavbar: React.FC<JsonNavbarProps> = ({
  visible,
  jsons,
  currentJsonId,
  onSelectJson,
  onClose,
  theme,
  loading = false,
}) => {
  const translateX = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: visible ? 0 : 300,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderLeftColor: theme.border,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Your Notebook</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => {
              const newId = (jsons.length + 1).toString();
              onSelectJson(newId);
            }}
            style={styles.headerButton}
            disabled={loading}
          >
            <Feather
              name="plus"
              size={20}
              color={loading ? theme.border : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Feather name="x" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.list}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          jsons.map((json) => (
            <TouchableOpacity
              key={json.id}
              style={[
                styles.item,
                {
                  backgroundColor:
                    json.id === currentJsonId ? theme.primary : "transparent",
                },
              ]}
              onPress={() => onSelectJson(json.id)}
            >
              <Feather
                name="file-text"
                size={20}
                color={json.id === currentJsonId ? "white" : theme.text}
              />
              <Text
                style={[
                  styles.itemText,
                  {
                    color: json.id === currentJsonId ? "white" : theme.text,
                  },
                ]}
              >
                Note {json.id}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 300,
    borderLeftWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  itemText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  pathCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
});
