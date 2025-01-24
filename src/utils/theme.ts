
interface Theme {
  background: string
  surface: string
  text: string
  primary: string
  secondary: string
  border: string
  danger: string
}

export const createTheme = (isDarkMode: boolean): Theme => {
  return {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    surface: isDarkMode ? "#1E1E1E" : "#F5F5F5",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    primary: isDarkMode ? "#BB86FC" : "#6200EE",
    secondary: isDarkMode ? "#03DAC6" : "#03DAC5",
    border: isDarkMode ? "#333333" : "#E0E0E0",
    danger: "#CF6679",
  }
}


