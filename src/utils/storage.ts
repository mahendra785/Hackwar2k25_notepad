import AsyncStorage from "@react-native-async-storage/async-storage"
import type { JsonData } from "../types/drawing"

const STORAGE_KEY = "drawing-canvas-files"

export const storage = {
  async saveFiles(files: JsonData[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.error("Error saving files:", error)
    }
  },

  async loadFiles(): Promise<JsonData[]> {
    try {
      const files = await AsyncStorage.getItem(STORAGE_KEY)
      return files ? JSON.parse(files) : [{ id: "1", paths: [] }]
    } catch (error) {
      console.error("Error loading files:", error)
      return [{ id: "1", paths: [] }]
    }
  },
}

