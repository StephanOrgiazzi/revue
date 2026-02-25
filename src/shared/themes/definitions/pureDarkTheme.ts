import { createTheme } from "@/shared/themes/themePrimitives";

export const pureDarkTheme = createTheme({
  id: "pure-dark",
  isDark: true,
  palette: {
    pageBackground: "#000000",
    surface: "#000000",
    border: "#262626",
    textPrimary: "#FFFFFF",
    textSecondary: "#A3A3A3",
    textMuted: "#737373",
    heading: "#FFFFFF",
    accent: "#FF8B1A",
    accentSecondary: "#8F9CFF",
    error: "#F87171",
    surfaceMuted: "#171717",
    overlay: "#000000DF",
  },
  colors: {
    divider: "#1A1A1A",
    codeBackground: "#0A0A0A",
    tableBackground: "#050505",
    link: "#FF8B1A",
    fabBackground: "#FFFFFF",
    fabIcon: "#000000",
    sheetHandle: "#404040",
    themeOptionBorder: "#404040",
    tocItemActiveBackground: "#171717",
  },
});
