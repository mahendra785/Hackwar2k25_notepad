export const createTheme = (isDarkMode: boolean) => ({
  background: isDarkMode ? "#121212" : "#F0F0F0",
  surface: isDarkMode ? "#1E1E1E" : "#FFFFFF",
  text: isDarkMode ? "#E1E1E1" : "#333333",
  border: isDarkMode ? "#333333" : "#E0E0E0",
  primary: "#4D97FF",
  success: "#4CAF50",
  danger: "#FF6B6B",
  selection: "rgba(77, 151, 255, 0.1)",
})


