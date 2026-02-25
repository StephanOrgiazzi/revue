import { createTheme } from "@/shared/themes/themePrimitives";

export const midnightTheme = createTheme({
  id: "midnight",
  isDark: true,
  palette: {
    pageBackground: "#161d23",
    surface: "#11171D",
    border: "#FFFFFF1A",
    textPrimary: "#FFFFFF",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    heading: "#FFFFFF",
    accent: "#FF8B1A",
    accentSecondary: "#8F9CFF",
    error: "#F87171",
    surfaceMuted: "#1F2937",
    overlay: "#000000BF",
  },
  colors: {
    divider: "#FFFFFF0A",
    codeBackground: "#1E293B",
    tableBackground: "#0F172A",
    link: "#FF8B1A",
    fabBackground: "#E2E8F0",
    fabIcon: "#0F172A",
    sheetHandle: "#4B5563",
    themeOptionBorder: "#4B5563",
  },
});
